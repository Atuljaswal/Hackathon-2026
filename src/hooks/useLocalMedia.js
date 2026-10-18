import { useCallback, useEffect, useRef, useState } from "react";

const NOUN = { video: "camera", audio: "microphone" };
const DEVICE_KIND = { video: "videoinput", audio: "audioinput" };

function describeError(kind, err) {
  const noun = NOUN[kind];
  const Noun = noun[0].toUpperCase() + noun.slice(1);
  switch (err?.name) {
    case "NotAllowedError":
    case "SecurityError":
      return `${Noun} access was blocked. Allow it in your browser's site settings, then try again.`;
    case "NotFoundError":
    case "OverconstrainedError":
      return `No matching ${noun} was found. Connect one or pick a different one.`;
    case "NotReadableError":
    case "AbortError":
      return `The ${noun} is in use by another app. Close it there, then try again.`;
    default:
      return `The ${noun} couldn't be started. Try again.`;
  }
}

function constraintsFor(kind, id) {
  const wanted = id ? { deviceId: { exact: id } } : true;
  return kind === "video" ? { video: wanted, audio: false } : { audio: wanted, video: false };
}

// Ask for a specific device; if that device has gone away, fall back to the default one.
async function acquire(kind, id) {
  try {
    return await navigator.mediaDevices.getUserMedia(constraintsFor(kind, id));
  } catch (err) {
    if (id && (err?.name === "OverconstrainedError" || err?.name === "NotFoundError")) {
      return navigator.mediaDevices.getUserMedia(constraintsFor(kind, null));
    }
    throw err;
  }
}

/**
 * One capture device (camera or microphone).
 *
 * status: "idle"     never started (or released) - autoStart() will start it
 *         "starting" waiting for the browser
 *         "live"     capturing
 *         "off"      the user turned it off - autoStart() leaves it alone
 *         "error"    something went wrong, see `error`
 */
function useMediaInput(kind) {
  const streamRef = useRef(null);
  const requestRef = useRef(0); // guards against overlapping start() calls
  const statusRef = useRef("idle");
  const deviceIdRef = useRef(null);
  const mutedRef = useRef(false);

  const [status, setStatusState] = useState("idle");
  const [stream, setStream] = useState(null);
  const [error, setError] = useState("");
  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState(null);
  const [muted, setMuted] = useState(false);
  const [mirrored, setMirrored] = useState(true);

  const setStatus = useCallback((next) => {
    statusRef.current = next;
    setStatusState(next);
  }, []);

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setStream(null);
  }, []);

  // Device names are only available after permission is granted, so this runs
  // after a stream starts and whenever the browser reports "devicechange".
  const refreshDevices = useCallback(async () => {
    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      setDevices(all.filter((d) => d.kind === DEVICE_KIND[kind] && d.deviceId));
    } catch {
      /* the list is optional; capture still works without it */
    }
  }, [kind]);

  const start = useCallback(
    async (id) => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("error");
        setError("This browser doesn't support camera and microphone access, or the page isn't served over HTTPS.");
        return;
      }

      const requestId = ++requestRef.current;
      stopTracks();
      setStatus("starting");
      setError("");

      try {
        const next = await acquire(kind, id);

        // A newer request (or a release) superseded this one.
        if (requestId !== requestRef.current) {
          next.getTracks().forEach((track) => track.stop());
          return;
        }

        const [track] = kind === "video" ? next.getVideoTracks() : next.getAudioTracks();
        if (kind === "audio") track.enabled = !mutedRef.current; // keep mute across device switches

        // Unplugged or revoked while running.
        track.addEventListener("ended", () => {
          if (streamRef.current === next) {
            stopTracks();
            setStatus("error");
            setError(`The ${NOUN[kind]} was disconnected. Pick another one or try again.`);
            refreshDevices();
          }
        });

        const settings = track.getSettings();
        streamRef.current = next;
        deviceIdRef.current = settings.deviceId ?? id ?? null;
        setDeviceId(deviceIdRef.current);
        if (kind === "video") setMirrored(settings.facingMode !== "environment");
        setStream(next);
        setStatus("live");
        refreshDevices();
      } catch (err) {
        if (requestId !== requestRef.current) return;
        setStatus("error");
        setError(describeError(kind, err));
      }
    },
    [kind, refreshDevices, setStatus, stopTracks]
  );

  // Start only if this device has not been started (or was released). A device
  // the user switched off stays off.
  const autoStart = useCallback(() => {
    if (statusRef.current === "idle") start(deviceIdRef.current);
  }, [start]);

  const turnOn = useCallback(() => start(deviceIdRef.current), [start]);

  const turnOff = useCallback(() => {
    requestRef.current++; // cancel any start still in flight
    stopTracks();
    setStatus("off");
    setError("");
  }, [setStatus, stopTracks]);

  // Pick a different device. It only restarts capture if the device is already
  // running; if it is off, the choice is remembered for the next time it is turned on.
  const select = useCallback(
    (id) => {
      deviceIdRef.current = id;
      setDeviceId(id);
      if (statusRef.current === "live" || statusRef.current === "starting") start(id);
    },
    [start]
  );

  const toggleMute = useCallback(() => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    streamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !next;
    });
  }, []);

  // Stop capturing and go back to "idle" (the device and mute choices are kept).
  const release = useCallback(() => {
    requestRef.current++;
    stopTracks();
    setStatus("idle");
    setError("");
  }, [setStatus, stopTracks]);

  useEffect(() => {
    const media = navigator.mediaDevices;
    media?.addEventListener?.("devicechange", refreshDevices);
    return () => {
      media?.removeEventListener?.("devicechange", refreshDevices);
      requestRef.current++;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [refreshDevices]);

  return {
    status,
    stream,
    error,
    devices,
    deviceId,
    muted,
    mirrored,
    autoStart,
    turnOn,
    turnOff,
    select,
    toggleMute,
    release,
  };
}

/**
 * Camera + microphone for the matching and chat pages. Call it once, high up
 * (App), and pass the result down so the streams survive page changes.
 *
 *   media.camera.stream / media.mic.stream  -> the live MediaStreams (or null)
 *   media.releaseAll()                       -> stop both (e.g. when leaving the flow)
 */
export function useLocalMedia() {
  const camera = useMediaInput("video");
  const mic = useMediaInput("audio");
  const releaseCamera = camera.release;
  const releaseMic = mic.release;
  const releaseAll = useCallback(() => {
    releaseCamera();
    releaseMic();
  }, [releaseCamera, releaseMic]);

  return { camera, mic, releaseAll };
}

export default useLocalMedia;
