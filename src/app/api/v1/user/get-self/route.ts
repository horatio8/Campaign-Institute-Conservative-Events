import { apiError, authPublic, ok } from "@/lib/api";

export async function GET(req: Request) {
  const auth = await authPublic(req);
  if (auth instanceof Response) return auth;
  const { key } = auth;
  if (!key.calendar) return apiError("forbidden", "Key has no calendar scope.", 403);
  return ok({
    api_id: `api_${key.id}`,
    scope: key.scope,
    calendar: {
      api_id: `cal_${key.calendar.id}`,
      name: key.calendar.name,
      slug: key.calendar.slug,
    },
  });
}
