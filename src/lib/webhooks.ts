import { createHmac } from "node:crypto";
import { prisma } from "./db";

export type WebhookEventName =
  | "event.created"
  | "event.updated"
  | "event.cancelled"
  | "guest.registered"
  | "guest.status_changed"
  | "guest.checked_in"
  | "guest.updated"
  | "ticket.refunded"
  | "blast.sent";

export function signPayload(secret: string, payload: string, timestamp: number) {
  const mac = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
  return `t=${timestamp},v1=${mac}`;
}

export async function enqueueWebhook(
  calendarId: string,
  event: WebhookEventName,
  data: unknown
) {
  const endpoints = await prisma.webhookEndpoint.findMany({
    where: { calendarId, status: "active" },
  });
  const payload = JSON.stringify({
    event,
    data,
    api_version: "v1",
    created: new Date().toISOString(),
  });

  for (const ep of endpoints) {
    if (!ep.events.split(",").includes(event)) continue;
    await prisma.webhookDelivery.create({
      data: {
        endpointId: ep.id,
        event,
        payload,
        nextRetryAt: new Date(),
      },
    });
  }
}

// Dispatcher — in prod, call on a cron (/api/cron/webhooks) every minute.
export async function dispatchPending(max = 25): Promise<{ delivered: number; failed: number }> {
  const now = new Date();
  const pending = await prisma.webhookDelivery.findMany({
    where: {
      deliveredAt: null,
      nextRetryAt: { lte: now },
      attempts: { lt: 10 },
    },
    orderBy: { createdAt: "asc" },
    take: max,
    include: { endpoint: true },
  });

  let delivered = 0;
  let failed = 0;
  for (const d of pending) {
    const ts = Math.floor(Date.now() / 1000);
    const sig = signPayload(d.endpoint.secret, d.payload, ts);
    let status = 0;
    try {
      const res = await fetch(d.endpoint.url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "Luma-Signature": sig,
          "Luma-Event": d.event,
        },
        body: d.payload,
        signal: AbortSignal.timeout(10_000),
      });
      status = res.status;
    } catch {
      status = 0;
    }

    const ok = status >= 200 && status < 300;
    if (ok) {
      await prisma.webhookDelivery.update({
        where: { id: d.id },
        data: { statusCode: status, attempts: d.attempts + 1, deliveredAt: new Date() },
      });
      delivered += 1;
    } else {
      const nextAttempts = d.attempts + 1;
      const backoffMs = Math.min(60_000 * 2 ** nextAttempts, 24 * 60 * 60_000);
      await prisma.webhookDelivery.update({
        where: { id: d.id },
        data: {
          statusCode: status,
          attempts: nextAttempts,
          nextRetryAt: new Date(Date.now() + backoffMs),
        },
      });
      failed += 1;
    }
  }
  return { delivered, failed };
}
