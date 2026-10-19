"use client";

import React from "react";
import { useParams } from "next/navigation";
import { CmafVideoPlayer } from "../../../../components/player/CmafVideoPlayer";
import { ShoppableProductOverlay } from "../../../../components/player/ShoppableProductOverlay";
import { MultiLangTrackSwitcher } from "../../../../components/player/MultiLangTrackSwitcher";
import { SpriteSheetScrubber } from "../../../../components/player/SpriteSheetScrubber";
import { TimestampRagChat } from "../../../../components/ai-learning/TimestampRagChat";
import { InteractiveMcqQuiz } from "../../../../components/ai-learning/InteractiveMcqQuiz";

export default function WatchVideoPage() {
  const params = useParams();
  const videoId = (params?.videoId as string) || "vid_8842";

  function handleSeek(seconds: number) {
    const el = document.getElementById(`cmaf-player-${videoId}`) as HTMLVideoElement | null;
    if (el) {
      el.currentTime = seconds;
      el.play().catch(() => {});
    }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, padding: 24, background: "#080c14", color: "#f8fafc" }}>
      <div>
        <div style={{ position: "relative" }}>
          <CmafVideoPlayer videoId={videoId} src="http://localhost:8080/sample-3.mp4" />
          <ShoppableProductOverlay videoId={videoId} />
        </div>
        <MultiLangTrackSwitcher videoId={videoId} />
        <SpriteSheetScrubber
          spriteUrl="http://localhost:8080/out_cmaf/videos/vid_8842/thumbnails/spritesheet.webp"
          onSeek={handleSeek}
        />
      </div>
      <aside style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <TimestampRagChat videoId={videoId} onSeek={handleSeek} />
        <InteractiveMcqQuiz videoId={videoId} onSeek={handleSeek} />
      </aside>
    </div>
  );
}
