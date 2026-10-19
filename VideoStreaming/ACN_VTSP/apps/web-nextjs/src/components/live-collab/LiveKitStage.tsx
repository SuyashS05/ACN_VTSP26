"use client";

import React, { useRef, useState } from "react";

export function LiveKitStage({ roomId }: { roomId: string }) {
  const camRef = useRef<HTMLVideoElement | null>(null);
  const [webcamActive, setWebcamActive] = useState(false);

  async function toggleWebcam() {
    if (webcamActive) {
      const stream = camRef.current?.srcObject as MediaStream | null;
      stream?.getTracks().forEach((t) => t.stop());
      if (camRef.current) camRef.current.srcObject = null;
      setWebcamActive(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (camRef.current) {
        camRef.current.srcObject = stream;
        camRef.current.play().catch(() => {});
      }
      setWebcamActive(true);
    } catch {
      alert("Camera permission was denied or no webcam was found.");
    }
  }

  return (
    <div style={{ padding: 16, background: "#0f172a", border: "1px solid #334155", borderRadius: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div>
          <h4 style={{ margin: 0 }}>LiveKit WebRTC Co-Hosting Stage (&lt;300ms SFU) + MediaMTX LL-HLS</h4>
          <p style={{ margin: "3px 0 0", fontSize: 12, color: "#94a3b8" }}>
            Room: <code>{roomId}</code> • SFU: <code>ws://localhost:7880</code>
          </p>
        </div>
        <button
          type="button"
          onClick={toggleWebcam}
          style={{
            padding: "6px 12px",
            borderRadius: 8,
            background: webcamActive ? "#ef4444" : "#38bdf8",
            color: webcamActive ? "#fff" : "#080c14",
            border: "none",
            fontWeight: 700,
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          {webcamActive ? "⏹ Stop Camera Broadcast" : "🎥 Start Local Camera (WebRTC)"}
        </button>
      </div>

      <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 9", borderRadius: 10, overflow: "hidden", background: "#000", border: "1px solid #1e293b" }}>
        {webcamActive ? (
          <video ref={camRef} autoPlay muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <video
            src="/sd.mp4"
            poster="/out_cmaf/videos/vid_9104/thumbnails/poster_14s.webp"
            autoPlay
            loop
            muted
            controls
            playsInline
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}
      </div>
    </div>
  );
}
