import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { generateApiKey } from "@/lib/apikey";

const Body = z.object({ label: z.string().max(40).optional() });

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

  const body = await req.json().catch(() => null);
  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: { type: "validation_error", message: parsed.error.message } }, { status: 400 });
  }

  const { raw, hash, lastFour } = generateApiKey();
  await prisma.apiKey.create({
    data: {
      calendarId: id,
      scope: "calendar",
      label: parsed.data.label,
      lastFour,
      keyHash: hash,
    },
  });
  return NextResponse.json({ raw, lastFour });
}
