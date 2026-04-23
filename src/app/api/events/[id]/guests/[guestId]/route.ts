import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { enqueueWebhook } from "@/lib/webhooks";

const Body = z.object({
  status: z.enum(["pending", "registered", "approved", "declined", "waitlisted", "checked_in", "cancelled"]),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; guestId: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: { type: "unauthenticated", message: "Sign in." } }, { status: 401 });
  }
  const { id, guestId } = await params;
  const host = await prisma.eventHost.findFirst({ where: { eventId: id, userId: user.id } });
  if (!host) {
    return NextResponse.json({ error: { type: "forbidden", message: "Not a host." } }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: { type: "validation_error", message: parsed.error.message } }, { status: 400 });
  }

  const data: Record<string, unknown> = { status: parsed.data.status };
  if (parsed.data.status === "checked_in") {
    data.checkedInAt = new Date();
  }

  const guest = await prisma.guest.update({
    where: { id: guestId },
    data,
  });

  const event = await prisma.event.findUnique({ where: { id } });
  if (event) {
    if (parsed.data.status === "checked_in") {
      await enqueueWebhook(event.calendarId, "guest.checked_in", { guest_id: guest.id });
    } else {
      await enqueueWebhook(event.calendarId, "guest.status_changed", {
        guest_id: guest.id,
        status: guest.status,
      });
    }
  }

  return NextResponse.json({ ok: true, guest });
}
