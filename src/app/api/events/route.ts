import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { shortCode, slugify } from "@/lib/ids";
import { enqueueWebhook } from "@/lib/webhooks";

const Body = z.object({
  calendarId: z.string().optional(),
  newCalendarName: z.string().min(2).optional(),
  title: z.string().min(2),
  descriptionRich: z.string().optional(),
  coverUrl: z.string().url().optional(),
  startsAt: z.string(),
  endsAt: z.string(),
  timezone: z.string(),
  locationType: z.enum(["physical", "virtual", "hybrid"]),
  address: z.string().nullable().optional(),
  virtualUrl: z.string().url().nullable().optional(),
  capacity: z.number().int().positive().nullable().optional(),
  approvalRequired: z.boolean().optional(),
  visibility: z.enum(["public", "unlisted", "private"]).default("public"),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { error: { type: "unauthenticated", message: "Sign in required." } },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { type: "validation_error", message: parsed.error.message } },
      { status: 400 }
    );
  }
  const d = parsed.data;

  let calendarId = d.calendarId;
  if (!calendarId) {
    if (!d.newCalendarName) {
      return NextResponse.json(
        { error: { type: "validation_error", message: "Calendar required." } },
        { status: 400 }
      );
    }
    const baseSlug = slugify(d.newCalendarName);
    let slug = baseSlug;
    while (await prisma.calendar.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${shortCode(3)}`;
    }
    const cal = await prisma.calendar.create({
      data: {
        slug,
        name: d.newCalendarName,
        timezone: d.timezone,
        members: { create: { userId: user.id, role: "owner" } },
      },
    });
    calendarId = cal.id;
  } else {
    const member = await prisma.calendarMember.findUnique({
      where: { calendarId_userId: { calendarId, userId: user.id } },
    });
    if (!member || !["owner", "admin", "manager"].includes(member.role)) {
      return NextResponse.json(
        { error: { type: "forbidden", message: "Not permitted on this calendar." } },
        { status: 403 }
      );
    }
  }

  const baseSlug = slugify(d.title);
  let slug = `${baseSlug}-${shortCode(4)}`;
  while (await prisma.event.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${shortCode(5)}`;
  }
  let code = shortCode(7);
  while (await prisma.event.findUnique({ where: { shortCode: code } })) {
    code = shortCode(7);
  }

  const event = await prisma.event.create({
    data: {
      calendarId,
      slug,
      shortCode: code,
      title: d.title,
      descriptionRich: d.descriptionRich,
      coverUrl: d.coverUrl,
      startsAt: new Date(d.startsAt),
      endsAt: new Date(d.endsAt),
      timezone: d.timezone,
      locationType: d.locationType,
      address: d.address ?? undefined,
      virtualUrl: d.virtualUrl ?? undefined,
      virtualProvider: d.virtualUrl ? "custom" : undefined,
      capacity: d.capacity ?? undefined,
      approvalRequired: d.approvalRequired ?? false,
      visibility: d.visibility,
      hosts: { create: { userId: user.id, role: "host" } },
      ticketTypes: {
        create: {
          name: "Standard",
          priceCents: 0,
        },
      },
    },
  });

  await enqueueWebhook(calendarId, "event.created", { id: event.id, slug: event.slug });

  return NextResponse.json({ id: event.id, slug: event.slug, shortCode: event.shortCode });
}
