import { apiError, authPublic, ok } from "@/lib/api";
import { prisma } from "@/lib/db";
import { pageEnvelope } from "@/lib/serialize";

export async function GET(req: Request) {
  const auth = await authPublic(req);
  if (auth instanceof Response) return auth;
  const { key } = auth;
  if (!key.calendar) return apiError("forbidden", "Key has no calendar scope.", 403);

  const url = new URL(req.url);
  const cursor = url.searchParams.get("pagination_cursor");
  const limit = Math.min(Number(url.searchParams.get("pagination_limit") ?? 25), 100);

  const people = await prisma.person.findMany({
    where: { calendarId: key.calendar.id },
    orderBy: { id: "asc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = people.length > limit;
  const items = hasMore ? people.slice(0, limit) : people;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return ok(
    pageEnvelope(
      items.map((p) => ({
        api_id: `person_${p.id}`,
        email: p.email,
        name: p.name,
        phone: p.phone,
      })),
      nextCursor
    )
  );
}
