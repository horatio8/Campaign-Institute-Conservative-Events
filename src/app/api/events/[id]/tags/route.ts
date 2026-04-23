import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

const Body = z.object({ name: z.string().min(1).max(40) });

async function assertHost(eventId: string, userId: string) {
  return !!(await prisma.eventHost.findFirst({ where: { eventId, userId } }));
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const assignments = await prisma.eventTagAssignment.findMany({
    where: { eventId: id },
    include: { tag: true },
  });
  return NextResponse.json(
    assignments.map((a) => ({ id: a.tag.id, name: a.tag.name }))
  );
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { type: "unauthenticated", message: "Sign in." } }, { status: 401 });
  const { id } = await params;
  if (!(await assertHost(id, user.id))) {
    return NextResponse.json({ error: { type: "forbidden", message: "Not a host." } }, { status: 403 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: { type: "validation_error", message: parsed.error.message } }, { status: 400 });
  }
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) return NextResponse.json({ error: { type: "not_found", message: "Event gone." } }, { status: 404 });

  const tag = await prisma.eventTag.upsert({
    where: { calendarId_name: { calendarId: event.calendarId, name: parsed.data.name } },
    create: { calendarId: event.calendarId, name: parsed.data.name },
    update: {},
  });
  await prisma.eventTagAssignment.upsert({
    where: { eventId_tagId: { eventId: id, tagId: tag.id } },
    create: { eventId: id, tagId: tag.id },
    update: {},
  });
  return NextResponse.json({ ok: true, tag });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { type: "unauthenticated", message: "Sign in." } }, { status: 401 });
  const { id } = await params;
  if (!(await assertHost(id, user.id))) {
    return NextResponse.json({ error: { type: "forbidden", message: "Not a host." } }, { status: 403 });
  }
  const url = new URL(req.url);
  const tagId = url.searchParams.get("tagId");
  if (!tagId) return NextResponse.json({ error: { type: "validation_error", message: "tagId required." } }, { status: 400 });
  await prisma.eventTagAssignment.deleteMany({ where: { eventId: id, tagId } });
  return NextResponse.json({ ok: true });
}
