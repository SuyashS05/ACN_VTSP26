"use client";

import React from "react";

export default function PublicHomeFeedPage() {
  const feedItems = [
    {
      id: "vid_8842",
      title: "Zero-Egress CMAF Streaming & KEDA Spot Architecture (sample-3.mp4)",
      aspect: "16:9",
      streamUrl: "http://localhost:8080/sample-3.mp4",
      posterUrl: "http://localhost:8080/out_cmaf/videos/vid_8842/thumbnails/poster.webp",
      score: 0.8033,
    },
    {
      id: "vid_9104",
      title: "Sub-5ms Go WebSocket Chat Moderation with Int8 ONNX (sd.mp4)",
      aspect: "9:16",
      streamUrl: "http://localhost:8080/sd.mp4",
      posterUrl: "http://localhost:8080/out_cmaf/videos/vid_8842/thumbnails/poster.webp",
      score: 0.7285,
    },
  ];

  return (
    <main style={{ background: "#080c14", color: "#f8fafc", minHeight: "100vh", padding: 24 }}>
      <h1>ACN-VTSP • Sub-20ms Two-Tower Personalized Home Feed (Redis ZSET)</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 20 }}>
        {feedItems.map((v) => (
          <article key={v.id} style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 12, padding: 16 }}>
            <video src={v.streamUrl} poster={v.posterUrl} controls muted style={{ width: "100%", borderRadius: 8 }} />
            <h3>{v.title}</h3>
            <p style={{ color: "#38bdf8", fontSize: 13 }}>
              Aspect: {v.aspect} • Two-Tower Rank Score: {v.score}
            </p>
          </article>
        ))}
      </div>
    </main>
  );
}

