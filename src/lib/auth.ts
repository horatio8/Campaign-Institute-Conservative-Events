import { cookies } from "next/headers";
import { prisma } from "./db";
import { randomToken, sixDigitCode } from "./ids";
import { sendEmail } from "./email";
import { signinCode } from "./emailTemplates";

const SESSION_COOKIE = "luma_session";
const SESSION_TTL_DAYS = 30;

export async function startLogin(email: string) {
  const normalized = email.trim().toLowerCase();
  const user = await prisma.user.upsert({
    where: { email: normalized },
    create: { email: normalized },
    update: {},
  });
  const code = sixDigitCode();
  await prisma.loginCode.create({
    data: {
      userId: user.id,
      code,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    },
  });
  await sendEmail(signinCode({ to: normalized, code }));
  return { userId: user.id };
}

export async function verifyLogin(email: string, code: string) {
  const normalized = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalized } });
  if (!user) throw new Error("No such user");
  const entry = await prisma.loginCode.findFirst({
    where: {
      userId: user.id,
      code,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
  if (!entry) throw new Error("Invalid or expired code");
  await prisma.loginCode.update({
    where: { id: entry.id },
    data: { consumedAt: new Date() },
  });
  const token = randomToken(32);
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  await prisma.session.create({ data: { userId: user.id, token, expiresAt } });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
  return user;
}

export async function signOut() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.updateMany({
      where: { token },
      data: { revokedAt: new Date() },
    });
    jar.delete(SESSION_COOKIE);
  }
}

export async function getSessionUser() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session) return null;
  if (session.revokedAt) return null;
  if (session.expiresAt.getTime() < Date.now()) return null;
  return session.user;
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) throw new Error("Not authenticated");
  return user;
}
