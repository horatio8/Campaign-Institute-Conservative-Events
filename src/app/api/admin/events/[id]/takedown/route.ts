import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, logAudit } from "@/lib/admin";
import { enqueueWebhook } from "@/lib/webhooks";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let staff;
  try { staff = await requireAdmin(); }
  catch { return NextResponse.json({ error: { type: "forbidden", message: "Admin only." } }, { status: 403 }); }
  const { id } = await params;
  const event = await prisma.event.update({
    where: { id },
    data: { status: "cancelled" },
  });
  await enqueueWebhook(event.calendarId, "event.cancelled", { id, reason: "admin_takedown" });
  await logAudit({
    staffId: staff.id,
    action: "event.takedown",
    targetType: "event",
    targetId: id,
  });
  return NextResponse.json({ ok: true });
}
