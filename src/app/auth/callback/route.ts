import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/utils";

/** Handles email-confirmation, magic-link and password-recovery redirects (PKCE code or token hash). */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const next = safeRedirectPath(searchParams.get("next"), "/en/dashboard");
  const supabase = await createClient();
  if (!supabase) return NextResponse.redirect(new URL("/en/login", origin));

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  let ok = false;
  if (code) ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  else if (tokenHash && type) ok = !(await supabase.auth.verifyOtp({ token_hash: tokenHash, type })).error;

  const target = ok ? next : `/${next.split("/")[1] === "ar" ? "ar" : "en"}/login`;
  return NextResponse.redirect(new URL(target, origin));
}
