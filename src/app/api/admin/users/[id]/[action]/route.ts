import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, logAudit } from "@/lib/admin";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string; action: string }> }
) {
  let staff;
  try {
    staff = await requireAdmin();
  } catch {
    return NextResponse.json({ error: { type: "forbidden", message: "Admin only." } }, { status: 403 });
  }
  const { id, action } = await params;

  switch (action) {
    case "suspend":
      await prisma.user.update({ where: { id }, data: { suspendedAt: new Date() } });
      await prisma.session.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      break;
    case "unsuspend":
      await prisma.user.update({ where: { id }, data: { suspendedAt: null } });
      break;
    case "signout":
      await prisma.session.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      break;
    default:
      return NextResponse.json({ error: { type: "validation_error", message: "Unknown action." } }, { status: 400 });
  }

  await logAudit({
    staffId: staff.id,
    action: `user.${action}`,
    targetType: "user",
    targetId: id,
  });
  return NextResponse.json({ ok: true });
}
