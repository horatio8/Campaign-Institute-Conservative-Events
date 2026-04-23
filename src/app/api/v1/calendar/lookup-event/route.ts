import { apiError, authPublic, ok } from "@/lib/api";
import { prisma } from "@/lib/db";
import { serializeEvent } from "@/lib/serialize";

export async function GET(req: Request) {
  const auth = await authPublic(req);
  if (auth instanceof Response) return auth;

  const url = new URL(req.url);
  const short = url.searchParams.get("short_code") ?? url.searchParams.get("input");
  if (!short) return apiError("validation_error", "short_code required.", 400);

  const event = await prisma.event.findFirst({
    where: { OR: [{ shortCode: short }, { slug: short }] },
  });
  if (!event) return apiError("not_found", "Event not found.", 404);

  return ok(serializeEvent(event));
}
