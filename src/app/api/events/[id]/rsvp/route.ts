import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { randomToken } from "@/lib/ids";
import { sendEmail } from "@/lib/email";
import { enqueueWebhook } from "@/lib/webhooks";

const Body = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  answers: z.record(z.string(), z.string()).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getSessionUser();
  const body = await req.json().catch(() => null);
  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { type: "validation_error", message: parsed.error.message } },
      { status: 400 }
    );
  }
  const event = await prisma.event.findUnique({
    where: { id },
    include: { _count: { select: { guests: true } }, ticketTypes: true },
  });
  if (!event) {
    return NextResponse.json(
      { error: { type: "not_found", message: "Event not found." } },
      { status: 404 }
    );
  }
  if (event.status !== "published") {
    return NextResponse.json(
      { error: { type: "conflict", message: "Event is not accepting RSVPs." } },
      { status: 409 }
    );
  }

  const email = parsed.data.email.trim().toLowerCase();
  const guestStatus = event.approvalRequired ? "pending" : "registered";

  const atCapacity = event.capacity != null && event._count.guests >= event.capacity;
  const finalStatus = atCapacity ? "waitlisted" : guestStatus;

  const existing = await prisma.guest.findUnique({
    where: { eventId_email: { eventId: event.id, email } },
  });
  if (existing) {
    return NextResponse.json(
      { error: { type: "conflict", message: "Already registered." } },
      { status: 409 }
    );
  }

  const guestUserId = user?.email === email ? user.id : null;

  const guest = await prisma.guest.create({
    data: {
      eventId: event.id,
      userId: guestUserId,
      displayName: parsed.data.name,
      email,
      status: finalStatus,
      answers: parsed.data.answers
        ? {
            create: Object.entries(parsed.data.answers).map(([qid, val]) => ({
              questionId: qid,
              value: JSON.stringify(val),
            })),
          }
        : undefined,
    },
  });

  const freeTicket = event.ticketTypes.find((t) => t.priceCents === 0);
  if (freeTicket && finalStatus === "registered") {
    const order = await prisma.ticketOrder.create({
      data: {
        eventId: event.id,
        buyerUserId: guestUserId ?? undefined,
        totalCents: 0,
        status: "paid",
      },
    });
    await prisma.ticket.create({
      data: {
        orderId: order.id,
        eventId: event.id,
        ticketTypeId: freeTicket.id,
        guestId: guest.id,
        qrToken: randomToken(18),
      },
    });
  }

  await sendEmail({
    to: email,
    subject:
      finalStatus === "waitlisted"
        ? `You're on the waitlist for ${event.title}`
        : finalStatus === "pending"
        ? `Registration request received: ${event.title}`
        : `Registration confirmed for ${event.title}`,
    text: `Hi ${parsed.data.name},\n\nThanks for registering. Status: ${finalStatus}.\n\nEvent: ${event.title}\nWhen: ${event.startsAt.toUTCString()}\nWhere: ${event.address ?? event.virtualUrl ?? "TBA"}\n\nSee you there!\n`,
  });

  await enqueueWebhook(event.calendarId, "guest.registered", {
    event_id: event.id,
    guest_id: guest.id,
    status: finalStatus,
  });

  return NextResponse.json({ ok: true, status: finalStatus, guestId: guest.id });
}
