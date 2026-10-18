/**
 * ACN-VTSP Phase 2: Shared Event Contracts (Kafka & BullMQ Webhooks)
 * Single Source of Truth across Go (API/Transcoder), Python (GPU AI), and TypeScript (MCP/Webhooks)
 */

export type AspectRatio = "16:9" | "9:16";

export type VideoStatus =
  | "UPLOADING"
  | "RAW_INGESTED"
  | "STREAMABLE"
  | "READY"
  | "FAILED";

/**
 * Topic: video.ingest.object_created
 * Emitted by: services/api-gateway-go when S3 Multipart Upload completes on Raw R2 Bucket
 * Consumed by: workers/transcoder-cmaf (CPU Pool) AND workers/ai-* (Spot GPU Pool) in parallel
 */
export interface VideoIngestObjectCreatedEvent {
  event_id: string;
  event_type: "video.ingest.object_created";
  video_id: string;
  channel_id: string;
  raw_bucket: string;
  raw_s3_key: string;
  title: string;
  target_languages: string[]; // e.g. ["en", "hi", "es"]
  enable_shoppable_cv: boolean;
  emitted_at: string;
}

/**
 * Topic: video.transcode.progressive_ready
 * Emitted by: workers/transcoder-cmaf as soon as 360p CMAF (.m4s) rendition finishes (~3s)
 */
export interface VideoProgressiveReadyEvent {
  event_id: string;
  event_type: "video.transcode.progressive_ready";
  video_id: string;
  channel_id: string;
  aspect_ratio: AspectRatio;
  status: "STREAMABLE";
  master_m3u8_url: string;
  rendition_360p_init_url: string;
  rendition_360p_first_seg_url: string;
  emitted_at: string;
}

/**
 * Topic: video.transcode.completed
 * Emitted by: workers/transcoder-cmaf when all ABR ladders (360p, 720p, 1080p) + WebP sprites complete
 */
export interface VideoTranscodeCompletedEvent {
  event_id: string;
  event_type: "video.transcode.ready";
  video_id: string;
  channel_id: string;
  aspect_ratio: AspectRatio;
  duration_sec: number;
  master_m3u8_url: string;
  dash_mpd_url: string;
  poster_webp_url: string;
  spritesheet_webp_url: string;
  spritesheet_vtt_url: string;
  renditions: Array<{
    resolution: "360p" | "720p" | "1080p";
    codec: "h264" | "hevc" | "av1";
    width: number;
    height: number;
    bitrate_kbps: number;
    playlist_url: string;
    init_mp4_url: string;
    first_segment_url: string;
  }>;
  emitted_at: string;
}

/**
 * Topic: video.ai.completed
 * Emitted by: Spot GPU AI Enrichment Pipeline (Faster-Whisper, RAG/MCQ, YOLOv11+CLIP)
 */
export interface VideoAiEnrichmentCompletedEvent {
  event_id: string;
  event_type: "video.ai.transcript_ready";
  video_id: string;
  channel_id: string;
  subtitles: Array<{ lang: string; vtt_url: string }>;
  dubbed_audio_tracks: Array<{ lang: string; m4a_playlist_url: string }>;
  qdrant_chunks_indexed: number;
  mcqs_generated_count: number;
  products_overlay_url?: string;
  detected_products_count: number;
  emitted_at: string;
}

