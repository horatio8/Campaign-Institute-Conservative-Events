import { z } from "zod";
import { apiError, authPublic, ok } from "@/lib/api";
import { prisma } from "@/lib/db";
import { enqueueWebhook } from "@/lib/webhooks";

const Body = z.object({
  guest_api_id: z.string(),
  amount_cents: z.number().int().nonnegative().optional(),
  reason: z.string().optional(),
});

export async function POST(req: Request) {
  const auth = await authPublic(req);
  if (auth instanceof Response) return auth;
  const { key } = auth;

  const body = await req.json().catch(() => null);
  const parsed = Body.safeParse(body);
  if (!parsed.success) return apiError("validation_error", parsed.error.message, 400);

  const id = parsed.data.guest_api_id.replace(/^guest_/, "");
  const guest = await prisma.guest.findUnique({
    where: { id },
    include: { ticket: { include: { order: true } }, event: true },
  });
  if (!guest) return apiError("not_found", "Guest not found.", 404);
  if (key.calendar && guest.event.calendarId !== key.calendar.id) {
    return apiError("forbidden", "Scope mismatch.", 403);
  }

  if (guest.ticket?.order) {
    await prisma.ticketOrder.update({
      where: { id: guest.ticket.order.id },
      data: { status: "refunded" },
    });
    await prisma.ticket.update({
      where: { id: guest.ticket.id },
      data: { status: "refunded" },
    });
    await enqueueWebhook(guest.event.calendarId, "ticket.refunded", {
      order_id: guest.ticket.order.id,
      amount_cents: parsed.data.amount_cents ?? guest.ticket.order.totalCents,
    });
  }
  return ok({ ok: true });
}
