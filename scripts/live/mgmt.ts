/**
 * Minimal Supabase Management API client for the approved DEVELOPMENT project only.
 * The access token is never read here: in the sandbox an HTTPS proxy injects it; on a developer machine set
 * SUPABASE_ACCESS_TOKEN. The project ref is pinned so this tooling cannot touch any other project.
 */
import { ISOLATED, assertIsolatedDb, isolatedEnv } from "./target";
export const REF = ISOLATED ? "isolated-local" : "dvmevjomyaqrojsiffnf";
/** The approved development project holds the owner's REAL Cloudflare Turnstile secret. */
export const DEV_REF = "dvmevjomyaqrojsiffnf";

/**
 * Guard for anything that would replace or disable the project's CAPTCHA secret with a Cloudflare TEST key or switch CAPTCHA off.
 * Such changes must never run against the approved dev project (real authentication controls). Use an isolated test project
 * (see docs/ISOLATED_LIVE_TESTING.md). Setting the REAL secret via TURNSTILE_SECRET is not guarded.
 */
export function refuseCaptchaWeakeningOnDev(ref: string = REF): void {
  if (ref === DEV_REF || (ref === REF && !ISOLATED)) {
    throw new Error("Refusing: this would replace the real Turnstile secret with a test key (or disable CAPTCHA) on icu-nursing-dev. Run CAPTCHA-dependent live suites only against an isolated test project; see docs/ISOLATED_LIVE_TESTING.md.");
  }
}
export const PROJECT_URL = ISOLATED ? isolatedEnv().url : `https://${REF}.supabase.co`;
const API = "https://api.supabase.com/v1";

function headers(): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (process.env.SUPABASE_ACCESS_TOKEN) h.Authorization = `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`;
  return h;
}

export async function sql<T = Record<string, unknown>>(query: string): Promise<T[]> {
  if (ISOLATED) return isolatedSql<T>(query);
  const res = await fetch(`${API}/projects/${REF}/database/query`, { method: "POST", headers: headers(), body: JSON.stringify({ query }) });
  const text = await res.text();
  if (!res.ok) throw new Error(`SQL failed (${res.status}): ${text.slice(0, 600)}`);
  return JSON.parse(text) as T[];
}

export async function api<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  if (ISOLATED) return isolatedApi<T>(path, init);
  const res = await fetch(`${API}/projects/${REF}${path}`, { ...init, headers: { ...headers(), ...(init.headers as Record<string, string>) } });
  const text = await res.text();
  if (!res.ok) throw new Error(`${init.method ?? "GET"} ${path} failed (${res.status}): ${text.slice(0, 600)}`);
  return (text ? JSON.parse(text) : null) as T;
}

/** Returns the publishable key only (never the secret / service-role keys). */
export async function publishableKey(): Promise<string> {
  const keys = await api<{ name: string; type?: string; api_key: string }[]>("/api-keys?reveal=false");
  const k = keys.find((x) => x.type === "publishable") ?? keys.find((x) => x.name === "anon");
  if (!k) throw new Error("No publishable/anon key found");
  return k.api_key;
}

// ---- isolated CI target (local Supabase stack) ---------------------------------------------------------------------------------
async function isolatedSql<T>(query: string): Promise<T[]> {
  const { Client } = await import("pg");
  const c = new Client({ connectionString: assertIsolatedDb(isolatedEnv().dbUrl) });
  await c.connect();
  try {
    const r = (await c.query(query)) as unknown as { rows: T[] } | { rows: T[] }[];
    return (Array.isArray(r) ? r.filter((x) => x.rows.length).at(-1)?.rows ?? [] : r.rows) as T[];
  } finally { await c.end(); }
}

/** Minimal stand-in for the Management API calls the live suites use, backed by the local stack. */
async function isolatedApi<T>(path: string, init: RequestInit): Promise<T> {
  const env = isolatedEnv();
  if (path.startsWith("/api-keys")) {
    return [{ name: "anon", type: "publishable", api_key: env.anonKey }, { name: "service_role", type: "secret", api_key: env.serviceKey }] as T;
  }
  if (path === "/config/auth") {
    if ((init.method ?? "GET") === "GET") return { security_captcha_enabled: true, security_captcha_provider: "turnstile" } as T;
    const body = JSON.parse(String(init.body ?? "{}")) as { security_captcha_secret?: string };
    if (body.security_captcha_secret) {
      const { setLocalCaptchaSecret } = await import("./isolated-auth");
      await setLocalCaptchaSecret(body.security_captcha_secret);
    }
    return {} as T;
  }
  throw new Error(`isolated target: unsupported management call ${path}`);
}
