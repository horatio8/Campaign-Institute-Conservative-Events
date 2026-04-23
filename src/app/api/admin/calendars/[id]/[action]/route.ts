import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, logAudit } from "@/lib/admin";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string; action: string }> }
) {
  let staff;
  try { staff = await requireAdmin(); }
  catch { return NextResponse.json({ error: { type: "forbidden", message: "Admin only." } }, { status: 403 }); }
  const { id, action } = await params;

  const data: Partial<{ isVerified: boolean; isSuspended: boolean }> = {};
  switch (action) {
    case "verify": data.isVerified = true; break;
    case "unverify": data.isVerified = false; break;
    case "suspend": data.isSuspended = true; break;
    case "unsuspend": data.isSuspended = false; break;
    default:
      return NextResponse.json({ error: { type: "validation_error", message: "Unknown action." } }, { status: 400 });
  }
  await prisma.calendar.update({ where: { id }, data });
  await logAudit({
    staffId: staff.id,
    action: `calendar.${action}`,
    targetType: "calendar",
    targetId: id,
  });
  return NextResponse.json({ ok: true });
}
