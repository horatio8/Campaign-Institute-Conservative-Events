import { z } from "zod";
import { apiError, authPublic, ok } from "@/lib/api";
import { prisma } from "@/lib/db";
import { enqueueWebhook } from "@/lib/webhooks";

const Body = z.object({
  guest_api_id: z.string(),
  status: z.enum(["approved", "declined", "waitlisted", "checked_in", "registered", "pending"]),
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
    include: { event: true },
  });
  if (!guest) return apiError("not_found", "Guest not found.", 404);
  if (key.calendar && guest.event.calendarId !== key.calendar.id) {
    return apiError("forbidden", "Guest not in scoped calendar.", 403);
  }

  const updated = await prisma.guest.update({
    where: { id },
    data: {
      status: parsed.data.status,
      checkedInAt: parsed.data.status === "checked_in" ? new Date() : undefined,
    },
  });
  await enqueueWebhook(
    guest.event.calendarId,
    parsed.data.status === "checked_in" ? "guest.checked_in" : "guest.status_changed",
    { guest_id: id, status: updated.status }
  );
  return ok({ ok: true });
}
