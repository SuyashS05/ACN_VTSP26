"use client";

import React from "react";

export function CmafVideoPlayer({ videoId, src }: { videoId: string; src: string }) {
  return (
    <video
      id={`cmaf-player-${videoId}`}
      src={src}
      poster="http://localhost:8080/out_cmaf/videos/vid_8842/thumbnails/poster.webp"
      controls
      autoPlay
      loop
      playsInline
      style={{ width: "100%", borderRadius: 12, background: "#000" }}
    >
      <track kind="captions" src="http://localhost:8080/out_cmaf/videos/vid_8842/captions/en.vtt" srcLang="en" label="English" default />
      <track kind="captions" src="http://localhost:8080/out_cmaf/videos/vid_8842/captions/hi.vtt" srcLang="hi" label="Hindi" />
      <track kind="captions" src="http://localhost:8080/out_cmaf/videos/vid_8842/captions/es.vtt" srcLang="es" label="Spanish" />
    </video>
  );
}

