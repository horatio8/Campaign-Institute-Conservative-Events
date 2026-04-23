import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyLogin } from "@/lib/auth";
import { rateLimit } from "@/lib/ratelimit";

const Body = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "anon";
  const rl = rateLimit(`verify-code:${ip}`, 10, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: { type: "rate_limited", message: "Too many attempts." } },
      { status: 429 }
    );
  }
  const body = await req.json().catch(() => null);
  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { type: "validation_error", message: "Invalid input." } },
      { status: 400 }
    );
  }
  try {
    const user = await verifyLogin(parsed.data.email, parsed.data.code);
    return NextResponse.json({ ok: true, user: { id: user.id, email: user.email } });
  } catch {
    return NextResponse.json(
      { error: { type: "unauthenticated", message: "Invalid or expired code." } },
      { status: 401 }
    );
  }
}
