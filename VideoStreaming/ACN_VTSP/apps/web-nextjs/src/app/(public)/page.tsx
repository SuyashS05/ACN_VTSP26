"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  usePlatformRole,
  type ContentType,
  type ContentVisibility,
  type StudioContentItem,
} from "../../lib/role-context";

type QualityOption = "1080p" | "720p" | "360p" | "Auto";

const CATEGORIES = [
  "All",
  "CMAF & Transcoding",
  "AI & Video RAG",
  "Live WebRTC & Yjs",
  "Shoppable Video",
  "9:16 Shorts",
  "Community Posts",
];

function VisibilityBadge({ visibility }: { visibility: ContentVisibility }) {
  const styles =
    visibility === "PUBLIC"
      ? { bg: "rgba(52, 211, 153, 0.18)", color: "#34d399", label: "🌍 Public" }
      : visibility === "MEMBERS_ONLY"
      ? { bg: "rgba(251, 191, 36, 0.2)", color: "#fbbf24", label: "⭐ Members Only" }
      : { bg: "rgba(251, 113, 133, 0.2)", color: "#fb7185", label: "🔒 Private" };

  return (
    <span
      style={{
        padding: "2px 8px",
        borderRadius: 6,
        fontSize: 10.5,
        fontWeight: 700,
        background: styles.bg,
        color: styles.color,
        border: `1px solid ${styles.color}`,
      }}
    >
      {styles.label}
    </span>
  );
}

