/**
 * ACN-VTSP Dual-Path Live Streaming Orchestrator (`services/live-orchestrator/src/controller.ts`)
 * Phase 6.1: Coordinates LiveKit WebRTC SFU rooms (<300ms co-hosting for up to 50 speakers)
 * and MediaMTX WHIP/RTMP -> Low-Latency HLS (LL-HLS 0.5s parts) egress for 10,000+ viewers.
 */

export interface LiveRoomSession {
  room_id: string;
  channel_id: string;
  title: string;
  webrtc_sfu_url: string;
  whip_ingest_url: string;
  ll_hls_playback_url: string;
  yjs_whiteboard_ws: string;
  chat_moderation_ws: string;
  max_cohosts: number;
  ll_hls_part_duration_sec: number;
}

export function createLiveRoomSession(roomId: string, channelId: string, title: string): LiveRoomSession {
  return {
    room_id: roomId,
    channel_id: channelId,
    title,
    webrtc_sfu_url: `ws://localhost:7880/rtc/${roomId}`,
    whip_ingest_url: `http://localhost:8889/${roomId}/whip`,
    ll_hls_playback_url: `http://localhost:8888/${roomId}/index.m3u8`,
    yjs_whiteboard_ws: `ws://localhost:8082/yjs/${roomId}`,
    chat_moderation_ws: `ws://localhost:8081/ws/chat/${roomId}`,
    max_cohosts: 50,
    ll_hls_part_duration_sec: 0.5,
  };
}

