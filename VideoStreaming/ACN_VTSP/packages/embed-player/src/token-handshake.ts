/**
 * ACN-VTSP Headless Embed Player Token Handshake (`packages/embed-player/src/token-handshake.ts`)
 * Validates scoped embed playback tokens and enforces CORS / Origin domain locks before loading CMAF streams.
 */

export interface SignedPlaybackTokenPayload {
  videoId: string;
  allowedOrigin: string;
  expiresAtUnix: number;
  signatureHmac: string;
}

export function verifyEmbedTokenOrigin(
  payload: SignedPlaybackTokenPayload,
  currentOrigin: string
): { valid: boolean; reason?: string } {
  const nowSec = Math.floor(Date.now() / 1000);
  if (payload.expiresAtUnix < nowSec) {
    return { valid: false, reason: "TOKEN_EXPIRED" };
  }
  if (payload.allowedOrigin !== "*" && payload.allowedOrigin !== currentOrigin) {
    return {
      valid: false,
      reason: `ORIGIN_MISMATCH: expected ${payload.allowedOrigin}, got ${currentOrigin}`,
    };
  }
  return { valid: true };
}