function YouTubeFeedCard({
  item,
  isAuthenticated,
}: {
  item: StudioContentItem;
  isAuthenticated: boolean;
}) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [isHovered, setIsHovered] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [quality, setQuality] = useState<QualityOption>(item.defaultQuality || "1080p");
  const [speed, setSpeed] = useState<number>(1);
  const [menuOpen, setMenuOpen] = useState(false);
  const [liked, setLiked] = useState(false);

  const isLockedMembersOnly = item.visibility === "MEMBERS_ONLY" && !isAuthenticated;

  function handleMouseEnter() {
    setIsHovered(true);
    if (item.type === "POST" || isLockedMembersOnly) return;
    const v = videoRef.current;
    if (v) {
      if (item.startOffsetSec && v.currentTime < 1) {
        v.currentTime = item.startOffsetSec;
      }
      v.playbackRate = speed;
      v.play().catch(() => {});
    }
  }

  function handleMouseLeave() {
    setIsHovered(false);
    setMenuOpen(false);
    const v = videoRef.current;
    if (v) {
      v.pause();
      v.currentTime = item.startOffsetSec || 0;
      setProgress(0);
    }
  }

  function handleCardClick() {
    if (isLockedMembersOnly) {
      router.push("/login");
      return;
    }
    if (item.type === "LIVE") {
      router.push(`/live/${item.watchId || "live_room_01"}`);
    } else if (item.type === "REEL") {
      router.push("/shorts");
    } else if (item.type === "POST") {
      setLiked((prev) => !prev);
    } else {
      router.push(`/watch/${item.watchId || "vid_8842"}`);
    }
  }

  function handleTimeUpdate() {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    setProgress(Math.min(100, (v.currentTime / v.duration) * 100));
  }

  function toggleMute(e: React.MouseEvent) {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
  }

  function selectQuality(e: React.MouseEvent, q: QualityOption) {
    e.stopPropagation();
    setQuality(q);
    setMenuOpen(false);
  }

  function selectSpeed(e: React.MouseEvent, sp: number) {
    e.stopPropagation();
    setSpeed(sp);
    if (videoRef.current) {
      videoRef.current.playbackRate = sp;
    }
    setMenuOpen(false);
  }

  const videoFilter =
    quality === "360p"
      ? "blur(1.1px) contrast(0.94)"
      : quality === "720p"
      ? "none"
      : "contrast(1.06) saturate(1.06)";

  return (
    <article
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleCardClick}
      style={{
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        borderRadius: 14,
        background: isHovered ? "#111927" : "#0b111e",
        border: isHovered ? "1px solid #38bdf8" : "1px solid #1e293b",
        transition: "transform 0.2s ease, background 0.2s ease, border 0.2s ease",
        transform: isHovered ? "translateY(-3px)" : "none",
        padding: 10,
        position: "relative",
      }}
    >
      {/* 16:9 Media Stage (Video, Reel, Live Stream, or Image Post) */}
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "16 / 9",
          borderRadius: 10,
          overflow: "hidden",
          background: "#000",
        }}
      >
        {item.type === "POST" ? (
          <img
            src={item.postImageUrl || item.posterUrl}
            alt={item.title}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: isHovered ? "scale(1.03)" : "scale(1)",
              transition: "transform 0.25s ease",
            }}
          />
        ) : (
          <video
            ref={videoRef}
            src={item.streamUrl}
            poster={item.posterUrl}
            muted={isMuted}
            loop
            playsInline
            preload="auto"
            onTimeUpdate={handleTimeUpdate}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              background: "#000",
              filter: videoFilter,
              transition: "filter 0.2s ease",
            }}
          />
        )}

        {/* Members-Only Lock Overlay for Guests */}
        {isLockedMembersOnly && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(8, 12, 20, 0.76)",
              backdropFilter: "blur(4px)",
              zIndex: 8,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              padding: 16,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 800, color: "#fbbf24" }}>⭐ Members-Only Content</div>
            <div style={{ fontSize: 11.5, color: "#cbd5e1", marginTop: 4 }}>
              Sign in to watch this channel&apos;s exclusive stream
            </div>
          </div>
        )}

        {/* Top-Left Format + Quality + Visibility Badges */}
        <div
          style={{
            position: "absolute",
            top: 9,
            left: 9,
            zIndex: 9,
            display: "flex",
            gap: 6,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <VisibilityBadge visibility={item.visibility} />

          {item.type === "LIVE" && (
            <span
              style={{
                padding: "2px 8px",
                borderRadius: 6,
                fontSize: 10.5,
                fontWeight: 800,
                background: "#ef4444",
                color: "#fff",
              }}
            >
              ● LIVE
            </span>
          )}

          {item.type === "REEL" && (
            <span
              style={{
                padding: "2px 8px",
                borderRadius: 6,
                fontSize: 10.5,
                fontWeight: 800,
                background: "rgba(192, 132, 252, 0.9)",
                color: "#080c14",
              }}
            >
              📱 9:16 REEL
            </span>
          )}

          {item.type === "POST" && (
            <span
              style={{
                padding: "2px 8px",
                borderRadius: 6,
                fontSize: 10.5,
                fontWeight: 800,
                background: "rgba(52, 211, 153, 0.9)",
                color: "#080c14",
              }}
            >
              🖼️ IMAGE POST
            </span>
          )}

          {item.type !== "POST" && (
            <span
              style={{
                padding: "2px 7px",
                borderRadius: 6,
                fontSize: 10.5,
                fontWeight: 700,
                fontFamily: "monospace",
                background: "rgba(8, 12, 20, 0.85)",
                color: "#38bdf8",
                border: "1px solid rgba(56, 189, 248, 0.4)",
              }}
            >
              {quality === "1080p" ? "1080p HD" : quality} {speed !== 1 ? `• ${speed}x` : ""}
            </span>
          )}
        </div>

        {/* Top-Right Hover Controls: Mute/Unmute & 3-Dot Quality Menu */}
        {item.type !== "POST" && (
          <div
            style={{
              position: "absolute",
              top: 9,
              right: 9,
              zIndex: 9,
              display: "flex",
              gap: 6,
            }}
          >
            {isHovered && !isLockedMembersOnly && (
              <button
                type="button"
                onClick={toggleMute}
                title={isMuted ? "Unmute preview" : "Mute preview"}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: "rgba(8, 12, 20, 0.85)",
                  border: "1px solid #334155",
                  color: "#f8fafc",
                  fontSize: 13,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isMuted ? "🔇" : "🔊"}
              </button>
            )}
            <button
              type="button"
              title="Video Quality (1080p / 720p / 360p) & Options"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((prev) => !prev);
              }}
              style={{
                height: 30,
                padding: "0 9px",
                borderRadius: 8,
                background: menuOpen ? "#38bdf8" : "rgba(8, 12, 20, 0.85)",
                border: "1px solid #334155",
                color: menuOpen ? "#080c14" : "#f8fafc",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              ⋮
            </button>
          </div>
        )}

        {/* Bottom-Right Duration Badge */}
        <span
          style={{
            position: "absolute",
            bottom: isHovered ? 10 : 8,
            right: 8,
            zIndex: 5,
            padding: "2px 6px",
            borderRadius: 5,
            background: item.type === "LIVE" ? "#ef4444" : "rgba(0, 0, 0, 0.85)",
            color: "#f8fafc",
            fontSize: 11,
            fontWeight: 700,
            fontFamily: "monospace",
          }}
        >
          {item.duration}
        </span>

        {/* Bottom Red YouTube Progress Bar on Hover */}
        {isHovered && item.type !== "POST" && !isLockedMembersOnly && (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 3.5,
              background: "rgba(255,255,255,0.25)",
              zIndex: 6,
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background: "#ef4444",
                transition: "width 0.15s linear",
              }}
            />
          </div>
        )}
      </div>

      {/* 3-Dot (⋮) Popup Menu for Quality (1080p, 720p, 360p) & Playback Speed */}
      {menuOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            top: 46,
            right: 16,
            width: 225,
            background: "rgba(15, 23, 42, 0.98)",
            backdropFilter: "blur(12px)",
            border: "1px solid #38bdf8",
            borderRadius: 12,
            padding: 10,
            zIndex: 40,
            boxShadow: "0 14px 30px rgba(0,0,0,0.7)",
            fontSize: 12,
          }}
        >
          <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, marginBottom: 6 }}>
            🎞️ SELECT QUALITY (CMAF .m4s)
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 8 }}>
            {(
              [
                { id: "1080p", label: "1080p60 HD (4.2 Mbps)" },
                { id: "720p", label: "720p HD (2.4 Mbps)" },
                { id: "360p", label: "360p Data Saver" },
                { id: "Auto", label: "Auto (ABR)" },
              ] as const
            ).map((q) => (
              <button
                key={q.id}
                type="button"
                onClick={(e) => selectQuality(e, q.id)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "6px 8px",
                  borderRadius: 6,
                  border: "none",
                  background: quality === q.id ? "rgba(56, 189, 248, 0.18)" : "transparent",
                  color: quality === q.id ? "#38bdf8" : "#f8fafc",
                  fontWeight: quality === q.id ? 700 : 500,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span>{q.label}</span>
                {quality === q.id && <span>✓</span>}
              </button>
            ))}
          </div>

          <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, marginBottom: 5, borderTop: "1px solid #1e293b", paddingTop: 6 }}>
            ⏱️ PLAYBACK SPEED
          </div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {[0.75, 1, 1.25, 1.5, 2].map((sp) => (
              <button
                key={sp}
                type="button"
                onClick={(e) => selectSpeed(e, sp)}
                style={{
                  padding: "4px 8px",
                  borderRadius: 6,
                  border: speed === sp ? "1px solid #38bdf8" : "1px solid #334155",
                  background: speed === sp ? "rgba(56, 189, 248, 0.18)" : "#090d16",
                  color: speed === sp ? "#38bdf8" : "#cbd5e1",
                  fontSize: 11,
                  cursor: "pointer",
                }}
              >
                {sp}x
              </button>
            ))}
          </div>
        </div>
      )}

      {/* YouTube-Style Metadata Row */}
      <div style={{ display: "flex", gap: 11, marginTop: 11, alignItems: "flex-start" }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: item.avatarColor || "#38bdf8",
            color: "#080c14",
            fontWeight: 800,
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {item.channelName.charAt(0).toUpperCase()}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 700,
              lineHeight: 1.35,
              color: "#f8fafc",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {item.title}
          </h3>
          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
            {item.channelName} <span style={{ color: "#38bdf8" }}>✓</span> • {item.views} • {item.uploadedAt}
          </div>

          {item.type === "POST" && item.description && (
            <p style={{ margin: "6px 0 0", fontSize: 12, color: "#cbd5e1", lineHeight: 1.4 }}>
              {item.description}
            </p>
          )}

          {/* Live Stream Viewer Permissions Summary */}
          {item.type === "LIVE" && item.livePermissions && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
              <span style={{ padding: "2px 7px", borderRadius: 6, fontSize: 10.5, background: "rgba(56, 189, 248, 0.14)", color: "#38bdf8", border: "1px solid rgba(56, 189, 248, 0.35)" }}>
                💬 Chat: {item.livePermissions.chatMode}
              </span>
              <span style={{ padding: "2px 7px", borderRadius: 6, fontSize: 10.5, background: "rgba(192, 132, 252, 0.14)", color: "#c084fc", border: "1px solid rgba(192, 132, 252, 0.35)" }}>
                ✏️ Board: {item.livePermissions.whiteboardMode}
              </span>
            </div>
          )}

          {/* AI / Format Badges */}
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 6 }}>
            {item.aiBadges.map((b) => (
              <span
                key={b}
                style={{
                  padding: "2px 7px",
                  borderRadius: 6,
                  fontSize: 10.5,
                  background: "#0f172a",
                  border: "1px solid #1e293b",
                  color: "#94a3b8",
                }}
              >
                {b}
              </span>
            ))}
            {item.type === "POST" && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLiked((prev) => !prev);
                }}
                style={{
                  padding: "2px 8px",
                  borderRadius: 6,
                  fontSize: 11,
                  background: liked ? "rgba(251, 113, 133, 0.2)" : "#1e293b",
                  color: liked ? "#fb7185" : "#cbd5e1",
                  border: "1px solid #334155",
                  cursor: "pointer",
                }}
              >
                {liked ? "❤️ Liked" : "🤍 Like Post"}
              </button>
            )}
          </div>
        </div>

        {/* Bottom-Right 3-Dot Button */}
        {item.type !== "POST" && (
          <button
            type="button"
            title="Quality (1080p / 720p / 360p) & Options"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((prev) => !prev);
            }}
            style={{
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              fontSize: 18,
              cursor: "pointer",
              padding: "2px 6px",
              borderRadius: 6,
            }}
          >
            ⋮
          </button>
        )}
      </div>
    </article>
  );
}

