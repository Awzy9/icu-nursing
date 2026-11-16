/**
 * TEST-HARNESS ONLY. Admin (service-level) access to the approved DEV project's Auth API, used to create
 * clearly-marked test accounts and to generate verification/recovery links without an inbox.
 * The secret key is fetched in memory from the Management API at run time: it is never printed, written to disk,
 * committed, or used by the application. Refuses to talk to any project other than the pinned dev project.
 */
import { api, PROJECT_URL } from "./mgmt";

let cached: string | undefined;
async function secretKey(): Promise<string> {
  if (cached) return cached;
  const keys = await api<{ type?: string; api_key: string }[]>("/api-keys?reveal=true");
  const k = keys.find((x) => x.type === "secret");
  if (!k) throw new Error("No secret key available");
  return (cached = k.api_key);
}

export async function adminAuth<T = Record<string, unknown>>(path: string, init: RequestInit = {}): Promise<T> {
  const key = await secretKey();
  const res = await fetch(`${PROJECT_URL}/auth/v1${path}`, { ...init, headers: { "Content-Type": "application/json", apikey: key, Authorization: `Bearer ${key}`, ...(init.headers as Record<string, string>) } });
  const text = await res.text();
  if (!res.ok) throw new Error(`admin ${init.method ?? "GET"} ${path} -> ${res.status}: ${text.slice(0, 300)}`);
  return (text ? JSON.parse(text) : {}) as T;
}

export const createTestUser = (email: string, password: string, displayName: string, confirmed = true) =>
  adminAuth<{ id: string }>("/admin/users", { method: "POST", body: JSON.stringify({ email, password, email_confirm: confirmed, user_metadata: { display_name: displayName } }) });
export const deleteTestUser = (id: string) => adminAuth(`/admin/users/${id}`, { method: "DELETE" });

/** Removes test objects from the topic-images bucket (direct SQL deletes on storage tables are blocked by Supabase). */
export async function adminStorageRemove(paths: string[]) {
  if (!paths.length) return;
  const key = await secretKey();
  await fetch(`${PROJECT_URL}/storage/v1/object/topic-images`, { method: "DELETE", headers: { "Content-Type": "application/json", apikey: key, Authorization: `Bearer ${key}` }, body: JSON.stringify({ prefixes: paths }) });
}
