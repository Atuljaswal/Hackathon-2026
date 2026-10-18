
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from "@livekit/components-react";

import "@livekit/components-styles";

export default function SkillCall({
  token,
  serverUrl,
  onLeave,
  voiceOnly = false,
}) {
  return (
    <div
      data-lk-theme="default"
      style={{ height: "75vh" }}
    >
      <LiveKitRoom
        token={token}
        serverUrl={serverUrl}
        connect={true}
        audio={true}
        video={!voiceOnly}
        onDisconnected={onLeave}
        onError={(error) => {
          console.error("LiveKit error:", error);
          alert("Unable to connect to the call.");
        }}
      >
        <VideoConference />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}
