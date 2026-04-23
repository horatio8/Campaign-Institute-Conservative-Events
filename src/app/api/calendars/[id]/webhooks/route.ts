import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { randomToken } from "@/lib/ids";

const EVENTS = [
  "event.created", "event.updated", "event.cancelled",
  "guest.registered", "guest.status_changed", "guest.checked_in",
  "guest.updated", "ticket.refunded", "blast.sent",
] as const;

const Body = z.object({
  url: z.string().url(),
  events: z.array(z.enum(EVENTS)).min(1),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { type: "unauthenticated", message: "Sign in." } }, { status: 401 });
  const { id } = await params;
  const m = await prisma.calendarMember.findUnique({
    where: { calendarId_userId: { calendarId: id, userId: user.id } },
  });
  if (!m || !["owner", "admin"].includes(m.role)) {
    return NextResponse.json({ error: { type: "forbidden", message: "Admins only." } }, { status: 403 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: { type: "validation_error", message: parsed.error.message } }, { status: 400 });
  }

  const secret = `whsec_${randomToken(18)}`;
  const endpoint = await prisma.webhookEndpoint.create({
    data: {
      calendarId: id,
      url: parsed.data.url,
      secret,
      events: parsed.data.events.join(","),
    },
  });
  return NextResponse.json({ id: endpoint.id, secret });
}
