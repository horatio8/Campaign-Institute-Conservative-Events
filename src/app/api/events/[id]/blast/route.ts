import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { enqueueWebhook } from "@/lib/webhooks";

const Body = z.object({
  subject: z.string().min(1).max(200),
  body: z.string().min(1),
  segment: z.enum(["registered", "approved", "pending", "waitlisted", "checked_in"]),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { type: "unauthenticated", message: "Sign in." } }, { status: 401 });

  const { id } = await params;
  const host = await prisma.eventHost.findFirst({ where: { eventId: id, userId: user.id } });
  if (!host) return NextResponse.json({ error: { type: "forbidden", message: "Not a host." } }, { status: 403 });

  const payload = await req.json().catch(() => null);
  const parsed = Body.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: { type: "validation_error", message: parsed.error.message } }, { status: 400 });
  }

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) return NextResponse.json({ error: { type: "not_found", message: "Event gone." } }, { status: 404 });

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

  const blast = await prisma.blast.create({
    data: {
      eventId: id,
      senderId: user.id,
      subject: parsed.data.subject,
      body: parsed.data.body,
      segment: parsed.data.segment,
      sentAt: new Date(),
      stats: JSON.stringify({ recipients: guests.length }),
    },
  });

  await enqueueWebhook(event.calendarId, "blast.sent", {
    blast_id: blast.id,
    recipients: guests.length,
  });

  return NextResponse.json({ ok: true, recipients: guests.length });
}
