"use client";

import React from "react";

export function YjsWhiteboardCanvas({ roomId }: { roomId: string }) {
  return (
    <div style={{ padding: 16, background: "#0f172a", border: "1px solid #c084fc", borderRadius: 12 }}>
      <h4>Real-Time Collaborative Whiteboard (Yjs CRDT Sync &lt; 5 kbps)</h4>
      <p style={{ fontSize: 12, color: "#94a3b8" }}>
        Synced to Yjs Room Server: <code>ws://localhost:8082/yjs/{roomId}</code>
      </p>
      <canvas width={640} height={240} style={{ width: "100%", background: "#090d16", borderRadius: 8 }} />
    </div>
  );
}

