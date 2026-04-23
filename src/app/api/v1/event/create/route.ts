import { z } from "zod";
import { apiError, authPublic, ok } from "@/lib/api";
import { prisma } from "@/lib/db";
import { shortCode, slugify } from "@/lib/ids";
import { enqueueWebhook } from "@/lib/webhooks";
import { serializeEvent } from "@/lib/serialize";

const Body = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  cover_url: z.string().url().optional(),
  start_at: z.string(),
  end_at: z.string(),
  timezone: z.string(),
  location_type: z.enum(["physical", "virtual", "hybrid"]).default("physical"),
  address: z.string().optional(),
  virtual_url: z.string().url().optional(),
  capacity: z.number().int().positive().optional(),
  approval_required: z.boolean().optional(),
  visibility: z.enum(["public", "unlisted", "private"]).default("public"),
});

export async function POST(req: Request) {
  const auth = await authPublic(req);
  if (auth instanceof Response) return auth;
  const { key } = auth;
  if (!key.calendar) return apiError("forbidden", "Key has no calendar scope.", 403);

  const body = await req.json().catch(() => null);
  const parsed = Body.safeParse(body);
  if (!parsed.success) return apiError("validation_error", parsed.error.message, 400);
  const d = parsed.data;

  const baseSlug = slugify(d.name);
  let slug = `${baseSlug}-${shortCode(4)}`;
  while (await prisma.event.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${shortCode(5)}`;
  }
  let code = shortCode(7);
  while (await prisma.event.findUnique({ where: { shortCode: code } })) {
    code = shortCode(7);
  }

  const event = await prisma.event.create({
    data: {
      calendarId: key.calendar.id,
      slug,
      shortCode: code,
      title: d.name,
      descriptionRich: d.description,
      coverUrl: d.cover_url,
      startsAt: new Date(d.start_at),
      endsAt: new Date(d.end_at),
      timezone: d.timezone,
      locationType: d.location_type,
      address: d.address,
      virtualUrl: d.virtual_url,
      virtualProvider: d.virtual_url ? "custom" : undefined,
      capacity: d.capacity,
      approvalRequired: d.approval_required ?? false,
      visibility: d.visibility,
      ticketTypes: { create: { name: "Standard", priceCents: 0 } },
    },
  });

  await enqueueWebhook(key.calendar.id, "event.created", { id: event.id });
  return ok(serializeEvent(event));
}
