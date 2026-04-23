import { apiError, authPublic, ok } from "@/lib/api";
import { prisma } from "@/lib/db";
import { serializeCoupon } from "@/lib/serialize";

export async function GET(req: Request) {
  const auth = await authPublic(req);
  if (auth instanceof Response) return auth;

  const url = new URL(req.url);
  const eventApi = url.searchParams.get("event_api_id");
  if (!eventApi) return apiError("validation_error", "event_api_id required.", 400);
  const eventId = eventApi.replace(/^evt_/, "");
  const coupons = await prisma.coupon.findMany({ where: { eventId } });
  return ok({ entries: coupons.map(serializeCoupon) });
}
