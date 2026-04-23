import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { enqueueWebhook } from "@/lib/webhooks";

const Patch = z.object({
  title: z.string().min(2).optional(),
  descriptionRich: z.string().optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  timezone: z.string().optional(),
  address: z.string().nullable().optional(),
  virtualUrl: z.string().url().nullable().optional(),
  capacity: z.number().int().positive().nullable().optional(),
  status: z.enum(["draft", "published", "cancelled"]).optional(),
});

async function assertHost(userId: string, eventId: string) {
  const host = await prisma.eventHost.findFirst({
    where: { eventId, userId },
  });
  return !!host;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { type: "unauthenticated", message: "Sign in." } }, { status: 401 });
  const { id } = await params;
  if (!(await assertHost(user.id, id))) {
    return NextResponse.json({ error: { type: "forbidden", message: "Not your event." } }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = Patch.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: { type: "validation_error", message: parsed.error.message } }, { status: 400 });
  }

  const data: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.startsAt) data.startsAt = new Date(parsed.data.startsAt);
  if (parsed.data.endsAt) data.endsAt = new Date(parsed.data.endsAt);

  const event = await prisma.event.update({ where: { id }, data });
  await enqueueWebhook(
    event.calendarId,
    event.status === "cancelled" ? "event.cancelled" : "event.updated",
    { id: event.id, slug: event.slug }
  );

  return NextResponse.json({ ok: true, event });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { type: "unauthenticated", message: "Sign in." } }, { status: 401 });
  const { id } = await params;
  if (!(await assertHost(user.id, id))) {
    return NextResponse.json({ error: { type: "forbidden", message: "Not your event." } }, { status: 403 });
  }
  const event = await prisma.event.update({
    where: { id },
    data: { status: "cancelled" },
  });
  await enqueueWebhook(event.calendarId, "event.cancelled", { id: event.id, slug: event.slug });
  return NextResponse.json({ ok: true });
}
