import { Mic, MicOff, Video, VideoOff } from "lucide-react";
import "../MediaControls.css";

function DeviceSelect({ label, fallbackName, input }) {
  if (input.devices.length < 2) return null;
  return (
    <label className="media-controls__select">
      <span className="media-controls__sr">{label}</span>
      <select
        value={input.deviceId ?? ""}
        onChange={(e) => input.select(e.target.value)}
        disabled={input.status === "starting"}
      >
        {input.devices.map((device, i) => (
          <option key={device.deviceId} value={device.deviceId}>
            {device.label || `${fallbackName} ${i + 1}`}
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
      className={`media-controls__btn${off ? " media-controls__btn--off" : ""}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}

function MicButton({ mic }) {
  if (mic.status === "live") {
    return (
      <IconButton label={mic.muted ? "Unmute microphone" : "Mute microphone"} off={mic.muted} onClick={mic.toggleMute}>
        {mic.muted ? <MicOff size={18} aria-hidden="true" /> : <Mic size={18} aria-hidden="true" />}
      </IconButton>
    );
  }
  if (mic.status === "starting") {
    return (
      <IconButton label="Starting microphone" disabled>
        <Mic size={18} aria-hidden="true" />
      </IconButton>
    );
  }
  return (
    <IconButton label={mic.status === "error" ? "Retry microphone" : "Turn on microphone"} onClick={mic.turnOn}>
      <Mic size={18} aria-hidden="true" />
    </IconButton>
  );
}

function CameraButton({ camera }) {
  if (camera.status === "live") {
    return (
      <IconButton label="Turn off camera" onClick={camera.turnOff}>
        <Video size={18} aria-hidden="true" />
      </IconButton>
    );
  }
  if (camera.status === "starting") {
    return (
      <IconButton label="Starting camera" disabled>
        <Video size={18} aria-hidden="true" />
      </IconButton>
    );
  }
  return (
    <IconButton
      label={camera.status === "error" ? "Retry camera" : "Turn on camera"}
      off={camera.status === "off"}
      onClick={camera.turnOn}
    >
      <VideoOff size={18} aria-hidden="true" />
    </IconButton>
  );
}

/**
 * One row: [mic options] [mic toggle] [camera options] [camera toggle].
 * Pass the object returned by useLocalMedia().
 */
export default function MediaControls({ media }) {
  const { mic, camera } = media;
  const group = (input) => `media-controls__group${input.devices.length > 1 ? "" : " media-controls__group--bare"}`;

  return (
    <div className="media-controls" role="group" aria-label="Microphone and camera controls">
      <div className={group(mic)}>
        <DeviceSelect label="Select microphone" fallbackName="Microphone" input={mic} />
        <MicButton mic={mic} />
      </div>
      <div className={group(camera)}>
        <DeviceSelect label="Select camera" fallbackName="Camera" input={camera} />
        <CameraButton camera={camera} />
      </div>
      {mic.status === "error" && mic.error && (
        <p className="media-controls__error" role="status">
          {mic.error}
        </p>
      )}
    </div>
  );
}
