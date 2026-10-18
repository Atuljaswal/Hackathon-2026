import { useMatchCall } from '../hooks/useMatchCall.js';
import { MatchVideoTrack, MatchAudioTrack } from './MatchMediaTrack.jsx';

/** Temporary two-user testing UI; remove once Dev 2 wires up the final design. */
export default function MatchCallDevPanel({ matchId, peerUid, peerName = 'Partner', active = true }) {
  const call = useMatchCall({ matchId, peerUid, active });
  return <section style={{padding: 12, border: '1px solid #b8c6d8', borderRadius: 8}} aria-label="LiveKit camera test">
    <strong>LiveKit developer test — {call.status}</strong>
    <div style={{display: 'grid', gap: 8, marginTop: 12}}>
      <div>
        <div>{peerName} — {call.peerConnected ? 'in room' : 'not in room'}</div>
        {call.remoteVideoTrack
          ? <MatchVideoTrack track={call.remoteVideoTrack} style={{width: '100%', maxHeight: 240, background: '#111'}} />
          : <div style={{minHeight: 110, background: '#172338', color: '#fff', padding: 20}}>Waiting for partner video</div>}
      </div>
      <div>
        <div>You</div>
        {call.localVideoTrack
          ? <MatchVideoTrack track={call.localVideoTrack} muted style={{width: '100%', maxHeight: 240, background: '#111'}} />
          : <div style={{minHeight: 110, background: '#172338', color: '#fff', padding: 20}}>Camera off</div>}
      </div>
    </div>
    <MatchAudioTrack track={call.remoteAudioTrack}/>
    <div style={{display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10}}>
      {call.status === 'idle' || call.status === 'error'
        ? <button type="button" onClick={call.joinCall} disabled={!active}>Start voice call</button>
        : <button type="button" onClick={call.leaveCall}>Leave call</button>}
      <button type="button" onClick={call.toggleCamera} disabled={call.status !== 'connected' || call.busy}>{call.cameraEnabled ? 'Turn camera off' : 'Turn camera on'}</button>
      <button type="button" onClick={call.toggleMicrophone} disabled={call.status !== 'connected' || call.busy}>{call.microphoneEnabled ? 'Mute microphone' : 'Unmute microphone'}</button>
    </div>
    <div style={{display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10}}>
      <label>Camera: <select value={call.selectedCameraId} onFocus={() => void call.refreshDevices().catch(() => {})} onChange={e => void call.selectCamera(e.target.value)}>
        <option value="">Default camera</option>
        {call.cameras.filter(d => d.deviceId).map(d => <option key={d.deviceId} value={d.deviceId}>{d.label}</option>)}
      </select></label>
      <label>Microphone: <select value={call.selectedMicrophoneId} onFocus={() => void call.refreshDevices().catch(() => {})} onChange={e => void call.selectMicrophone(e.target.value)}>
        <option value="">Default microphone</option>
        {call.microphones.filter(d => d.deviceId).map(d => <option key={d.deviceId} value={d.deviceId}>{d.label}</option>)}
      </select></label>
    </div>
    {call.audioPlaybackBlocked && <p role="status">Your browser blocked incoming audio. Click anywhere on the page to enable it.</p>}
    {call.error && <p role="alert" style={{color: '#a11'}}>{call.error}</p>}
  </section>;
}
