import createIntlMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import { buildCsp, newNonce } from "./lib/csp";

const intl = createIntlMiddleware(routing);
const PROTECTED = ["/dashboard", "/bookmarks", "/question-bank", "/study", "/cases", "/learn", "/admin", "/account", "/mfa"];

export default async function middleware(original: NextRequest) {
  // Per-request CSP nonce: forwarded to Next.js (which stamps its own scripts) and set on the response.
  const nonce = newNonce();
  const csp = buildCsp({ nonce, supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL, dev: process.env.NODE_ENV !== "production", captcha: Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL) });
  const forwarded = new Headers(original.headers);
  forwarded.set("x-nonce", nonce);
  forwarded.set("content-security-policy", csp);
  const request = new NextRequest(original, { headers: forwarded });
  const response = intl(request);
  response.headers.set("Content-Security-Policy", csp);
  if (process.env.NEXT_PUBLIC_APP_ENV !== "production") response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response; // demo mode: no sessions

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => list.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
    },
  });
  // Refreshes the session cookie; validates the JWT with the auth server.
  const { data } = await supabase.auth.getUser();

  const match = request.nextUrl.pathname.match(/^\/(en|ar)(\/.*)?$/);
  const locale = match?.[1] ?? routing.defaultLocale;
  const path = match?.[2] ?? "/";
  if (!data.user && PROTECTED.some((p) => path === p || path.startsWith(`${p}/`))) {
    const login = new URL(`/${locale}/login`, request.url);
    login.searchParams.set("next", path + request.nextUrl.search);
    const redirect = NextResponse.redirect(login);
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    redirect.headers.set("Content-Security-Policy", csp);
    return redirect;
  }
  return response;
}

export const config = { matcher: ["/((?!api|auth|_next|_vercel|.*\\..*).*)"] };
