/**
 * Minimal Supabase Management API client for the approved DEVELOPMENT project only.
 * The access token is never read here: in the sandbox an HTTPS proxy injects it; on a developer machine set
 * SUPABASE_ACCESS_TOKEN. The project ref is pinned so this tooling cannot touch any other project.
 */
export const REF = "dvmevjomyaqrojsiffnf";
export const PROJECT_URL = `https://${REF}.supabase.co`;
const API = "https://api.supabase.com/v1";

function headers(): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (process.env.SUPABASE_ACCESS_TOKEN) h.Authorization = `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`;
  return h;
}

export async function sql<T = Record<string, unknown>>(query: string): Promise<T[]> {
  const res = await fetch(`${API}/projects/${REF}/database/query`, { method: "POST", headers: headers(), body: JSON.stringify({ query }) });
  const text = await res.text();
  if (!res.ok) throw new Error(`SQL failed (${res.status}): ${text.slice(0, 600)}`);
  return JSON.parse(text) as T[];
}

export async function api<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
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
