import { apiError, authPublic, ok } from "@/lib/api";
import { prisma } from "@/lib/db";
import { serializeGuest } from "@/lib/serialize";

export async function GET(req: Request) {
  const auth = await authPublic(req);
  if (auth instanceof Response) return auth;

  const url = new URL(req.url);
  const apiId = url.searchParams.get("api_id");
  if (!apiId) return apiError("validation_error", "api_id required.", 400);
  const id = apiId.replace(/^guest_/, "");

  const guest = await prisma.guest.findUnique({ where: { id } });
  if (!guest) return apiError("not_found", "Guest not found.", 404);
  return ok(serializeGuest(guest));
}
