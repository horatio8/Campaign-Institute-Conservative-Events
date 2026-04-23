import { z } from "zod";
import { apiError, authPublic, ok } from "@/lib/api";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { enqueueWebhook } from "@/lib/webhooks";

const Body = z.object({
  event_api_id: z.string(),
  guests: z
    .array(
      z.object({
        email: z.string().email(),
        name: z.string().optional(),
        approval_status: z.enum(["approved", "pending", "registered", "invited"]).optional(),
      })
    )
    .min(1),
  send_invite_email: z.boolean().default(false),
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

  const created = [];
  for (const g of parsed.data.guests) {
    const email = g.email.toLowerCase();
    try {
      const guest = await prisma.guest.create({
        data: {
          eventId: id,
          displayName: g.name ?? email,
          email,
          status: g.approval_status ?? (event.approvalRequired ? "pending" : "registered"),
        },
      });
      created.push(guest);
      if (parsed.data.send_invite_email) {
        await sendEmail({
          to: email,
          subject: `You're invited to ${event.title}`,
          text: `You've been added to ${event.title}. RSVP at ${process.env.APP_URL}/event/${event.slug}`,
        });
      }
      await enqueueWebhook(key.calendar.id, "guest.registered", { guest_id: guest.id });
    } catch {
      // already exists — skip
    }
  }

  return ok({ added: created.length });
}
