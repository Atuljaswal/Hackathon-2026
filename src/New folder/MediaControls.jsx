import { Mic, MicOff, Video, VideoOff } from 'lucide-react';
import './MediaControls.css';

function DeviceSelect({ label, defaultLabel, devices, value, disabled, onFocus, onChange }) {
  const real = devices.filter((d) => d.deviceId);
  if (real.length < 2) return null; // nothing to choose between
  return (
    <label className="media-controls__select">
      <span className="media-controls__sr">{label}</span>
      <select
        value={value}
        disabled={disabled}
        onFocus={onFocus}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{defaultLabel}</option>
        {real.map((d) => (
          <option key={d.deviceId} value={d.deviceId}>
            {d.label}
          </option>
        ))}
      </select>
    </label>
  );
}

// Icon-only button; `label` is the accessible name and the hover tooltip.
function IconButton({ label, off = false, disabled = false, onClick, children }) {
  return (
    <button
      type="button"
      className={`media-controls__btn${off ? ' media-controls__btn--off' : ''}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}

/**
 * One row: [mic options] [mic toggle] [camera options] [camera toggle].
 * Driven by the object returned from useMatchCall(). Picking another device
 * never turns a switched-off camera or microphone back on; the choice is
 * remembered and used the next time it is turned on.
 */
export default function MediaControls({ call }) {
  const connected = call.status === 'connected';
  const canToggle = connected && !call.busy;
  const refresh = () => void call.refreshDevices().catch(() => {});

  const micLabel = !connected
    ? 'Microphone (join the call first)'
    : call.microphoneEnabled ? 'Mute microphone' : 'Unmute microphone';
  const cameraLabel = !connected
    ? 'Camera (join the call first)'
    : call.cameraEnabled ? 'Turn off camera' : 'Turn on camera';

  const hasMicSelect = call.microphones.filter((d) => d.deviceId).length > 1;
  const hasCameraSelect = call.cameras.filter((d) => d.deviceId).length > 1;

  return (
    <div className="media-controls" role="group" aria-label="Microphone and camera controls">
      <div className={`media-controls__group${hasMicSelect ? '' : ' media-controls__group--bare'}`}>
        <DeviceSelect
          label="Select microphone"
          defaultLabel="Default microphone"
          devices={call.microphones}
          value={call.selectedMicrophoneId}
          disabled={call.busy}
          onFocus={refresh}
          onChange={call.selectMicrophone}
        />
        <IconButton
          label={micLabel}
          off={connected && !call.microphoneEnabled}
          disabled={!canToggle}
          onClick={call.toggleMicrophone}
        >
          {connected && !call.microphoneEnabled
            ? <MicOff size={18} aria-hidden="true" />
            : <Mic size={18} aria-hidden="true" />}
        </IconButton>
      </div>

      <div className={`media-controls__group${hasCameraSelect ? '' : ' media-controls__group--bare'}`}>
        <DeviceSelect
          label="Select camera"
          defaultLabel="Default camera"
          devices={call.cameras}
          value={call.selectedCameraId}
          disabled={call.busy}
          onFocus={refresh}
          onChange={call.selectCamera}
        />
        <IconButton
          label={cameraLabel}
          off={connected && !call.cameraEnabled}
          disabled={!canToggle}
          onClick={call.toggleCamera}
        >
          {connected && call.cameraEnabled
            ? <Video size={18} aria-hidden="true" />
            : <VideoOff size={18} aria-hidden="true" />}
        </IconButton>
      </div>
    </div>
  );
}
