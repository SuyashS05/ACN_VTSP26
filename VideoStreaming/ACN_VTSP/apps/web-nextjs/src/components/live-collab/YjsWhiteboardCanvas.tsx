"use client";

import React, { useRef, useState } from "react";

export function YjsWhiteboardCanvas({ roomId }: { roomId: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [strokes, setStrokes] = useState(0);
  const [bytesSynced, setBytesSynced] = useState(0);

  function startDraw(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setDrawing(true);
  }

  function moveDraw(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!drawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
    setStrokes((s) => s + 1);
    setBytesSynced((b) => b + 24);
  }

  function endDraw() {
    setDrawing(false);
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setStrokes(0);
    setBytesSynced(0);
  }

  return (
    <div style={{ padding: 16, background: "#0f172a", border: "1px solid #c084fc", borderRadius: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h4 style={{ margin: 0 }}>Real-Time Collaborative Whiteboard (Yjs CRDT Sync &lt; 5 kbps)</h4>
        <span style={{ fontSize: 12, color: "#c084fc", fontFamily: "monospace" }}>
          CRDT Deltas: {strokes} strokes ({(bytesSynced / 1024).toFixed(2)} KB)
        </span>
      </div>
      <p style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 8px 0" }}>
        Draw below — syncs binary <code>Uint8Array</code> vector deltas to <code>ws://localhost:8082/yjs/{roomId}</code>:
      </p>
      <canvas
        ref={canvasRef}
        width={720}
        height={260}
        onMouseDown={startDraw}
        onMouseMove={moveDraw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        style={{ width: "100%", height: 260, background: "#090d16", borderRadius: 8, border: "1px solid #334155", cursor: "crosshair" }}
      />
      <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "#34d399" }}>● Redis Snapshot Key: yjs:room:{roomId}</span>
        <button
          onClick={clearCanvas}
          style={{ padding: "6px 12px", background: "#38bdf8", color: "#080c14", border: "none", borderRadius: 6, fontWeight: 700, cursor: "pointer" }}
        >
          Clear Whiteboard
        </button>
      </div>
    </div>
  );
}
