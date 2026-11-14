/** Builds the Content-Security-Policy for one request. Scripts are allowed only with this request's nonce. */
export function buildCsp({ nonce, supabaseUrl, dev = false }: { nonce: string; supabaseUrl?: string; dev?: boolean }): string {
  let host: string | null = null;
  try {
    if (supabaseUrl) host = new URL(supabaseUrl).host;
  } catch {
    host = null;
  }
  const api = host ? `https://${host} wss://${host}` : "https://*.supabase.co wss://*.supabase.co";
  const img = host ? `https://${host}` : "https://*.supabase.co";
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${img}`,
    "font-src 'self' data:",
    `connect-src 'self' ${api}${dev ? " ws://localhost:*" : ""}`,
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
