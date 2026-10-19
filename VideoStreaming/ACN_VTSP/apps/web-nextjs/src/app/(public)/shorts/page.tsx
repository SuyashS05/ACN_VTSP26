"use client";

import React, { useState, useEffect } from "react";
import { ShortsPrefetchEngine } from "../../../lib/prefetch-engine";

const SHORTS_FEED = [
  { id: "vid_8842", title: "Zero-Egress CMAF Streaming (sample-3.mp4)", src: "http://localhost:8080/sample-3.mp4" },
  { id: "vid_9104", title: "Sub-5ms Go + ONNX Live Chat Moderation (sd.mp4)", src: "http://localhost:8080/sd.mp4" },
];

export default function VerticalShortsPage() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const engine = new ShortsPrefetchEngine("http://localhost:8080/out_cmaf");
    engine.onViewportChange(idx, SHORTS_FEED.map((s) => s.id));
  }, [idx]);

  const active = SHORTS_FEED[idx];

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: 24, background: "#080c14", color: "#f8fafc" }}>
      <h2>9:16 Vertical Shorts Feed • Next-2-Video Segment Pre-Fetch (&lt;300ms TTFF)</h2>
      <video src={active.src} controls autoPlay loop style={{ width: 320, aspectRatio: "9/16", borderRadius: 20, border: "2px solid #38bdf8" }} />
      <h3>{active.title}</h3>
      <button onClick={() => setIdx((idx + 1) % SHORTS_FEED.length)} style={{ padding: "10px 18px", borderRadius: 8, background: "#38bdf8", border: "none", fontWeight: 700 }}>
        Swipe Next Short (sample-3.mp4 ↔ sd.mp4)
      </button>
    </div>
  );
}

