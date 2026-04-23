import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import type { ApiKey, Calendar } from "@prisma/client";
import { authenticateApiKey } from "./apikey";
import { rateLimit } from "./ratelimit";

export type ApiErrorType =
  | "rate_limited"
  | "unauthenticated"
  | "forbidden"
  | "not_found"
  | "validation_error"
  | "payment_error"
  | "conflict"
  | "server_error";

export function requestId(): string {
  return `req_${randomBytes(8).toString("hex")}`;
}

export function ok(body: unknown, init?: ResponseInit) {
  const rid = requestId();
  return NextResponse.json(body, {
    ...init,
    headers: { ...(init?.headers ?? {}), "x-request-id": rid },
  });
}

export function apiError(
  type: ApiErrorType,
  message: string,
  status: number,
  extra?: Record<string, unknown>
) {
  const rid = requestId();
  return NextResponse.json(
    {
      error: { type, message, ...extra },
      request_id: rid,
    },
    { status, headers: { "x-request-id": rid } }
  );
}

export type AuthedKey = ApiKey & { calendar: Calendar | null };
export type AuthedRequest = { key: AuthedKey };

export async function authPublic(req: Request): Promise<AuthedRequest | NextResponse> {
  const header = req.headers.get("x-luma-api-key");
  const key = await authenticateApiKey(header);
  if (!key) return apiError("unauthenticated", "Invalid or missing API key.", 401);

  const limit = key.scope === "org" ? 500 : 200;
  const rl = rateLimit(`apikey:${key.id}`, limit);
  if (!rl.ok) {
    return apiError("rate_limited", "Rate limit exceeded.", 429, { retry_after: rl.retryAfter });
  }
  return { key: key as AuthedKey };
}
