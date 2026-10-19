"use client";

import React, { useEffect, useRef, useState } from "react";

export type VideoQualityRung = "1080p" | "720p" | "360p" | "Auto";

export interface CmafVideoPlayerProps {
  videoId: string;
  src: string;
  poster?: string;
  initialQuality?: VideoQualityRung;
}

export function CmafVideoPlayer({
  videoId,
  src,
  poster = "/out_cmaf/videos/vid_8842/thumbnails/poster.webp",
  initialQuality = "1080p",
}: CmafVideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(30);
  const [quality, setQuality] = useState<VideoQualityRung>(initialQuality);
  const [speed, setSpeed] = useState<number>(1);
  const [lang, setLang] = useState<"en" | "hi" | "es">("en");
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuTab, setMenuTab] = useState<"main" | "quality" | "speed" | "audio">("main");
  const [qualityToast, setQualityToast] = useState<string | null>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => setCurrentTime(v.currentTime || 0);
    const onMeta = () => setDuration(v.duration || 30);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
    };
  }, []);

  function formatTime(sec: number) {
    const s = Math.max(0, Math.floor(sec || 0));
    const mm = String(Math.floor(s / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  }

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  }

  function toggleMute() {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
  }

  function handleVolumeChange(val: number) {
    const v = videoRef.current;
    if (!v) return;
    v.volume = val;
    v.muted = val === 0;
    setVolume(val);
    setIsMuted(val === 0);
  }

  function handleSeekBar(e: React.ChangeEvent<HTMLInputElement>) {
    const v = videoRef.current;
    const target = parseFloat(e.target.value);
    setCurrentTime(target);
    if (v) v.currentTime = target;
  }

  function handleSelectQuality(nextQuality: VideoQualityRung) {
    setQuality(nextQuality);
    setMenuOpen(false);
    setMenuTab("main");
    setQualityToast(`Switched CMAF rendition to ${nextQuality === "Auto" ? "Auto (1080p ABR)" : nextQuality}`);
    setTimeout(() => setQualityToast(null), 2200);
  }

  function handleSelectSpeed(nextSpeed: number) {
    setSpeed(nextSpeed);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextSpeed;
    }
    setMenuOpen(false);
    setMenuTab("main");
  }

  function handleSelectLang(nextLang: "en" | "hi" | "es") {
    setLang(nextLang);
    const v = videoRef.current;
    if (v && v.textTracks) {
      for (let i = 0; i < v.textTracks.length; i++) {
        v.textTracks[i].mode = v.textTracks[i].language === nextLang ? "showing" : "disabled";
      }
    }
    setMenuOpen(false);
    setMenuTab("main");
  }

  function toggleFullscreen() {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }

  const videoFilter =
    quality === "360p"
      ? "blur(1.2px) contrast(0.94)"
      : quality === "720p"
      ? "none"
      : "contrast(1.06) saturate(1.06)";

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "16 / 9",
        borderRadius: 14,
        overflow: "hidden",
        background: "#000",
        border: "1px solid #1e293b",
        userSelect: "none",
      }}
    >
      <video
        ref={videoRef}
        id={`cmaf-player-${videoId}`}
        src={src}
        poster={poster}
        autoPlay
        loop
        playsInline
        onClick={togglePlay}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          background: "#000",
          cursor: "pointer",
          filter: videoFilter,
          transition: "filter 0.25s ease",
        }}
      >
        <track kind="captions" src="/out_cmaf/videos/vid_8842/captions/en.vtt" srcLang="en" label="English" default />
        <track kind="captions" src="/out_cmaf/videos/vid_8842/captions/hi.vtt" srcLang="hi" label="Hindi" />
        <track kind="captions" src="/out_cmaf/videos/vid_8842/captions/es.vtt" srcLang="es" label="Spanish" />
      </video>

      {/* Top-Left Quality & Stream Status Badge */}
      <div
        style={{
          position: "absolute",
          top: 12,
          left: 14,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "4px 10px",
          borderRadius: 999,
          background: "rgba(8, 12, 20, 0.78)",
          border: "1px solid rgba(56, 189, 248, 0.35)",
          fontSize: 11,
          fontFamily: "monospace",
          color: "#38bdf8",
          pointerEvents: "none",
        }}
      >
        <span>● CMAF .m4s</span>
        <strong style={{ color: "#34d399" }}>{quality === "Auto" ? "Auto (1080p)" : quality}</strong>
        <span>• {speed}x</span>
        <span>• {lang.toUpperCase()}</span>
      </div>

      {/* Quality Switch Toast */}
      {qualityToast && (
        <div
          style={{
            position: "absolute",
            top: 14,
            right: 16,
            padding: "6px 12px",
            borderRadius: 8,
            background: "rgba(15, 23, 42, 0.92)",
            border: "1px solid #34d399",
            color: "#a7f3d0",
            fontSize: 12,
            fontWeight: 600,
            zIndex: 25,
          }}
        >
          ✓ {qualityToast}
        </div>
      )}

      {/* 3-Dot / Gear Settings Popup Menu (Quality 1080p / 720p / 360p, Speed, Audio) */}
      {menuOpen && (
        <div
          style={{
            position: "absolute",
            bottom: 58,
            right: 14,
            width: 250,
            background: "rgba(15, 23, 42, 0.97)",
            backdropFilter: "blur(12px)",
            border: "1px solid #334155",
            borderRadius: 12,
            padding: 8,
            zIndex: 30,
            boxShadow: "0 12px 32px rgba(0,0,0,0.65)",
            fontSize: 12.5,
            color: "#f8fafc",
          }}
        >
          {menuTab === "main" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <button
                type="button"
                onClick={() => setMenuTab("quality")}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 10px", background: "transparent", color: "#f8fafc", border: "none", borderRadius: 8, cursor: "pointer", textAlign: "left" }}
              >
                <span>🎞️ Quality</span>
                <strong style={{ color: "#38bdf8" }}>{quality} ▸</strong>
              </button>
              <button
                type="button"
                onClick={() => setMenuTab("speed")}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 10px", background: "transparent", color: "#f8fafc", border: "none", borderRadius: 8, cursor: "pointer", textAlign: "left" }}
              >
                <span>⏱️ Playback Speed</span>
                <strong style={{ color: "#38bdf8" }}>{speed === 1 ? "Normal (1x)" : `${speed}x`} ▸</strong>
              </button>
              <button
                type="button"
                onClick={() => setMenuTab("audio")}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 10px", background: "transparent", color: "#f8fafc", border: "none", borderRadius: 8, cursor: "pointer", textAlign: "left" }}
              >
                <span>🌐 Captions / Audio</span>
                <strong style={{ color: "#38bdf8" }}>{lang.toUpperCase()} ▸</strong>
              </button>
            </div>
          )}

          {menuTab === "quality" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <button
                type="button"
                onClick={() => setMenuTab("main")}
                style={{ padding: "6px 8px", background: "transparent", color: "#94a3b8", border: "none", borderBottom: "1px solid #1e293b", textAlign: "left", cursor: "pointer", fontSize: 11.5, marginBottom: 4 }}
              >
                ◂ Back to Settings
              </button>
              {(
                [
                  { id: "1080p", label: "1080p60 HD", sub: "4.2 Mbps • AV1/H.264" },
                  { id: "720p", label: "720p HD", sub: "2.4 Mbps • H.264" },
                  { id: "360p", label: "360p Data Saver", sub: "800 kbps • H.264" },
                  { id: "Auto", label: "Auto (CMAF ABR)", sub: "Recommended" },
                ] as const
              ).map((q) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => handleSelectQuality(q.id)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "none",
                    background: quality === q.id ? "rgba(56, 189, 248, 0.16)" : "transparent",
                    color: quality === q.id ? "#38bdf8" : "#f8fafc",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700 }}>{q.label}</div>
                    <div style={{ fontSize: 10.5, color: "#94a3b8" }}>{q.sub}</div>
                  </div>
                  {quality === q.id && <span>✓</span>}
                </button>
              ))}
            </div>
          )}

          {menuTab === "speed" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <button
                type="button"
                onClick={() => setMenuTab("main")}
                style={{ padding: "6px 8px", background: "transparent", color: "#94a3b8", border: "none", borderBottom: "1px solid #1e293b", textAlign: "left", cursor: "pointer", fontSize: 11.5, marginBottom: 4 }}
              >
                ◂ Back to Settings
              </button>
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map((sp) => (
                <button
                  key={sp}
                  type="button"
                  onClick={() => handleSelectSpeed(sp)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "7px 10px",
                    borderRadius: 8,
                    border: "none",
                    background: speed === sp ? "rgba(56, 189, 248, 0.16)" : "transparent",
                    color: speed === sp ? "#38bdf8" : "#f8fafc",
                    cursor: "pointer",
                  }}
                >
                  <span>{sp === 1 ? "Normal (1x)" : `${sp}x`}</span>
                  {speed === sp && <span>✓</span>}
                </button>
              ))}
            </div>
          )}

          {menuTab === "audio" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <button
                type="button"
                onClick={() => setMenuTab("main")}
                style={{ padding: "6px 8px", background: "transparent", color: "#94a3b8", border: "none", borderBottom: "1px solid #1e293b", textAlign: "left", cursor: "pointer", fontSize: 11.5, marginBottom: 4 }}
              >
                ◂ Back to Settings
              </button>
              {(
                [
                  { id: "en", label: "English (EN) — WebVTT" },
                  { id: "hi", label: "Hindi (HI) — AI Translated" },
                  { id: "es", label: "Spanish (ES) — AI Translated" },
                ] as const
              ).map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => handleSelectLang(l.id)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "7px 10px",
                    borderRadius: 8,
                    border: "none",
                    background: lang === l.id ? "rgba(56, 189, 248, 0.16)" : "transparent",
                    color: lang === l.id ? "#38bdf8" : "#f8fafc",
                    cursor: "pointer",
                  }}
                >
                  <span>{l.label}</span>
                  {lang === l.id && <span>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Custom YouTube-Style Bottom Control Bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          background: "linear-gradient(transparent, rgba(8, 12, 20, 0.94))",
          padding: "10px 14px 10px",
          display: "flex",
          flexDirection: "column",
          gap: 6,
          zIndex: 20,
        }}
      >
        <input
          type="range"
          min={0}
          max={Math.max(1, duration)}
          step={0.1}
          value={currentTime}
          onChange={handleSeekBar}
          style={{ width: "100%", accentColor: "#ef4444", cursor: "pointer", height: 4 }}
        />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12.5 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              type="button"
              onClick={togglePlay}
              style={{ background: "transparent", border: "none", color: "#f8fafc", fontSize: 15, cursor: "pointer", padding: "2px 6px" }}
            >
              {isPlaying ? "⏸" : "▶"}
            </button>
            <button
              type="button"
              onClick={toggleMute}
              style={{ background: "transparent", border: "none", color: "#f8fafc", fontSize: 14, cursor: "pointer", padding: "2px 4px" }}
            >
              {isMuted ? "🔇" : "🔊"}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              style={{ width: 64, accentColor: "#38bdf8", cursor: "pointer" }}
            />
            <span style={{ color: "#cbd5e1", fontFamily: "monospace", fontSize: 11.5 }}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Quick Quality Pill */}
            <button
              type="button"
              onClick={() => {
                setMenuOpen((prev) => !prev || menuTab !== "quality");
                setMenuTab("quality");
              }}
              style={{
                padding: "3px 9px",
                borderRadius: 6,
                background: "rgba(56, 189, 248, 0.18)",
                border: "1px solid #38bdf8",
                color: "#38bdf8",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {quality === "1080p" ? "1080p HD" : quality}
            </button>

            {/* 3-Dot ⋮ / Gear Settings Button */}
            <button
              type="button"
              title="Quality (1080p / 720p / 360p) & Player Settings"
              onClick={() => {
                setMenuOpen((prev) => !prev);
                setMenuTab("main");
              }}
              style={{
                padding: "4px 9px",
                borderRadius: 6,
                background: menuOpen ? "#38bdf8" : "rgba(30, 41, 59, 0.9)",
                color: menuOpen ? "#080c14" : "#f8fafc",
                border: "1px solid #475569",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              ⋮ Settings
            </button>

            <button
              type="button"
              title="Fullscreen"
              onClick={toggleFullscreen}
              style={{
                padding: "4px 8px",
                borderRadius: 6,
                background: "rgba(30, 41, 59, 0.9)",
                color: "#f8fafc",
                border: "1px solid #475569",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              ⛶
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
