import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { type: "unauthenticated", message: "Sign in." } }, { status: 401 });
  const { id } = await params;
  await prisma.subscription.upsert({
    where: { calendarId_userId: { calendarId: id, userId: user.id } },
    create: { calendarId: id, userId: user.id },
    update: {},
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { type: "unauthenticated", message: "Sign in." } }, { status: 401 });
  const { id } = await params;
  await prisma.subscription.deleteMany({
    where: { calendarId: id, userId: user.id },
  });
  return NextResponse.json({ ok: true });
}
