import createIntlMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intl = createIntlMiddleware(routing);
const PROTECTED = ["/dashboard", "/bookmarks", "/admin", "/account", "/mfa"];

export default async function middleware(request: NextRequest) {
  const response = intl(request);
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
    return redirect;
  }
  return response;
}

export const config = { matcher: ["/((?!api|auth|_next|_vercel|.*\\..*).*)"] };
