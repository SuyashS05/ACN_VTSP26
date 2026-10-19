"use client";

import React from "react";
import { useParams } from "next/navigation";
import { CmafVideoPlayer } from "../../../../components/player/CmafVideoPlayer";
import { ShoppableProductOverlay } from "../../../../components/player/ShoppableProductOverlay";
import { MultiLangTrackSwitcher } from "../../../../components/player/MultiLangTrackSwitcher";
import { SpriteSheetScrubber } from "../../../../components/player/SpriteSheetScrubber";
import { TimestampRagChat } from "../../../../components/ai-learning/TimestampRagChat";
import { InteractiveMcqQuiz } from "../../../../components/ai-learning/InteractiveMcqQuiz";

const VIDEO_METADATA: Record<
  string,
  {
    title: string;
    channel: string;
    views: string;
    src: string;
    poster: string;
    spriteUrl: string;
  }
> = {
  vid_8842: {
    title: "Zero-Egress CMAF Streaming & KEDA Spot Architecture (sample-3.mp4)",
    channel: "@acn_cloud_media",
    views: "128.4K views • 2 hours ago",
    src: "/sample-3.mp4",
    poster: "/out_cmaf/videos/vid_8842/thumbnails/poster.webp",
    spriteUrl: "/out_cmaf/videos/vid_8842/thumbnails/spritesheet.webp",
  },
  vid_9104: {
    title: "Sub-5ms Go WebSocket Chat Moderation with Int8 ONNX (sd.mp4)",
    channel: "@edtech_ai_academy",
    views: "84.2K views • 5 hours ago",
    src: "/sd.mp4",
    poster: "/out_cmaf/videos/vid_9104/thumbnails/poster.webp",
    spriteUrl: "/out_cmaf/videos/vid_9104/thumbnails/spritesheet.webp",
  },
};

export default function WatchVideoPage() {
  const params = useParams();
  const videoId = (params?.videoId as string) || "vid_8842";
  const isSdVideo = videoId === "vid_9104" || videoId.includes("9104") || videoId.includes("sd");
  const meta = VIDEO_METADATA[isSdVideo ? "vid_9104" : "vid_8842"];

  function handleSeek(seconds: number) {
    const el = document.getElementById(`cmaf-player-${videoId}`) as HTMLVideoElement | null;
    if (el) {
      el.currentTime = seconds;
      el.play().catch(() => {});
    }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2.1fr) minmax(320px, 1fr)", gap: 20, padding: 24, background: "#080c14", color: "#f8fafc", minHeight: "92vh" }}>
      <div>
        <div style={{ position: "relative" }}>
          <CmafVideoPlayer videoId={videoId} src={meta.src} poster={meta.poster} />
          <ShoppableProductOverlay videoId={videoId} />
        </div>
        <div style={{ marginTop: 12, marginBottom: 4 }}>
          <h2 style={{ margin: "0 0 6px", fontSize: 19 }}>{meta.title}</h2>
          <div style={{ fontSize: 13, color: "#94a3b8" }}>
            <strong style={{ color: "#38bdf8" }}>{meta.channel}</strong> • {meta.views}
          </div>
        </div>
        <MultiLangTrackSwitcher videoId={videoId} />
        <SpriteSheetScrubber spriteUrl={meta.spriteUrl} onSeek={handleSeek} />
      </div>
      <aside style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <TimestampRagChat videoId={videoId} onSeek={handleSeek} />
        <InteractiveMcqQuiz videoId={videoId} onSeek={handleSeek} />
      </aside>
    </div>
  );
}
