import { NextResponse } from "next/server";
import { dispatchPending } from "@/lib/webhooks";

// Hit this on a cron (Vercel/EventBridge/cron job) every minute.
// Optionally protect with a shared secret header.
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const provided = req.headers.get("x-cron-secret");
    if (provided !== secret) {
      return NextResponse.json(
        { error: { type: "forbidden", message: "Invalid cron secret." } },
        { status: 403 }
      );
    }
  }
  const result = await dispatchPending();
  return NextResponse.json({ ok: true, ...result });
}

export async function GET(req: Request) {
  return POST(req);
}
