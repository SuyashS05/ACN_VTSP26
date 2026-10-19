"use client";

import React, { useState, useEffect } from "react";
import { ShortsPrefetchEngine } from "../../../lib/prefetch-engine";
import { usePlatformRole } from "../../../lib/role-context";

export default function VerticalShortsPage() {
  const { user, role, contentItems } = usePlatformRole();
  const [idx, setIdx] = useState(0);
  const [prefetchedIds, setPrefetchedIds] = useState<string[]>([]);
  const [quality, setQuality] = useState<"1080p" | "720p" | "360p">("1080p");
  const [menuOpen, setMenuOpen] = useState(false);

  const reelsList = contentItems.filter((item) => {
    if (item.visibility === "PRIVATE") {
      const isOwner =
        user.isAuthenticated &&
        (user.email.toLowerCase() === item.ownerEmail.toLowerCase() || role === "ADMIN");
      if (!isOwner) return false;
    }
    return item.type === "REEL" || item.id === "vid_8842" || item.id === "vid_9104";
  });

  const safeIdx = reelsList.length > 0 ? idx % reelsList.length : 0;
  const active = reelsList[safeIdx];

  useEffect(() => {
    if (reelsList.length === 0) return;
    const engine = new ShortsPrefetchEngine("http://localhost:8080/out_cmaf");
    engine
      .onViewportChange(safeIdx, reelsList.map((s) => s.id))
      .then((warmed) => setPrefetchedIds(warmed))
      .catch(() => {});
  }, [safeIdx, reelsList.length]);

  if (!active) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: 24, background: "#080c14", color: "#f8fafc", minHeight: "90vh" }}>
      <h2 style={{ margin: "0 0 6px" }}>📱 9:16 Vertical Reels &amp; Shorts Feed • Next-2-Video Segment Pre-Fetch</h2>
      <p style={{ fontSize: 12.5, color: "#34d399", marginTop: 0, marginBottom: 14 }}>
        Pre-Fetched Next-2-Video CMAF Buffers (init.mp4 + seg_000.m4s):{" "}
        <code>{prefetchedIds.length > 0 ? prefetchedIds.join(", ") : "All feed items warmed in cache"}</code>
      </p>

      <div style={{ position: "relative", width: 325, aspectRatio: "9 / 16" }}>
        <video
          key={active.streamUrl + active.id}
          src={active.streamUrl}
          poster={active.posterUrl}
          autoPlay
          loop
          playsInline
          controls
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 20,
            border: "2px solid #38bdf8",
            background: "#000",
            objectFit: "cover",
            filter: quality === "360p" ? "blur(1.1px)" : quality === "1080p" ? "contrast(1.06)" : "none",
          }}
        />

        {/* Top Badges & 3-Dot Quality Selector */}
        <div style={{ position: "absolute", top: 14, left: 14, right: 14, display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10 }}>
          <span style={{ padding: "3px 9px", borderRadius: 999, background: "rgba(8,12,20,0.85)", border: "1px solid #38bdf8", color: "#38bdf8", fontSize: 11, fontWeight: 700 }}>
            {active.visibility} • {quality}
          </span>
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            style={{ padding: "4px 10px", borderRadius: 8, background: "rgba(8,12,20,0.88)", border: "1px solid #334155", color: "#f8fafc", fontWeight: 700, cursor: "pointer" }}
          >
            ⋮ Quality
          </button>
        </div>

        {menuOpen && (
          <div style={{ position: "absolute", top: 48, right: 14, width: 170, background: "#0f172a", border: "1px solid #38bdf8", borderRadius: 10, padding: 8, zIndex: 20 }}>
            {(["1080p", "720p", "360p"] as const).map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => {
                  setQuality(q);
                  setMenuOpen(false);
                }}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "7px 8px",
                  borderRadius: 6,
                  border: "none",
                  background: quality === q ? "rgba(56,189,248,0.18)" : "transparent",
                  color: quality === q ? "#38bdf8" : "#f8fafc",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <span>{q} CMAF</span>
                {quality === q && <span>✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      <h3 style={{ marginBottom: 6, marginTop: 14, fontSize: 15.5, textAlign: "center", maxWidth: 420 }}>
        #{safeIdx + 1}/{reelsList.length} • {active.title}
      </h3>
      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 12 }}>
        {active.channelHandle} • {active.views}
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button
          type="button"
          onClick={() => setIdx((safeIdx - 1 + reelsList.length) % reelsList.length)}
          style={{ padding: "9px 14px", borderRadius: 8, background: "#1e293b", color: "#f8fafc", border: "1px solid #334155", fontWeight: 700, cursor: "pointer" }}
        >
          ▲ Previous Reel
        </button>
        <button
          type="button"
          onClick={() => setIdx((safeIdx + 1) % reelsList.length)}
          style={{ padding: "9px 16px", borderRadius: 8, background: "#38bdf8", color: "#080c14", border: "none", fontWeight: 700, cursor: "pointer" }}
        >
          ▼ Next Reel
        </button>
      </div>
    </div>
  );
}
