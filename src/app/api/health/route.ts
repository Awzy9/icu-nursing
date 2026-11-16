import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

export function GET() {
  const env = getEnv();
  return NextResponse.json({ status: "ok", mode: env.demoMode ? "demo" : "supabase", captcha: env.captchaEnabled }, { headers: { "Cache-Control": "no-store" } });
}
