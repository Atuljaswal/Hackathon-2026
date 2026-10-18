import { useCallback, useEffect, useRef, useState } from 'react';
import { Room, RoomEvent, Track } from 'livekit-client';
import { getLiveKitToken } from '../livekitService.js';

/**
 * UI-independent, opt-in LiveKit call for an accepted Firebase match.
 *
 * Dev 2 owns the UI; this hook owns the token request, the LiveKit room,
 * local/remote tracks, device choices, and disconnect/cleanup.
 *
 * `active` should be false when the chat is not visible. It causes an immediate
 * disconnect, even if a persistent matchmaking component remains mounted.
 */
export function useMatchCall({ matchId, peerUid, active = true } = {}) {
  const roomRef = useRef(null);
  const generationRef = useRef(0);
  const mountedRef = useRef(true);
  const connectingRef = useRef(false);
  const videoChoiceRef = useRef('');
  const audioChoiceRef = useRef('');

  const [status, setStatus] = useState('idle'); // idle | connecting | connected | reconnecting | error
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [remoteVideoTrack, setRemoteVideoTrack] = useState(null);
  const [remoteAudioTrack, setRemoteAudioTrack] = useState(null);
  const [peerConnected, setPeerConnected] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [microphoneEnabled, setMicrophoneEnabled] = useState(false);
  const [audioPlaybackBlocked, setAudioPlaybackBlocked] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [microphones, setMicrophones] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [selectedMicrophoneId, setSelectedMicrophoneId] = useState('');

  const syncTracks = useCallback((room) => {
    if (!mountedRef.current || roomRef.current !== room) return;

    const ownCamera = room.localParticipant.getTrackPublication(Track.Source.Camera);
    setLocalVideoTrack(!ownCamera?.isMuted ? (ownCamera?.videoTrack || ownCamera?.track || null) : null);
    setCameraEnabled(room.localParticipant.isCameraEnabled);
    setMicrophoneEnabled(room.localParticipant.isMicrophoneEnabled);

    const peer = peerUid
      ? room.remoteParticipants.get(peerUid)
      : [...room.remoteParticipants.values()][0];
    setPeerConnected(Boolean(peer));
    const camera = peer?.getTrackPublication(Track.Source.Camera);
    const microphone = peer?.getTrackPublication(Track.Source.Microphone);
    setRemoteVideoTrack(camera?.isSubscribed && !camera.isMuted ? camera.videoTrack || null : null);
    setRemoteAudioTrack(microphone?.isSubscribed && !microphone.isMuted ? microphone.audioTrack || null : null);
  }, [peerUid]);

  // By default, listing devices does not request camera/microphone permission.
  // Device names may be blank until permission has been granted.
  const refreshDevices = useCallback(async () => {
    const [video, audio] = await Promise.all([
      Room.getLocalDevices('videoinput', false),
      Room.getLocalDevices('audioinput', false),
    ]);
    if (mountedRef.current) {
      setCameras(video.map((d, i) => ({ deviceId: d.deviceId, label: d.label || `Camera ${i + 1}` })));
      setMicrophones(audio.map((d, i) => ({ deviceId: d.deviceId, label: d.label || `Microphone ${i + 1}` })));
    }
  }, []);

  const leaveCall = useCallback(() => {
    generationRef.current += 1; // Ignore late token/connection responses.
    connectingRef.current = false;
    const oldRoom = roomRef.current;
    roomRef.current = null;
    if (oldRoom) void oldRoom.disconnect(true).catch(() => {});
    if (mountedRef.current) {
      setStatus('idle');
      setBusy(false);
      setError('');
      setLocalVideoTrack(null);
      setRemoteVideoTrack(null);
      setRemoteAudioTrack(null);
      setCameraEnabled(false);
      setMicrophoneEnabled(false);
      setAudioPlaybackBlocked(false);
      setPeerConnected(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void refreshDevices().catch(() => {});
    return () => { mountedRef.current = false; generationRef.current += 1;
      const room = roomRef.current; roomRef.current = null;
      if (room) void room.disconnect(true).catch(() => {});
    };
  }, [refreshDevices]);

  // Update the available devices when hardware changes, a new tab is opened,
  // or the user returns to the browser. No camera/microphone permission requested.
  useEffect(() => {
    const update = () => { void refreshDevices().catch(() => {}); };
    const onVisible = () => { if (document.visibilityState === 'visible') update(); };
    navigator.mediaDevices?.addEventListener?.('devicechange', update);
    window.addEventListener('focus', update);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      navigator.mediaDevices?.removeEventListener?.('devicechange', update);
      window.removeEventListener('focus', update);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refreshDevices]);

  // Browser autoplay can block incoming voice. Retry on the next user gesture,
  // without requiring a permanent "Enable audio playback" control.
  useEffect(() => {
    if (status !== 'connected' && status !== 'reconnecting') return undefined;
    const tryPlayback = () => {
      const room = roomRef.current;
      if (!room || room.canPlaybackAudio) return;
      void room.startAudio().then(() => {
        if (roomRef.current === room && mountedRef.current) setAudioPlaybackBlocked(!room.canPlaybackAudio);
      }).catch(() => {
        if (roomRef.current === room && mountedRef.current) setAudioPlaybackBlocked(true);
      });
    };
    document.addEventListener('pointerdown', tryPlayback);
    document.addEventListener('keydown', tryPlayback);
    return () => {
      document.removeEventListener('pointerdown', tryPlayback);
      document.removeEventListener('keydown', tryPlayback);
    };
  }, [status]);

  // Changing accepted match IDs, or hiding/leaving the chat, ends the call.
  useEffect(() => {
    // A different match, or a hidden chat, must never reuse old camera tracks.
    leaveCall();
    return () => {
      generationRef.current += 1;
      connectingRef.current = false;
      const room = roomRef.current;
      roomRef.current = null;
      if (room) void room.disconnect(true).catch(() => {});
    };
  }, [active, matchId, leaveCall]);

  useEffect(() => {
    if (roomRef.current) syncTracks(roomRef.current);
  }, [peerUid, syncTracks]);

  const joinCall = useCallback(async () => {
    if (!active || !matchId || connectingRef.current || roomRef.current) return;
    const generation = ++generationRef.current;
    connectingRef.current = true;
    setStatus('connecting');
    setError('');

    let room = null;
    try {
      // Firebase ID token + server-side accepted-match authorization.
      const result = await getLiveKitToken(matchId);
      if (!result?.token || !result?.serverUrl) throw new Error('The token server did not return a LiveKit token and URL.');
      if (generation !== generationRef.current || !mountedRef.current) return;

      room = new Room({ adaptiveStream: true, dynacast: true });
      roomRef.current = room;
      const sync = () => syncTracks(room);
      room.on(RoomEvent.ParticipantConnected, sync);
      room.on(RoomEvent.ParticipantDisconnected, sync);
      room.on(RoomEvent.TrackSubscribed, sync);
      room.on(RoomEvent.TrackUnsubscribed, sync);
      room.on(RoomEvent.TrackPublished, sync);
      room.on(RoomEvent.TrackUnpublished, sync);
      room.on(RoomEvent.TrackMuted, sync);
      room.on(RoomEvent.TrackUnmuted, sync);
      room.on(RoomEvent.LocalTrackPublished, sync);
      room.on(RoomEvent.LocalTrackUnpublished, sync);
      room.on(RoomEvent.MediaDevicesChanged, () => void refreshDevices().catch(() => {}));
      room.on(RoomEvent.AudioPlaybackStatusChanged, () => {
        if (roomRef.current === room && mountedRef.current) setAudioPlaybackBlocked(!room.canPlaybackAudio);
      });
      room.on(RoomEvent.Reconnecting, () => { if (roomRef.current === room) setStatus('reconnecting'); });
      room.on(RoomEvent.Reconnected, () => { if (roomRef.current === room) { setStatus('connected'); sync(); } });
      room.on(RoomEvent.Disconnected, () => {
        if (roomRef.current !== room) return;
        roomRef.current = null;
        generationRef.current += 1;
        connectingRef.current = false;
        setStatus('idle');
        setLocalVideoTrack(null); setRemoteVideoTrack(null); setRemoteAudioTrack(null);
        setPeerConnected(false); setCameraEnabled(false); setMicrophoneEnabled(false);
        setAudioPlaybackBlocked(false);
      });

      await room.connect(result.serverUrl, result.token);
      if (generation !== generationRef.current || roomRef.current !== room) {
        await room.disconnect(true);
        return;
      }
      // A voice call never requires a camera. Connect first so users can hear
      // each other even when camera hardware is missing or unavailable.
      syncTracks(room);
      setStatus('connected');

      // The browser may allow playback immediately. If not, the first later
      // user click or key press retries it without an extra playback button.
      void room.startAudio().then(() => {
        if (roomRef.current === room && mountedRef.current) setAudioPlaybackBlocked(!room.canPlaybackAudio);
      }).catch(() => {
        if (roomRef.current === room && mountedRef.current) setAudioPlaybackBlocked(true);
      });

      // Start voice with the mic ON only when the user explicitly joins.
      // A permission/device failure must NOT disconnect the LiveKit room.
      try {
        const opts = audioChoiceRef.current ? { deviceId: { exact: audioChoiceRef.current } } : undefined;
        await room.localParticipant.setMicrophoneEnabled(true, opts);
      } catch (micError) {
        if (generation === generationRef.current && roomRef.current === room && mountedRef.current) {
          setError(`Connected without a microphone: ${micError?.message || 'Microphone unavailable'}. You can enable it later.`);
        }
      }
      if (generation !== generationRef.current || roomRef.current !== room) {
        await room.disconnect(true);
        return;
      }
      syncTracks(room);
      void refreshDevices().catch(() => {});
    } catch (err) {
      if (generation === generationRef.current && mountedRef.current) {
        if (room) {
          roomRef.current = null;
          void room.disconnect(true).catch(() => {});
        }
        setStatus('error');
        setError(err?.message || 'Unable to start video call.');
      }
    } finally {
      if (generation === generationRef.current) connectingRef.current = false;
    }
  }, [active, matchId, refreshDevices, syncTracks]);

  const toggleCamera = useCallback(async () => {
    const room = roomRef.current;
    if (!room || busy) return;
    setBusy(true); setError('');
    try {
      const turnOn = !room.localParticipant.isCameraEnabled;
      const opts = turnOn && videoChoiceRef.current ? { deviceId: { exact: videoChoiceRef.current } } : undefined;
      await room.localParticipant.setCameraEnabled(turnOn, opts);
      syncTracks(room);
      void refreshDevices().catch(() => {});
    } catch (err) { setError(`Camera unavailable (voice call is still active): ${err?.message || 'Cannot start camera.'}`); }
    finally { if (mountedRef.current) setBusy(false); }
  }, [busy, refreshDevices, syncTracks]);

  const toggleMicrophone = useCallback(async () => {
    const room = roomRef.current;
    if (!room || busy) return;
    setBusy(true); setError('');
    try {
      const turnOn = !room.localParticipant.isMicrophoneEnabled;
      const opts = turnOn && audioChoiceRef.current ? { deviceId: { exact: audioChoiceRef.current } } : undefined;
      await room.localParticipant.setMicrophoneEnabled(turnOn, opts);
      syncTracks(room);
      void refreshDevices().catch(() => {});
    } catch (err) { setError(err?.message || 'Cannot toggle the microphone.'); }
    finally { if (mountedRef.current) setBusy(false); }
  }, [busy, refreshDevices, syncTracks]);

  const selectCamera = useCallback(async (deviceId) => {
    videoChoiceRef.current = deviceId;
    setSelectedCameraId(deviceId);
    const room = roomRef.current;
    if (!room || !room.localParticipant.isCameraEnabled || !deviceId) return;
    setBusy(true); setError('');
    try {
      const ok = await room.switchActiveDevice('videoinput', deviceId);
      if (!ok) throw new Error('The selected camera is unavailable.');
      syncTracks(room);
    } catch (err) { setError(err?.message || 'Cannot change camera.'); }
    finally { if (mountedRef.current) setBusy(false); }
  }, [syncTracks]);

  const selectMicrophone = useCallback(async (deviceId) => {
    audioChoiceRef.current = deviceId;
    setSelectedMicrophoneId(deviceId);
    const room = roomRef.current;
    if (!room || !room.localParticipant.isMicrophoneEnabled || !deviceId) return;
    setBusy(true); setError('');
    try {
      const ok = await room.switchActiveDevice('audioinput', deviceId);
      if (!ok) throw new Error('The selected microphone is unavailable.');
      syncTracks(room);
    } catch (err) { setError(err?.message || 'Cannot change microphone.'); }
    finally { if (mountedRef.current) setBusy(false); }
  }, [syncTracks]);

  return {
    status, error, busy, peerConnected, audioPlaybackBlocked,
    localVideoTrack, remoteVideoTrack, remoteAudioTrack,
    cameraEnabled, microphoneEnabled,
    cameras, microphones, selectedCameraId, selectedMicrophoneId,
    joinCall, leaveCall, toggleCamera, toggleMicrophone,
    selectCamera, selectMicrophone, refreshDevices,
  };
}
