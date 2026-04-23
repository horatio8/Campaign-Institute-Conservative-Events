import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

const Body = z.object({
  body: z.string().trim().min(1).max(2000),
  parentId: z.string().optional(),
});

async function canChat(userId: string, eventId: string) {
  const host = await prisma.eventHost.findFirst({ where: { eventId, userId } });
  if (host) return true;
  const guest = await prisma.guest.findFirst({
    where: {
      eventId,
      userId,
      status: { in: ["registered", "approved", "checked_in"] },
    },
  });
  return !!guest;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user || !(await canChat(user.id, id))) {
    return NextResponse.json({ error: { type: "forbidden", message: "Not permitted." } }, { status: 403 });
  }
  const messages = await prisma.chatMessage.findMany({
    where: { scopeType: "event", scopeId: id },
    orderBy: { createdAt: "asc" },
    take: 200,
    include: { sender: { select: { id: true, name: true, email: true } } },
  });
  return NextResponse.json(
    messages.map((m) => ({
      id: m.id,
      body: m.body,
      createdAt: m.createdAt,
      parentId: m.parentId,
      sender: {
        id: m.sender.id,
        displayName: m.sender.name ?? m.sender.email.split("@")[0],
      },
    }))
  );
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user || !(await canChat(user.id, id))) {
    return NextResponse.json({ error: { type: "forbidden", message: "Not permitted." } }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: { type: "validation_error", message: parsed.error.message } }, { status: 400 });
  }
  const message = await prisma.chatMessage.create({
    data: {
      scopeType: "event",
      scopeId: id,
      senderId: user.id,
      body: parsed.data.body,
      parentId: parsed.data.parentId,
    },
  });
  return NextResponse.json({ ok: true, id: message.id });
}
