import { NextResponse } from "next/server";
import { signOut } from "@/lib/auth";

export async function POST() {
  await signOut();
  return NextResponse.redirect(new URL("/", process.env.APP_URL ?? "http://localhost:3000"));
}
