import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin, logAudit } from "@/lib/admin";

const Body = z.object({
  status: z.enum(["open", "reviewing", "actioned", "dismissed"]),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let staff;
  try { staff = await requireAdmin(); }
  catch { return NextResponse.json({ error: { type: "forbidden", message: "Admin only." } }, { status: 403 }); }
  const { id } = await params;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: { type: "validation_error", message: parsed.error.message } }, { status: 400 });
  }
  await prisma.report.update({ where: { id }, data: { status: parsed.data.status } });
  await logAudit({
    staffId: staff.id,
    action: `report.${parsed.data.status}`,
    targetType: "report",
    targetId: id,
  });
  return NextResponse.json({ ok: true });
}
