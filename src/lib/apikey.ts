import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { prisma } from "./db";

export function hashKey(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function generateApiKey(prefix = "lu_sk_live"): { raw: string; hash: string; lastFour: string } {
  const body = randomBytes(24).toString("base64url");
  const raw = `${prefix}_${body}`;
  return { raw, hash: hashKey(raw), lastFour: raw.slice(-4) };
}

export async function authenticateApiKey(header: string | null) {
  if (!header) return null;
  const hash = hashKey(header);
  const key = await prisma.apiKey.findUnique({
    where: { keyHash: hash },
    include: { calendar: true },
  });
  if (!key) return null;
  if (key.revokedAt) return null;
  await prisma.apiKey.update({
    where: { id: key.id },
    data: { lastUsedAt: new Date() },
  });
  return key;
}

export function constantTimeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}
