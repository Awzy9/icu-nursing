// The CAPTCHA is solved by Cloudflare Turnstile on a tiny page of OUR website (never a page of the site's content) shown in a restricted WebView.
// The page posts the single-use token back; this module validates what the app is willing to accept.
export const CAPTCHA_PATH = "/mobile-captcha";
export const TURNSTILE_ORIGIN = "https://challenges.cloudflare.com";

export function captchaUrl(siteOrigin: string, locale: "en" | "ar"): string { return `${siteOrigin}/${locale}${CAPTCHA_PATH}`; }

/** Parses a WebView message. The token is only accepted from the site's own origin, with the exact message shape and a plausible token. */
export function parseCaptchaMessage(data: unknown, fromUrl: string, siteOrigin: string): { token: string } | { error: "origin" | "shape" | "token" } {
  let origin = ""; try { origin = new URL(fromUrl).origin; } catch { return { error: "origin" }; }
  if (origin !== siteOrigin) return { error: "origin" };
  let msg: unknown; try { msg = typeof data === "string" ? JSON.parse(data) : data; } catch { return { error: "shape" }; }
  if (!msg || typeof msg !== "object") return { error: "shape" };
  const m = msg as { type?: unknown; v?: unknown; token?: unknown };
  if (m.type !== "icu.turnstile" || m.v !== 1 || typeof m.token !== "string") return { error: "shape" };
  if (!/^[A-Za-z0-9._-]{10,2048}$/.test(m.token)) return { error: "token" };
  return { token: m.token };
}

/** Navigation inside the CAPTCHA WebView is limited to the site's captcha page and Cloudflare's challenge origin. */
export function allowCaptchaNavigation(url: string, siteOrigin: string): boolean {
  if (url === "about:blank") return true;
  try { const u = new URL(url); if (u.origin === TURNSTILE_ORIGIN) return true; return u.origin === siteOrigin && u.pathname.endsWith(CAPTCHA_PATH) && u.protocol !== "javascript:"; } catch { return false; }
}
