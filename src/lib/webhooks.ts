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
  // An out-of-process worker would pick these up; left as an exercise.
}
