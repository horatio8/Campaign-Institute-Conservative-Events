import { apiError, authPublic, ok } from "@/lib/api";
import { prisma } from "@/lib/db";
import { serializeEvent } from "@/lib/serialize";

// Accepts a URL or short code; returns the resolved entity.
export async function GET(req: Request) {
  const auth = await authPublic(req);
  if (auth instanceof Response) return auth;

  const url = new URL(req.url);
  const input = url.searchParams.get("input");
  if (!input) return apiError("validation_error", "input required.", 400);

  const trimmed = input.replace(/^https?:\/\/[^/]+/i, "").replace(/^\//, "");
  const parts = trimmed.split("/");
  const last = parts[parts.length - 1];

  const eventBySlug = await prisma.event.findUnique({ where: { slug: last } });
  if (eventBySlug) return ok({ type: "event", data: serializeEvent(eventBySlug) });
  const eventByCode = await prisma.event.findUnique({ where: { shortCode: last } });
  if (eventByCode) return ok({ type: "event", data: serializeEvent(eventByCode) });

  const calSlug = last.startsWith("@") ? last.slice(1) : last;
  const calendar = await prisma.calendar.findUnique({ where: { slug: calSlug } });
  if (calendar) {
    return ok({
      type: "calendar",
      data: {
        api_id: `cal_${calendar.id}`,
        name: calendar.name,
        slug: calendar.slug,
      },
    });
  }

  return apiError("not_found", "Nothing resolves that input.", 404);
}
