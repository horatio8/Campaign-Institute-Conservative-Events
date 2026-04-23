import { apiError, authPublic, ok } from "@/lib/api";
import { prisma } from "@/lib/db";
import { serializeCoupon } from "@/lib/serialize";

export async function GET(req: Request) {
  const auth = await authPublic(req);
  if (auth instanceof Response) return auth;
  const { key } = auth;
  if (!key.calendar) return apiError("forbidden", "Key has no calendar scope.", 403);

  const coupons = await prisma.coupon.findMany({
    where: { calendarId: key.calendar.id },
  });
  return ok({ entries: coupons.map(serializeCoupon) });
}
