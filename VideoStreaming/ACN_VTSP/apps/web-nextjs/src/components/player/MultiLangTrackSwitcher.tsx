"use client";

import React, { useState } from "react";

export function MultiLangTrackSwitcher() {
  const [lang, setLang] = useState("en");
  const [rung, setRung] = useState("720p");

  return (
    <div style={{ display: "flex", gap: 12, marginTop: 10, padding: 10, background: "#0f172a", borderRadius: 8 }}>
      <label>
        ABR Quality:{" "}
        <select value={rung} onChange={(e) => setRung(e.target.value)}>
          <option value="360p">360p CMAF (800 kbps)</option>
          <option value="720p">720p HD CMAF (2.5 Mbps)</option>
          <option value="1080p">1080p Full HD (5.0 Mbps)</option>
        </select>
      </label>
      <label>
        #EXT-X-MEDIA Audio &amp; VTT:{" "}
        <select value={lang} onChange={(e) => setLang(e.target.value)}>
          <option value="en">English (Faster-Whisper)</option>
          <option value="hi">Hindi (NLLB-200 + Kokoro TTS)</option>
          <option value="es">Spanish (NLLB-200 + Kokoro TTS)</option>
        </select>
      </label>
    </div>
  );
}

