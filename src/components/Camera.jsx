import { useCallback, useEffect, useRef, useState } from "react";
import '../chat.css'

function describeError(err) {
  switch (err?.name) {
    case "NotAllowedError":
    case "SecurityError":
      return "Camera access was blocked. Allow camera access in your browser's site settings, then try again.";
    case "NotFoundError":
    case "OverconstrainedError":
      return "No matching camera was found. Connect a camera or pick a different one.";
    case "NotReadableError":
    case "AbortError":
      return "The camera is in use by another app. Close it there, then try again.";
    default:
      return "The camera couldn't be started. Try again.";
  }
}

export default function CameraView({ autoStart = true }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const requestRef = useRef(0); // guards against overlapping start() calls

  const [devices, setDevices] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [status, setStatus] = useState("off"); // off | starting | live | error
  const [error, setError] = useState("");
  const [mirrored, setMirrored] = useState(true);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  // Device labels are only available after the user has granted permission,
  // so this is called after a stream starts and on "devicechange".
  const refreshDevices = useCallback(async () => {
    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      setDevices(all.filter((d) => d.kind === "videoinput"));
    } catch {
      /* listing is optional; the camera still works without it */
    }
  }, []);

  const start = useCallback(
    async (deviceId) => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("error");
        setError("This browser doesn't support camera access, or the page isn't served over HTTPS.");
        return;
      }

      const requestId = ++requestRef.current;
      stopStream();
      setStatus("starting");
      setError("");

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: deviceId ? { deviceId: { exact: deviceId } } : true,
          audio: false,
        });

        // A newer request (or unmount) superseded this one.
        if (requestId !== requestRef.current) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        const [track] = stream.getVideoTracks();
        const settings = track.getSettings();

        // If the camera is unplugged or revoked, reflect that in the UI.
        track.addEventListener("ended", () => {
          if (streamRef.current === stream) {
            stopStream();
            setStatus("off");
          }
        });

        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;

        setActiveId(settings.deviceId ?? deviceId ?? null);
        // Mirror selfie-style cameras; leave rear cameras unmirrored.
        setMirrored(settings.facingMode !== "environment");
        setStatus("live");
        refreshDevices();
      } catch (err) {
        if (requestId !== requestRef.current) return;
        setStatus("error");
        setError(describeError(err));
      }
    },
    [stopStream, refreshDevices]
  );

  const turnOff = useCallback(() => {
    requestRef.current++; // cancel any start still in flight
    stopStream();
    setStatus("off");
  }, [stopStream]);

  useEffect(() => {
    if (autoStart) start();

    const media = navigator.mediaDevices;
    media?.addEventListener?.("devicechange", refreshDevices);

    return () => {
      media?.removeEventListener?.("devicechange", refreshDevices);
      requestRef.current++;
      stopStream();
    };
  }, [autoStart, start, refreshDevices, stopStream]);

  const isLive = status === "live";
  const isStarting = status === "starting";

  return (
    <section className="camera" aria-label="Camera preview">

      <div className="camera__frame">
        <video
          ref={videoRef}
          className={`camera__video${mirrored ? " is-mirrored" : ""}`}
          autoPlay
          playsInline
          muted
          hidden={!isLive}
        />
        
        <span className="camera__badge">
          <span className="camera__dot" aria-hidden="true" />
          You
        </span>

        {!isLive && (
          <div className="camera__placeholder" role="status">
            {isStarting && <p>Starting camera…</p>}
            {status === "off" && <p>Camera is off</p>}
            {status === "error" && <p className="camera__error">{error}</p>}
          </div>
        )}
      </div>

      <div className="camera__controls">
        {devices.length > 1 && (
          <label className="camera__select">
            <span className="camera__sr">Select camera</span>
            <select
              value={activeId ?? ""}
              onChange={(e) => start(e.target.value)}
              disabled={isStarting}
            >
              {devices.map((device, i) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Camera ${i + 1}`}
                </option>
              ))}
            </select>
          </label>
        )}

        {isLive || isStarting ? (
          <button type="button" className="camera__btn camera__btn--stop" onClick={turnOff}>
            Turn off camera
          </button>
        ) : (
          <button type="button" className="camera__btn camera__btn--start" onClick={() => start(activeId)}>
            {status === "error" ? "Try again" : "Turn on camera"}
          </button>
        )}
      </div>
    </section>
  );
}


