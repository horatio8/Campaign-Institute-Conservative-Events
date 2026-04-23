import { z } from "zod";
import { apiError, authPublic, ok } from "@/lib/api";
import { prisma } from "@/lib/db";
import { enqueueWebhook } from "@/lib/webhooks";
import { serializeEvent } from "@/lib/serialize";

const Body = z.object({
  event_api_id: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  start_at: z.string().optional(),
  end_at: z.string().optional(),
  capacity: z.number().int().positive().nullable().optional(),
  status: z.enum(["draft", "published", "cancelled"]).optional(),
});

export async function POST(req: Request) {
  const auth = await authPublic(req);
  if (auth instanceof Response) return auth;
  const { key } = auth;
  if (!key.calendar) return apiError("forbidden", "Key has no calendar scope.", 403);

  const body = await req.json().catch(() => null);
  const parsed = Body.safeParse(body);
  if (!parsed.success) return apiError("validation_error", parsed.error.message, 400);
  const { event_api_id, ...fields } = parsed.data;
  const id = event_api_id.replace(/^evt_/, "");

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event || event.calendarId !== key.calendar.id) {
    return apiError("not_found", "Event not found.", 404);
  }

  const data: Record<string, unknown> = {};
  if (fields.name) data.title = fields.name;
  if (fields.description !== undefined) data.descriptionRich = fields.description;
  if (fields.start_at) data.startsAt = new Date(fields.start_at);
  if (fields.end_at) data.endsAt = new Date(fields.end_at);
  if (fields.capacity !== undefined) data.capacity = fields.capacity;
  if (fields.status) data.status = fields.status;

  const updated = await prisma.event.update({ where: { id }, data });
  await enqueueWebhook(
    key.calendar.id,
    fields.status === "cancelled" ? "event.cancelled" : "event.updated",
    { id }
  );
  return ok(serializeEvent(updated));
}
