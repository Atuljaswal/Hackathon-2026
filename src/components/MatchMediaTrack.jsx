import { useEffect, useRef } from 'react';

// Tiny presentation bridge: Dev 2 decides sizing/styling of the video element.
// LiveKit attaches its MediaStreamTrack; React does not own srcObject.
export function MatchVideoTrack({ track, muted = false, ...props }) {
  const videoRef = useRef(null);
  useEffect(() => {
    const element = videoRef.current;
    if (!track || !element) return;
    track.attach(element);
    return () => { track.detach(element); };
  }, [track]);
  return <video ref={videoRef} autoPlay playsInline muted={muted} {...props}/>;
}

export function MatchAudioTrack({ track }) {
  const audioRef = useRef(null);
  useEffect(() => {
    const element = audioRef.current;
    if (!track || !element) return;
    track.attach(element);
    return () => { track.detach(element); };
  }, [track]);
  return <audio ref={audioRef} autoPlay/>;
}
