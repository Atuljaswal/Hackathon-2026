import { Phone, PhoneOff } from 'lucide-react';
import { useMatchCall } from '../hooks/useMatchCall.js';
import { MatchAudioTrack } from './MatchMediaTrack.jsx';
import CallVideoTile from './CallVideoTile.jsx';
import MediaControls from './MediaControls.jsx';
import './MatchCallPanel.css';

/**
 * The call UI for an accepted match: their video, your video, mic/camera
 * controls and a join/leave button. Replaces MatchCallDevPanel; takes the same props.
 * All LiveKit work stays in useMatchCall().
 */
export default function MatchCallPanel({ matchId, peerUid, peerName = 'Partner', active = true }) {
  const call = useMatchCall({ matchId, peerUid, active });

  const connecting = call.status === 'connecting';
  const inCall = call.status === 'connected' || call.status === 'reconnecting';

  let remotePlaceholder = `Join the call to talk with ${peerName}`;
  if (connecting) remotePlaceholder = 'Connecting…';
  else if (inCall) remotePlaceholder = call.peerConnected
    ? `${peerName}'s camera is off`
    : `Waiting for ${peerName} to join the call`;

  const statusText = {
    connecting: 'Connecting to the call',
    connected: 'Connected to the call',
    reconnecting: 'Connection lost, reconnecting',
  }[call.status] || '';

  return (
    <section className="call-panel" aria-label="Video call">
      <p className="sr-only" role="status">{statusText}</p>

      <CallVideoTile
        track={call.remoteVideoTrack}
        label={peerName}
        placeholder={remotePlaceholder}
      />
      <CallVideoTile
        track={call.localVideoTrack}
        label="You"
        muted
        mirrored
        placeholder={connecting ? 'Connecting…' : 'Camera is off'}
      />
      <MatchAudioTrack track={call.remoteAudioTrack} />

      <MediaControls call={call} />

      {inCall || connecting ? (
        <button type="button" className="btn btn-outline full" onClick={call.leaveCall}>
          <PhoneOff size={17} /> {connecting ? 'Cancel' : 'Leave call'}
        </button>
      ) : (
        <button type="button" className="btn btn-primary full" disabled={!active} onClick={call.joinCall}>
          <Phone size={17} /> {call.status === 'error' ? 'Try again' : 'Join call'}
        </button>
      )}

      {call.audioPlaybackBlocked && (
        <p className="call-panel__note" role="status">
          Your browser blocked incoming audio. Click anywhere on the page to enable it.
        </p>
      )}
      {call.error && (
        <p className="call-panel__error" role="alert">{call.error}</p>
      )}
    </section>
  );
}
