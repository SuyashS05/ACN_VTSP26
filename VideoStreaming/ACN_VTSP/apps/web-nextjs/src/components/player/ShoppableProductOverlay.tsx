"use client";

import React from "react";

export function ShoppableProductOverlay({ videoId }: { videoId: string }) {
  return (
    <a
      href="https://store.example.com/item/991"
      target="_blank"
      rel="noreferrer"
      data-video-id={videoId}
      style={{
        position: "absolute",
        top: 16,
        right: 16,
        background: "rgba(8, 12, 20, 0.92)",
        border: "1.5px solid #38bdf8",
        borderRadius: 10,
        padding: "10px 14px",
        color: "#f8fafc",
        textDecoration: "none",
        fontSize: 13,
      }}
    >
      🛒 <strong>Wireless Noise-Canceling Headphones</strong> <span style={{ color: "#34d399" }}>$129</span>
      <div style={{ fontSize: 11, color: "#94a3b8" }}>YOLOv11 + CLIP Match (Cosine: 0.93)</div>
    </a>
  );
}

