import { MatchVideoTrack } from './MatchMediaTrack.jsx';
import '../chat.css';

/**
 * One video tile in the call. Presentation only: LiveKit owns the track.
 * Uses the existing .camera styles from chat.css.
 *
 *  - track:       a LiveKit video track, or null when there's nothing to show
 *  - label:       name shown in the corner badge
 *  - muted:       true for your own tile (so it never plays back to you)
 *  - mirrored:    flip horizontally (use for your own tile)
 *  - placeholder: message shown while there is no video
 */
export default function CallVideoTile({ track, label, muted = false, mirrored = false, placeholder }) {
  return (
    <section className="camera" aria-label={`Video: ${label}`}>
      <div className="camera__frame">
        {track && (
          <MatchVideoTrack
            track={track}
            muted={muted}
            className={`camera__video${mirrored ? ' is-mirrored' : ''}`}
          />
        )}

        <span className="camera__badge">
          <span className="camera__dot" aria-hidden="true" />
          {label}
        </span>

        {!track && (
          <div className="camera__placeholder" role="status">
            <p>{placeholder}</p>
          </div>
        )}
      </div>
    </section>
  );
}
