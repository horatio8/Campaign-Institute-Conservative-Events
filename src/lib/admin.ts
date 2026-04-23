import { prisma } from "./db";
import { getSessionUser } from "./auth";

export async function requireAdmin() {
  const user = await getSessionUser();
  if (!user) throw new Error("unauthenticated");
  const allowlist = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!allowlist.includes(user.email)) {
    throw new Error("forbidden");
  }
  return user;
}

export async function isAdmin(): Promise<boolean> {
  try {
    await requireAdmin();
    return true;
  } catch {
    return false;
  }
}

export async function logAudit(params: {
  staffId: string | null;
  action: string;
  targetType: string;
  targetId: string;
  payload?: unknown;
}) {
  await prisma.auditLog.create({
    data: {
      staffId: params.staffId,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      payload: params.payload ? JSON.stringify(params.payload) : null,
    },
  });
}
