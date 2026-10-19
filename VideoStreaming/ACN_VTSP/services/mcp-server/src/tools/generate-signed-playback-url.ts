/**
 * MCP Tool 4: `generate_signed_playback_url` (`services/mcp-server/src/tools/generate-signed-playback-url.ts`)
 * Issues a time-limited HMAC-SHA256 signed HLS URL and `<acn-video-player>` Web Component embed snippet.
 */

import * as crypto from "node:crypto";

export interface GenerateSignedPlaybackArgs {
  video_id: string;
  allowed_origin: string;
  expires_in_sec?: number;
}

export function executeGenerateSignedPlaybackUrl(args: GenerateSignedPlaybackArgs, secret: string) {
  const exp = Math.floor(Date.now() / 1000) + (args.expires_in_sec ?? 3600);
  const payload = `${args.video_id}:${args.allowed_origin}:${exp}`;
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  const token = `tok_${sig.slice(0, 24)}`;

  return {
    video_id: args.video_id,
    allowed_origin: args.allowed_origin,
    expires_at_unix: exp,
    signed_hls_url: `http://localhost:8080/out_cmaf/videos/${args.video_id}/master.m3u8?token=${token}&exp=${exp}`,
    embed_html: `<acn-video-player video-id="${args.video_id}" token="${token}" origin="${args.allowed_origin}"></acn-video-player>`,
  };
}

