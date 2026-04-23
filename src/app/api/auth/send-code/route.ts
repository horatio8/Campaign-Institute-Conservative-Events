import { NextResponse } from "next/server";
import { z } from "zod";
import { startLogin } from "@/lib/auth";
import { rateLimit } from "@/lib/ratelimit";

const Body = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "anon";
  const rl = rateLimit(`send-code:${ip}`, 10, 60_000);
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
      { error: { type: "validation_error", message: "Invalid email." } },
      { status: 400 }
    );
  }
  try {
    await startLogin(parsed.data.email);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: { type: "server_error", message: "Failed to send code." } },
      { status: 500 }
    );
  }
}
