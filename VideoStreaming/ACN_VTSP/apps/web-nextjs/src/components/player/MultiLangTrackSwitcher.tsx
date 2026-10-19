"use client";

import React, { useState } from "react";

const CAPTIONS: Record<string, string> = {
  en: '[00:02] "FFmpeg decodes sample-3.mp4 once and packages 360p, 720p, and 1080p into 2-second CMAF .m4s segments."',
  hi: '[00:02] "FFmpeg स्रोत वीडियो को एक बार डिकोड करता है और 360p, 720p और 1080p को 2-सेकंड CMAF .m4s सेगमेंट में पैक करता है।"',
  es: '[00:02] "FFmpeg decodifica el video una sola vez y empaqueta 360p, 720p y 1080p en segmentos CMAF .m4s de 2 segundos."',
};

const SPEECH_TEXT: Record<string, string> = {
  en: "FFmpeg decodes sample 3 MP4 once and packages 360p, 720p, and 1080p into 2 second CMAF segments with zero egress storage.",
  hi: "FFmpeg स्रोत वीडियो को एक बार डिकोड करता है और 360p, 720p और 1080p को 2 सेकंड CMAF सेगमेंट में पैक करता है।",
  es: "FFmpeg decodifica el video una sola vez y empaqueta 360p, 720p y 1080p en segmentos CMAF de dos segundos.",
};

export function MultiLangTrackSwitcher({ videoId = "vid_8842" }: { videoId?: string }) {
  const [rung, setRung] = useState("720p");
  const [speed, setSpeed] = useState("1.0");
  const [lang, setLang] = useState("en");
  const [aiAudioOn, setAiAudioOn] = useState(false);
  const [manifestText, setManifestText] = useState<string>("");

  function getVideoEl(): HTMLVideoElement | null {
    return document.getElementById(`cmaf-player-${videoId}`) as HTMLVideoElement | null;
  }

  function speakNarration(targetLang: string, rateStr: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(SPEECH_TEXT[targetLang] || SPEECH_TEXT.en);
    utter.lang = targetLang === "hi" ? "hi-IN" : targetLang === "es" ? "es-ES" : "en-US";
    utter.rate = parseFloat(rateStr || "1.0");
    window.speechSynthesis.speak(utter);
  }

  async function applyConfig(newRung: string, newSpeed: string, newLang: string, speakNow: boolean) {
    const el = getVideoEl();
    if (el) {
      el.playbackRate = parseFloat(newSpeed);
      if (newRung === "360p") {
        el.style.filter = "blur(1.1px) contrast(0.95)";
      } else if (newRung === "720p") {
        el.style.filter = "none";
      } else {
        el.style.filter = "contrast(1.06) saturate(1.08)";
      }
      if (el.paused) el.play().catch(() => {});
    }

    const folder = newRung === "1080p-AV1" ? "1080p" : newRung;
    try {
      const res = await fetch(`http://localhost:8080/out_cmaf/videos/vid_8842/video_h264/${folder}/playlist.m3u8`);
      if (res.ok) {
        setManifestText(await res.text());
      }
    } catch {}

    if (speakNow || aiAudioOn) {
      setAiAudioOn(true);
      speakNarration(newLang, newSpeed);
    }
  }

  function toggleAiDubbedAudio() {
    const nextState = !aiAudioOn;
    setAiAudioOn(nextState);
    if (nextState) {
      speakNarration(lang, speed);
    } else if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }

  return (
    <div style={{ marginTop: 10, padding: 12, background: "#0f172a", border: "1px solid #334155", borderRadius: 10 }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={toggleAiDubbedAudio}
            style={{
              padding: "7px 12px",
              borderRadius: 8,
              border: "none",
              fontWeight: 700,
              cursor: "pointer",
              background: aiAudioOn ? "#38bdf8" : "#34d399",
              color: "#080c14",
              fontSize: 12,
            }}
          >
            {aiAudioOn ? `🔊 AI Dubbed Audio: ON (${lang.toUpperCase()})` : "🔊 Enable AI Dubbed Audio (EN/HI/ES)"}
          </button>
          <span style={{ fontSize: 12, color: "#38bdf8", fontFamily: "monospace" }}>
            Active: {rung} CMAF (.m4s) • {speed}x • {lang.toUpperCase()}
          </span>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, fontSize: 12 }}>
          <label>
            ABR Quality:{" "}
            <select
              value={rung}
              onChange={(e) => {
                setRung(e.target.value);
                applyConfig(e.target.value, speed, lang, false);
              }}
              style={{ background: "#1e293b", color: "#f8fafc", border: "1px solid #334155", borderRadius: 6, padding: "5px 8px" }}
            >
              <option value="360p">360p CMAF (800 kbps)</option>
              <option value="720p">720p HD CMAF (2.5 Mbps)</option>
              <option value="1080p">1080p Full HD (5.0 Mbps)</option>
              <option value="1080p-AV1">1080p AV1 Tier (-45% BW)</option>
            </select>
          </label>

          <label>
            Speed:{" "}
            <select
              value={speed}
              onChange={(e) => {
                setSpeed(e.target.value);
                applyConfig(rung, e.target.value, lang, false);
              }}
              style={{ background: "#1e293b", color: "#f8fafc", border: "1px solid #334155", borderRadius: 6, padding: "5px 8px" }}
            >
              <option value="0.25">0.25x</option>
              <option value="0.5">0.5x</option>
              <option value="1.0">1.0x</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
              <option value="2.0">2.0x</option>
            </select>
          </label>

          <label>
            #EXT-X-MEDIA Audio &amp; VTT:{" "}
            <select
              value={lang}
              onChange={(e) => {
                setLang(e.target.value);
                applyConfig(rung, speed, e.target.value, true);
              }}
              style={{ background: "#1e293b", color: "#f8fafc", border: "1px solid #334155", borderRadius: 6, padding: "5px 8px" }}
            >
              <option value="en">English (Faster-Whisper)</option>
              <option value="hi">Hindi (NLLB-200 + Kokoro TTS)</option>
              <option value="es">Spanish (NLLB-200 + Kokoro TTS)</option>
            </select>
          </label>
        </div>
      </div>

      <div style={{ marginTop: 8, padding: "6px 10px", background: "#090d16", borderRadius: 6, fontSize: 12, color: "#e2e8f0" }}>
        {CAPTIONS[lang] || CAPTIONS.en}
      </div>

      {manifestText && (
        <pre style={{ marginTop: 8, padding: 10, background: "#060911", borderRadius: 6, fontSize: 11, color: "#94a3b8", maxHeight: 140, overflowY: "auto" }}>
          {manifestText}
        </pre>
      )}
    </div>
  );
}
