import { apiError, authPublic, ok } from "@/lib/api";
import { prisma } from "@/lib/db";
import { serializeEvent } from "@/lib/serialize";

export async function GET(req: Request) {
  const auth = await authPublic(req);
  if (auth instanceof Response) return auth;
  const { key } = auth;

  const url = new URL(req.url);
  const apiId = url.searchParams.get("api_id");
  if (!apiId) return apiError("validation_error", "api_id required.", 400);
  const id = apiId.replace(/^evt_/, "");

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event || (key.calendar && event.calendarId !== key.calendar.id)) {
    return apiError("not_found", "Event not found.", 404);
  }
  return ok(serializeEvent(event));
}
