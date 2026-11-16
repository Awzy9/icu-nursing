/** Builds the Content-Security-Policy for one request. Scripts are allowed only with this request's nonce. */
export function buildCsp({ nonce, supabaseUrl, dev = false, captcha = false }: { nonce: string; supabaseUrl?: string; dev?: boolean; captcha?: boolean }): string {
  let host: string | null = null;
  let plain = false;
  try {
    if (supabaseUrl) {
      const u = new URL(supabaseUrl);
      host = u.host;
      // Plain http/ws is allowed ONLY for a loopback Supabase stack (local development and isolated CI). Anything else is https/wss.
      plain = u.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(u.hostname);
    }
  } catch {
    host = null;
  }
  const api = host ? (plain ? `http://${host} ws://${host}` : `https://${host} wss://${host}`) : "https://*.supabase.co wss://*.supabase.co";
  const img = host ? (plain ? `http://${host}` : `https://${host}`) : "https://*.supabase.co";
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${img}`,
    "font-src 'self' data:",
    `connect-src 'self' ${api}${dev ? " ws://localhost:*" : ""}`,
    // Cloudflare Turnstile renders in an iframe and its script is loaded dynamically by our nonce'd bundle (strict-dynamic).
    ...(captcha ? ["frame-src https://challenges.cloudflare.com"] : []),
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    ...(dev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

export function newNonce(): string {
  return btoa(crypto.randomUUID());
}
