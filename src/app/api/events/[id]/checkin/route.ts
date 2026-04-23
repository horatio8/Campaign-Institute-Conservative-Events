import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { enqueueWebhook } from "@/lib/webhooks";

const Body = z.object({ qrToken: z.string().min(6) });

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { type: "unauthenticated", message: "Sign in." } }, { status: 401 });
  const { id } = await params;
  const host = await prisma.eventHost.findFirst({ where: { eventId: id, userId: user.id } });
  if (!host) return NextResponse.json({ error: { type: "forbidden", message: "Not a host." } }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: { type: "validation_error", message: parsed.error.message } }, { status: 400 });
  }

  const ticket = await prisma.ticket.findUnique({
    where: { qrToken: parsed.data.qrToken },
    include: { guest: true, event: true },
  });
  if (!ticket || ticket.eventId !== id) {
    return NextResponse.json({ error: { type: "not_found", message: "No ticket for this event." } }, { status: 404 });
  }
  if (!ticket.guest) {
    return NextResponse.json({ error: { type: "conflict", message: "Ticket has no guest." } }, { status: 409 });
  }

  const guest = await prisma.guest.update({
    where: { id: ticket.guest.id },
    data: { status: "checked_in", checkedInAt: new Date() },
  });

  await enqueueWebhook(ticket.event.calendarId, "guest.checked_in", { guest_id: guest.id });
  return NextResponse.json({ ok: true, guest });
}
