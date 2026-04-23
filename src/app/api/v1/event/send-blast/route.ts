import { z } from "zod";
import { apiError, authPublic, ok } from "@/lib/api";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { enqueueWebhook } from "@/lib/webhooks";

const Body = z.object({
  event_api_id: z.string(),
  subject: z.string().min(1),
  body: z.string().min(1),
  segment: z.enum(["registered", "approved", "pending", "waitlisted", "checked_in"]).default("registered"),
});

export async function POST(req: Request) {
  const auth = await authPublic(req);
  if (auth instanceof Response) return auth;
  const { key } = auth;
  if (!key.calendar) return apiError("forbidden", "Key has no calendar scope.", 403);

  const body = await req.json().catch(() => null);
  const parsed = Body.safeParse(body);
  if (!parsed.success) return apiError("validation_error", parsed.error.message, 400);

  const id = parsed.data.event_api_id.replace(/^evt_/, "");
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event || event.calendarId !== key.calendar.id) {
    return apiError("not_found", "Event not found.", 404);
  }

  const guests = await prisma.guest.findMany({
    where: { eventId: id, status: parsed.data.segment },
  });
  for (const g of guests) {
    await sendEmail({
      to: g.email,
      subject: parsed.data.subject,
      text: parsed.data.body,
    });
  }
  const owner = await prisma.calendarMember.findFirst({
    where: { calendarId: key.calendar.id, role: "owner" },
  });
  const blast = await prisma.blast.create({
    data: {
      eventId: id,
      senderId: owner?.userId ?? (await ensureSystemUser()).id,
      subject: parsed.data.subject,
      body: parsed.data.body,
      segment: parsed.data.segment,
      sentAt: new Date(),
      stats: JSON.stringify({ recipients: guests.length }),
    },
  });
  await enqueueWebhook(key.calendar.id, "blast.sent", {
    blast_id: blast.id,
    recipients: guests.length,
  });
  return ok({ recipients: guests.length });
}

async function ensureSystemUser() {
  return prisma.user.upsert({
    where: { email: "system@luma.local" },
    create: { email: "system@luma.local", name: "System" },
    update: {},
  });
}
