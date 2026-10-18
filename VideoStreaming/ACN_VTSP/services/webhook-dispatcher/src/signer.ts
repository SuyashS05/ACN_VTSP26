/**
 * ACN-VTSP Phase 7.1: Event-Driven Webhook Engine with HMAC-SHA256 Payload Signing
 * Fires real-time events to creator servers:
 *   - `video.upload.completed`
 *   - `video.transcode.ready`
 *   - `video.ai.transcript_ready`
 *   - `live.stream.started`
 *   - `product.Popup.clicked`
 */

import crypto from "node:crypto";

export interface WebhookEnvelope<T = Record<string, unknown>> {
  id: string;
  event:
    | "video.upload.completed"
    | "video.transcode.ready"
    | "video.ai.transcript_ready"
    | "live.stream.started"
    | "product.Popup.clicked";
  created_at: number;
  data: T;
}

export function signWebhookPayload(payloadJSON: string, timestampSec: number, secret: string): string {
  const signedContent = `${timestampSec}.${payloadJSON}`;
  const hmac = crypto.createHmac("sha256", secret).update(signedContent).digest("hex");
  return `t=${timestampSec},v1=${hmac}`;
}

export function buildWebhookHeaders(payloadJSON: string, eventType: string, secret: string): Record<string, string> {
  const nowSec = Math.floor(Date.now() / 1000);
  return {
    "Content-Type": "application/json",
    "User-Agent": "ACN-VTSP-Webhook-Engine/1.0",
    "X-Platform-Event": eventType,
    "X-Platform-Timestamp": String(nowSec),
    "X-Platform-Signature": signWebhookPayload(payloadJSON, nowSec, secret),
  };
}

