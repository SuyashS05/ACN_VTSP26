/**
 * ACN-VTSP Webhook Event Schemas (`services/webhook-dispatcher/src/events.ts`)
 * Defines strongly typed payloads for all 5 outbound platform webhook events.
 */

export type WebhookEventType =
  | "video.upload.completed"
  | "video.transcode.ready"
  | "video.ai.transcript_ready"
  | "live.stream.started"
  | "product.Popup.clicked";

export interface OutboundWebhookJob {
  jobId: string;
  channelId: string;
  targetUrl: string;
  webhookSecretHmac: string;
  event: WebhookEventType;
  data: Record<string, unknown>;
  attempt: number;
  maxAttempts: number;
}

