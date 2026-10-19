/**
 * ACN-VTSP BullMQ + Redis Webhook Worker (`services/webhook-dispatcher/src/worker.ts`)
 * Consumes pipeline completion events and dispatches HMAC-SHA256 signed HTTP POST requests with exponential backoff.
 */

import { signWebhookPayload } from "./signer.ts";
import type { OutboundWebhookJob } from "./events.ts";

export async function dispatchWebhookJob(job: OutboundWebhookJob): Promise<{
  delivered: boolean;
  statusCode: number;
  headers: Record<string, string>;
  nextBackoffMs?: number;
}> {
  const signed = signWebhookPayload(job.event, job.data, job.webhookSecretHmac);

  try {
    const res = await fetch(job.targetUrl, {
      method: "POST",
      headers: signed.headers,
      body: signed.bodyString,
    });
    if (res.ok) {
      return { delivered: true, statusCode: res.status, headers: signed.headers };
    }
    const backoff = Math.pow(2, job.attempt) * 1000;
    return { delivered: false, statusCode: res.status, headers: signed.headers, nextBackoffMs: backoff };
  } catch {
    const backoff = Math.pow(2, job.attempt) * 1000;
    return { delivered: false, statusCode: 0, headers: signed.headers, nextBackoffMs: backoff };
  }
}

