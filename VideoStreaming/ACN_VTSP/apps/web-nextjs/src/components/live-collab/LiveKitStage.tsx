"use client";

import React from "react";

export function LiveKitStage({ roomId }: { roomId: string }) {
  return (
    <div style={{ padding: 16, background: "#0f172a", border: "1px solid #334155", borderRadius: 12 }}>
      <h4>LiveKit WebRTC Co-Hosting Stage (&lt;300ms SFU) + MediaMTX LL-HLS (0.5s parts)</h4>
      <p style={{ fontSize: 13, color: "#94a3b8" }}>
        Active Room: <code>{roomId}</code> • SFU Endpoint: <code>ws://localhost:7880</code> • LL-HLS: <code>http://localhost:8888/{roomId}/index.m3u8</code>
      </p>
    </div>
  );
}

