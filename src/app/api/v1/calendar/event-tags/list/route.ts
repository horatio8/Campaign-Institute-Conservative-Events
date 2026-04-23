import { apiError, authPublic, ok } from "@/lib/api";
import { prisma } from "@/lib/db";
import { serializeTag } from "@/lib/serialize";

export async function GET(req: Request) {
  const auth = await authPublic(req);
  if (auth instanceof Response) return auth;
  const { key } = auth;
  if (!key.calendar) return apiError("forbidden", "Key has no calendar scope.", 403);

  const tags = await prisma.eventTag.findMany({
    where: { calendarId: key.calendar.id },
    orderBy: { name: "asc" },
  });
  return ok({ entries: tags.map(serializeTag) });
}
