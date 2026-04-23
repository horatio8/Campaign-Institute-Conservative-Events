import { apiError, authPublic, ok } from "@/lib/api";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const auth = await authPublic(req);
  if (auth instanceof Response) return auth;
  const { key } = auth;
  if (!key.calendar) return apiError("forbidden", "Key has no calendar scope.", 403);

  const members = await prisma.calendarMember.findMany({
    where: { calendarId: key.calendar.id },
    include: { user: true },
  });
  return ok({
    entries: members.map((m) => ({
      api_id: `member_${m.id}`,
      role: m.role,
      user: { api_id: `usr_${m.user.id}`, email: m.user.email, name: m.user.name },
    })),
  });
}
