"use client";

import React from "react";

export function SpriteSheetScrubber({
  spriteUrl,
  onSeek,
}: {
  spriteUrl: string;
  onSeek?: (seconds: number) => void;
}) {
  const timestamps = [0, 5, 10, 15, 20, 25];
  return (
    <div style={{ marginTop: 12, padding: 10, background: "#0f172a", border: "1px solid #334155", borderRadius: 10 }}>
      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>
        WebP Timeline Hover Scrubber (<code>spritesheet.webp</code> + <code>spritesheet.vtt</code> — Click any frame to jump):
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6 }}>
        {timestamps.map((sec, idx) => (
          <button
            key={sec}
            onClick={() => onSeek?.(sec)}
            style={{
              height: 56,
              border: "1px solid #38bdf8",
              borderRadius: 6,
              backgroundImage: `url(${spriteUrl})`,
              backgroundPosition: `-${idx * 160}px 0px`,
              backgroundSize: "960px 90px",
              color: "#f8fafc",
              fontWeight: 700,
              fontSize: 11,
              cursor: "pointer",
              textShadow: "0 1px 4px #000",
            }}
          >
            00:{String(sec).padStart(2, "0")}
          </button>
        ))}
      </div>
    </div>
  );
}

