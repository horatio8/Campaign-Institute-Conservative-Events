import { apiError, authPublic, ok } from "@/lib/api";
import { prisma } from "@/lib/db";
import { serializeTicketType } from "@/lib/serialize";

export async function GET(req: Request) {
  const auth = await authPublic(req);
  if (auth instanceof Response) return auth;

  const url = new URL(req.url);
  const eventApi = url.searchParams.get("event_api_id");
  if (!eventApi) return apiError("validation_error", "event_api_id required.", 400);
  const eventId = eventApi.replace(/^evt_/, "");
  const types = await prisma.ticketType.findMany({ where: { eventId } });
  return ok({ entries: types.map(serializeTicketType) });
}
