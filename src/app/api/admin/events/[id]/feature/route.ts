import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin, logAudit } from "@/lib/admin";

const Body = z.object({
  featured: z.boolean(),
  days: z.number().int().positive().max(90).optional(),
});

export async function POST(
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
  const featuredUntil = parsed.data.featured
    ? new Date(Date.now() + (parsed.data.days ?? 14) * 86400_000)
    : null;

  await prisma.event.update({ where: { id }, data: { featuredUntil } });
  await logAudit({
    staffId: staff.id,
    action: parsed.data.featured ? "event.feature" : "event.unfeature",
    targetType: "event",
    targetId: id,
    payload: { until: featuredUntil?.toISOString() ?? null },
  });
  return NextResponse.json({ ok: true });
}