export default function PublicHomeFeedPage() {
  const { user, role, contentItems } = usePlatformRole();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedFormat, setSelectedFormat] = useState<"ALL" | ContentType>("ALL");
  const [selectedVisibility, setSelectedVisibility] = useState<"ALL" | ContentVisibility>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter items according to visibility rules:
  // - PUBLIC: everyone sees
  // - MEMBERS_ONLY: everyone sees card (guests see Members-Only lock overlay)
  // - PRIVATE: only ownerEmail or ADMIN sees
  const visibleItems = contentItems.filter((item) => {
    if (item.visibility === "PRIVATE") {
      const isOwner =
        user.isAuthenticated &&
        (user.email.toLowerCase() === item.ownerEmail.toLowerCase() || role === "ADMIN");
      if (!isOwner) return false;
    }

    if (selectedFormat !== "ALL" && item.type !== selectedFormat) return false;
    if (selectedVisibility !== "ALL" && item.visibility !== selectedVisibility) return false;
    if (selectedCategory !== "All" && item.category !== selectedCategory) return false;

    if (
      searchQuery.trim() &&
      !item.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !item.channelName.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <main style={{ background: "#080c14", color: "#f8fafc", minHeight: "92vh", padding: "18px 24px 44px" }}>
      {/* Row 1: Format Tabs (All, Videos, Reels, Live, Posts) + Visibility Filter + Search */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(
            [
              { id: "ALL", label: "All Formats" },
              { id: "VIDEO", label: "🎬 16:9 Videos" },
              { id: "REEL", label: "📱 9:16 Reels" },
              { id: "LIVE", label: "🔴 Live Streams" },
              { id: "POST", label: "🖼️ Image Posts" },
            ] as const
          ).map((fmt) => {
            const active = selectedFormat === fmt.id;
            return (
              <button
                key={fmt.id}
                type="button"
                onClick={() => setSelectedFormat(fmt.id)}
                style={{
                  padding: "7px 13px",
                  borderRadius: 10,
                  border: active ? "1px solid #38bdf8" : "1px solid #1e293b",
                  background: active ? "rgba(56, 189, 248, 0.16)" : "#0f172a",
                  color: active ? "#38bdf8" : "#cbd5e1",
                  fontWeight: active ? 700 : 500,
                  fontSize: 12.5,
                  cursor: "pointer",
                }}
              >
                {fmt.label}
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <select
            value={selectedVisibility}
            onChange={(e) => setSelectedVisibility(e.target.value as "ALL" | ContentVisibility)}
            style={{
              padding: "7px 12px",
              borderRadius: 999,
              background: "#0f172a",
              color: "#cbd5e1",
              border: "1px solid #334155",
              fontSize: 12,
            }}
          >
            <option value="ALL">Visibility: All Accessible</option>
            <option value="PUBLIC">🌍 Public Only</option>
            <option value="MEMBERS_ONLY">⭐ Members Only</option>
            <option value="PRIVATE">🔒 Private (My Uploads)</option>
          </select>

          <input
            type="search"
            placeholder="Search videos, reels, live rooms, posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              minWidth: 240,
              padding: "7px 14px",
              borderRadius: 999,
              background: "#0f172a",
              border: "1px solid #334155",
              color: "#f8fafc",
              fontSize: 12.5,
            }}
          />
        </div>
      </div>

      {/* Row 2: YouTube Category Chips */}
      <div
        style={{
          display: "flex",
          gap: 8,
          overflowX: "auto",
          paddingBottom: 14,
          marginBottom: 18,
          borderBottom: "1px solid #1e293b",
        }}
      >
        {CATEGORIES.map((cat) => {
          const active = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: "6px 13px",
                borderRadius: 999,
                border: active ? "1px solid #f8fafc" : "1px solid #1e293b",
                background: active ? "#f8fafc" : "#0f172a",
                color: active ? "#080c14" : "#cbd5e1",
                fontWeight: active ? 700 : 500,
                fontSize: 12,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Responsive YouTube-Style Content Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))",
          gap: 18,
          alignItems: "start",
        }}
      >
        {visibleItems.map((item) => (
          <YouTubeFeedCard key={item.id} item={item} isAuthenticated={user.isAuthenticated} />
        ))}
      </div>
    </main>
  );
}
