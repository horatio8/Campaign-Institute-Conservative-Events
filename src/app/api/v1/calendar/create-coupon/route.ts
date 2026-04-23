import { z } from "zod";
import { apiError, authPublic, ok } from "@/lib/api";
import { prisma } from "@/lib/db";
import { serializeCoupon } from "@/lib/serialize";

const Body = z.object({
  code: z.string().min(2),
  kind: z.enum(["fixed", "percent"]),
  amount: z.number().int().nonnegative(),
  quantity: z.number().int().positive().optional(),
  starts_at: z.string().optional(),
  ends_at: z.string().optional(),
  event_api_id: z.string().optional(),
});

export async function POST(req: Request) {
  const auth = await authPublic(req);
  if (auth instanceof Response) return auth;
  const { key } = auth;
  if (!key.calendar) return apiError("forbidden", "Key has no calendar scope.", 403);

  const body = await req.json().catch(() => null);
  const parsed = Body.safeParse(body);
  if (!parsed.success) return apiError("validation_error", parsed.error.message, 400);

  const coupon = await prisma.coupon.create({
    data: {
      calendarId: key.calendar.id,
      eventId: parsed.data.event_api_id ? parsed.data.event_api_id.replace(/^evt_/, "") : null,
      code: parsed.data.code,
      kind: parsed.data.kind,
      amount: parsed.data.amount,
      quantity: parsed.data.quantity,
      startsAt: parsed.data.starts_at ? new Date(parsed.data.starts_at) : null,
      endsAt: parsed.data.ends_at ? new Date(parsed.data.ends_at) : null,
    },
  });
  return ok(serializeCoupon(coupon));
}
