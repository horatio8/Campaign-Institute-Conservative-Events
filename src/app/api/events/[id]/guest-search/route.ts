import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: { type: "unauthenticated", message: "Sign in." } }, { status: 401 });
  const { id } = await params;
  const host = await prisma.eventHost.findFirst({ where: { eventId: id, userId: user.id } });
  if (!host) return NextResponse.json({ error: { type: "forbidden", message: "Not a host." } }, { status: 403 });

  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  if (q.length < 1) return NextResponse.json([]);

  const results = await prisma.guest.findMany({
    where: {
      eventId: id,
      OR: [
        { displayName: { contains: q } },
        { email: { contains: q } },
      ],
    },
    take: 25,
    orderBy: { registeredAt: "desc" },
  });
  return NextResponse.json(results);
}
