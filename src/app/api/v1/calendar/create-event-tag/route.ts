import { z } from "zod";
import { apiError, authPublic, ok } from "@/lib/api";
import { prisma } from "@/lib/db";
import { serializeTag } from "@/lib/serialize";

const Body = z.object({ name: z.string().min(1).max(40) });

export async function POST(req: Request) {
  const auth = await authPublic(req);
  if (auth instanceof Response) return auth;
  const { key } = auth;
  if (!key.calendar) return apiError("forbidden", "Key has no calendar scope.", 403);

  const body = await req.json().catch(() => null);
  const parsed = Body.safeParse(body);
  if (!parsed.success) return apiError("validation_error", parsed.error.message, 400);

  const tag = await prisma.eventTag.upsert({
    where: { calendarId_name: { calendarId: key.calendar.id, name: parsed.data.name } },
    create: { calendarId: key.calendar.id, name: parsed.data.name },
    update: {},
  });
  return ok(serializeTag(tag));
}
