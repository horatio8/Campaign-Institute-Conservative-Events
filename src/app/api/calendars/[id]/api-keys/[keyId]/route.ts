import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; keyId: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { type: "unauthenticated", message: "Sign in." } }, { status: 401 });
  const { id, keyId } = await params;
  const m = await prisma.calendarMember.findUnique({
    where: { calendarId_userId: { calendarId: id, userId: user.id } },
  });
  if (!m || !["owner", "admin"].includes(m.role)) {
    return NextResponse.json({ error: { type: "forbidden", message: "Admins only." } }, { status: 403 });
  }
  await prisma.apiKey.update({
    where: { id: keyId },
    data: { revokedAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
