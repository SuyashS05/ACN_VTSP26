"use client";

import React from "react";
import { CmafVideoPlayer } from "../../../components/player/CmafVideoPlayer";
import { ShoppableProductOverlay } from "../../../components/player/ShoppableProductOverlay";
import { MultiLangTrackSwitcher } from "../../../components/player/MultiLangTrackSwitcher";
import { SpriteSheetScrubber } from "../../../components/player/SpriteSheetScrubber";
import { TimestampRagChat } from "../../../components/ai-learning/TimestampRagChat";
import { InteractiveMcqQuiz } from "../../../components/ai-learning/InteractiveMcqQuiz";

export default function WatchVideoPage({ params }: { params: { videoId: string } }) {
  const videoId = params?.videoId ?? "vid_8842";
  return (
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, padding: 24, background: "#080c14", color: "#f8fafc" }}>
      <div>
        <div style={{ position: "relative" }}>
          <CmafVideoPlayer videoId={videoId} src="http://localhost:8080/sample-3.mp4" />
          <ShoppableProductOverlay videoId={videoId} />
        </div>
        <MultiLangTrackSwitcher />
        <SpriteSheetScrubber spriteUrl="http://localhost:8080/out_cmaf/videos/vid_8842/thumbnails/spritesheet.webp" />
      </div>
      <aside style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <TimestampRagChat videoId={videoId} />
        <InteractiveMcqQuiz videoId={videoId} />
      </aside>
    </div>
  );
}

