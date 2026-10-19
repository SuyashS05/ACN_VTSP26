"use client";

import React from "react";
import { useParams } from "next/navigation";
import { LiveKitStage } from "../../../../components/live-collab/LiveKitStage";
import { YjsWhiteboardCanvas } from "../../../../components/live-collab/YjsWhiteboardCanvas";
import { ModeratedLiveChat } from "../../../../components/live-collab/ModeratedLiveChat";

export default function LiveRoomPage() {
  const params = useParams();
  const roomId = (params?.roomId as string) || "live_room_01";
  return (
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, padding: 24, background: "#080c14", color: "#f8fafc" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <LiveKitStage roomId={roomId} />
        <YjsWhiteboardCanvas roomId={roomId} />
      </div>
      <ModeratedLiveChat roomId={roomId} />
    </div>
  );
}
