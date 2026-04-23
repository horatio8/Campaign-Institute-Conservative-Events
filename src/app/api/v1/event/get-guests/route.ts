import { apiError, authPublic, ok } from "@/lib/api";
import { prisma } from "@/lib/db";
import { pageEnvelope, serializeGuest } from "@/lib/serialize";

export async function GET(req: Request) {
  const auth = await authPublic(req);
  if (auth instanceof Response) return auth;
  const { key } = auth;

  const url = new URL(req.url);
  const eventApi = url.searchParams.get("event_api_id");
  if (!eventApi) return apiError("validation_error", "event_api_id required.", 400);
  const eventId = eventApi.replace(/^evt_/, "");
  const cursor = url.searchParams.get("pagination_cursor");
  const limit = Math.min(Number(url.searchParams.get("pagination_limit") ?? 50), 200);
  const status = url.searchParams.get("approval_status");

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || (key.calendar && event.calendarId !== key.calendar.id)) {
    return apiError("not_found", "Event not found.", 404);
  }

  const guests = await prisma.guest.findMany({
    where: { eventId, ...(status ? { status } : {}) },
    orderBy: { registeredAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = guests.length > limit;
  const items = hasMore ? guests.slice(0, limit) : guests;
  return ok(
    pageEnvelope(
      items.map(serializeGuest),
      hasMore ? items[items.length - 1].id : null
    )
  );
}
