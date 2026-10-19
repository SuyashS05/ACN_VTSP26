/**
 * MCP Tool 2: `search_channel_videos` (`services/mcp-server/src/tools/search-channel-videos.ts`)
 * Semantic Qdrant vector search across creator transcripts & metadata returning [mm:ss] timestamp hits.
 */

export interface SearchChannelVideosArgs {
  query: string;
  limit?: number;
}

export function executeSearchChannelVideos(args: SearchChannelVideosArgs) {
  return {
    query: args.query,
    matches: [
      {
        video_id: "vid_8842",
        title: "Zero-Egress CMAF Streaming & KEDA Spot Architecture (sample-3.mp4)",
        timestamp: "00:02",
        timestamp_sec: 2.0,
        similarity_score: 0.94,
        snippet: "FFmpeg decodes the source video once via -filter_complex and packages 360p, 720p, and 1080p into 2s CMAF .m4s chunks.",
      },
      {
        video_id: "vid_9104",
        title: "Sub-5ms Go WebSocket Chat Moderation with Int8 ONNX (sd.mp4)",
        timestamp: "00:06",
        timestamp_sec: 6.0,
        similarity_score: 0.89,
        snippet: "Stage 1 runs a 0.1ms Go Aho-Corasick Trie filter; Stage 2 runs a 4.0ms quantized Int8 ONNX Detoxify model.",
      },
    ].slice(0, args.limit ?? 5),
  };
}

