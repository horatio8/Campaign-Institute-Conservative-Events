import { z } from "zod";
import { apiError, authPublic, ok } from "@/lib/api";
import { prisma } from "@/lib/db";

const Body = z.object({
  people: z
    .array(
      z.object({
        email: z.string().email(),
        name: z.string().optional(),
        phone: z.string().optional(),
        tags: z.array(z.string()).optional(),
      })
    )
    .min(1),
});

export async function POST(req: Request) {
  const auth = await authPublic(req);
  if (auth instanceof Response) return auth;
  const { key } = auth;
  if (!key.calendar) return apiError("forbidden", "Key has no calendar scope.", 403);

  const body = await req.json().catch(() => null);
  const parsed = Body.safeParse(body);
  if (!parsed.success) return apiError("validation_error", parsed.error.message, 400);

  let imported = 0;
  for (const p of parsed.data.people) {
    const person = await prisma.person.upsert({
      where: { calendarId_email: { calendarId: key.calendar.id, email: p.email.toLowerCase() } },
      create: {
        calendarId: key.calendar.id,
        email: p.email.toLowerCase(),
        name: p.name,
        phone: p.phone,
      },
      update: { name: p.name, phone: p.phone },
    });
    imported += 1;

    for (const tagName of p.tags ?? []) {
      const tag = await prisma.personTag.upsert({
        where: { calendarId_name: { calendarId: key.calendar.id, name: tagName } },
        create: { calendarId: key.calendar.id, name: tagName },
        update: {},
      });
      await prisma.personTagAssignment.upsert({
        where: { personId_tagId: { personId: person.id, tagId: tag.id } },
        create: { personId: person.id, tagId: tag.id },
        update: {},
      });
    }
  }
  return ok({ imported });
}
