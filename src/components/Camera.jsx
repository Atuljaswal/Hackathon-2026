import { useEffect, useRef } from "react";
import '../chat.css'

/**
 * Video preview only. Capture lives in useLocalMedia(); pass it `media.camera`.
 *
 *  - camera:   media.camera from useLocalMedia()
 *  - label:    name shown in the corner badge
 *  - mirrored: force mirroring on/off (defaults to the camera's own setting)
 */
export default function CameraView({ camera, label = "You", mirrored }) {
  const videoRef = useRef(null);
  const { status, stream, error } = camera;
  const isLive = status === "live";
  const isStarting = status === "starting";
  const mirror = mirrored ?? camera.mirrored;

  // Attach (or detach) the shared stream. The stream is owned by the hook, so
  // nothing is stopped here when this preview unmounts.
  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream;
  }, [stream]);

  return (
    <section className="camera" aria-label={`Camera preview: ${label}`}>

      <div className="camera__frame">
        <video
          ref={videoRef}
          className={`camera__video${mirror ? " is-mirrored" : ""}`}
          autoPlay
          playsInline
          muted
          hidden={!isLive}
        />

        <span className="camera__badge">
          <span className="camera__dot" aria-hidden="true" />
          {label}
        </span>

        {!isLive && (
          <div className="camera__placeholder" role="status">
            {isStarting && <p>Starting camera…</p>}
            {status === "error" && <p className="camera__error">{error}</p>}
            {(status === "off" || status === "idle") && <p>Camera is off</p>}
          </div>
        )}
      </div>
    </section>
  );
}
