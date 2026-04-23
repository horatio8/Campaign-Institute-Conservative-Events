import { apiError, authPublic, ok } from "@/lib/api";
import { prisma } from "@/lib/db";
import { pageEnvelope, serializeEvent } from "@/lib/serialize";

export async function GET(req: Request) {
  const auth = await authPublic(req);
  if (auth instanceof Response) return auth;
  const { key } = auth;
  if (!key.calendar) return apiError("forbidden", "Key has no calendar scope.", 403);

  const url = new URL(req.url);
  const cursor = url.searchParams.get("pagination_cursor");
  const limit = Math.min(Number(url.searchParams.get("pagination_limit") ?? 25), 100);
  const after = url.searchParams.get("after");
  const before = url.searchParams.get("before");

  const events = await prisma.event.findMany({
    where: {
      calendarId: key.calendar.id,
      ...(after ? { startsAt: { gte: new Date(after) } } : {}),
      ...(before ? { startsAt: { lte: new Date(before) } } : {}),
    },
    orderBy: { startsAt: "asc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = events.length > limit;
  const items = hasMore ? events.slice(0, limit) : events;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return ok(pageEnvelope(items.map(serializeEvent), nextCursor));
}
