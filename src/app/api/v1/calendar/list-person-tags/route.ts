import { apiError, authPublic, ok } from "@/lib/api";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const auth = await authPublic(req);
  if (auth instanceof Response) return auth;
  const { key } = auth;
  if (!key.calendar) return apiError("forbidden", "Key has no calendar scope.", 403);

  const tags = await prisma.personTag.findMany({
    where: { calendarId: key.calendar.id },
    orderBy: { name: "asc" },
  });
  return ok({ entries: tags.map((t) => ({ api_id: `ptag_${t.id}`, name: t.name })) });
}
