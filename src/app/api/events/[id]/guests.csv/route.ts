import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { serializeCsv } from "@/lib/csv";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { error: { type: "unauthenticated", message: "Sign in." } },
      { status: 401 }
    );
  }
  const { id } = await params;
  const host = await prisma.eventHost.findFirst({ where: { eventId: id, userId: user.id } });
  if (!host) {
    return NextResponse.json(
      { error: { type: "forbidden", message: "Not a host." } },
      { status: 403 }
    );
  }

  const event = await prisma.event.findUnique({ where: { id } });
  const guests = await prisma.guest.findMany({
    where: { eventId: id },
    orderBy: { registeredAt: "asc" },
  });

  const rows: (string | number | null)[][] = [
    ["name", "email", "status", "registered_at", "checked_in_at", "referrer_user_id"],
    ...guests.map((g) => [
      g.displayName,
      g.email,
      g.status,
      g.registeredAt.toISOString(),
      g.checkedInAt?.toISOString() ?? "",
      g.referrerUserId ?? "",
    ]),
  ];

  const csv = serializeCsv(rows);
  const filename = `${event?.slug ?? id}-guests.csv`;
  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
    },
  });
}
