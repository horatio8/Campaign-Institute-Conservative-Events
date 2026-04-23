import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { buildIcs } from "@/lib/ics";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // Accept either calendar id or slug in this segment.
  const calendar = await prisma.calendar.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: {
      events: {
        where: { status: "published", visibility: "public" },
        orderBy: { startsAt: "asc" },
        take: 200,
      },
    },
  });
  if (!calendar) return new NextResponse("Not found", { status: 404 });

  const base = process.env.APP_URL ?? "http://localhost:3000";
  const ics = buildIcs(
    calendar.events.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.descriptionRich,
      startsAt: e.startsAt,
      endsAt: e.endsAt,
      address: e.address,
      url: `${base}/event/${e.slug}`,
    }))
  );

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="${calendar.slug}.ics"`,
    },
  });
}
