import { apiError, authPublic, ok } from "@/lib/api";

export async function GET(req: Request) {
  const auth = await authPublic(req);
  if (auth instanceof Response) return auth;
  const { key } = auth;
  if (!key.calendar) return apiError("forbidden", "Key has no calendar scope.", 403);
  const c = key.calendar;
  return ok({
    api_id: `cal_${c.id}`,
    name: c.name,
    slug: c.slug,
    description: c.description,
    timezone: c.timezone,
    is_verified: c.isVerified,
  });
}
