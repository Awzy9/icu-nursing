import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { PROJECT_URL, REF, sql } from "../../scripts/live/mgmt";
import { adminAuth, createTestUser, deleteTestUser } from "../../scripts/live/admin";

import { api } from "../../scripts/live/mgmt";
export { sql, adminAuth, api, PROJECT_URL, REF };

function loadEnv() {
  const env: Record<string, string> = {};
  for (const line of readFileSync(path.resolve(__dirname, "../../.env.local"), "utf8").split("\n")) {
    const m = /^([A-Z_]+)=(.*)$/.exec(line.trim());
    if (m) env[m[1]!] = m[2]!;
  }
  return env;
}
const env = loadEnv();
if (env.NEXT_PUBLIC_SUPABASE_URL !== PROJECT_URL) throw new Error("Refusing to run: .env.local does not point at the approved dev project");
const KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const RUN = Date.now().toString(36);
export const PASSWORD = "correct-horse-battery-LIVE-1";
export const emailFor = (label: string) => `live-test-${RUN}-${label}@example.org`;

/** Cloudflare's TEST token (accepted by the TEST "always pass" secret). Supabase ignores it when CAPTCHA is disabled. */
export const DUMMY_CAPTCHA = "XXXX.DUMMY.TOKEN.XXXX";

/** A client with no CAPTCHA token at all (to prove the server insists on one). */
export function rawClient(): SupabaseClient {
  return createClient(PROJECT_URL, KEY, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });
}

export function newClient(storage?: Record<string, string>): SupabaseClient {
  const memory: Record<string, string> = storage ?? {};
  const c = createClient(PROJECT_URL, KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: true,
      detectSessionInUrl: false,
      storage: { getItem: (k) => memory[k] ?? null, setItem: (k, v) => { memory[k] = v; }, removeItem: (k) => { delete memory[k]; } },
    },
  });
  // The dev project has Turnstile enabled with Cloudflare's TEST secret: pass its test token on the CAPTCHA-protected calls.
  const a = c.auth as unknown as Record<string, (...x: unknown[]) => unknown>;
  const signIn = a.signInWithPassword!.bind(c.auth), signUp = a.signUp!.bind(c.auth), reset = a.resetPasswordForEmail!.bind(c.auth);
  a.signInWithPassword = (cred) => signIn({ ...(cred as object), options: { captchaToken: DUMMY_CAPTCHA, ...((cred as { options?: object }).options ?? {}) } });
  a.signUp = (cred) => signUp({ ...(cred as object), options: { captchaToken: DUMMY_CAPTCHA, ...((cred as { options?: object }).options ?? {}) } });
  a.resetPasswordForEmail = (email, opts) => reset(email, { captchaToken: DUMMY_CAPTCHA, ...((opts as object) ?? {}) });
  return c;
}

// ---- TOTP (RFC 6238, SHA-1, 6 digits, 30 s) ----
function base32(s: string) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const c of s.replace(/=+$/, "").toUpperCase()) bits += alphabet.indexOf(c).toString(2).padStart(5, "0");
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}
export function totp(secret: string, atMs = Date.now()) {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(atMs / 1000 / 30)));
  const h = createHmac("sha1", base32(secret)).update(counter).digest();
  const o = h[19]! & 0xf;
  const n = ((h[o]! & 0x7f) << 24) | (h[o + 1]! << 16) | (h[o + 2]! << 8) | h[o + 3]!;
  return String(n % 1_000_000).padStart(6, "0");
}
export const aalOf = async (c: SupabaseClient) => {
  const { data } = await c.auth.getSession();
  const payload = JSON.parse(Buffer.from(data.session!.access_token.split(".")[1]!, "base64url").toString());
  return { aal: payload.aal as string, sub: payload.sub as string };
};

/** Stored TOTP secrets per user so re-logins can challenge the same factor (like an authenticator app would). */
const secrets = new Map<string, string>();

export async function signIn(email: string, password = PASSWORD) {
  const c = newClient();
  const { error } = await c.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`sign-in failed for ${email}: ${error.message}`);
  return c;
}

/** Completes TOTP: enrols on first use, challenges the existing factor afterwards. Returns the client at aal2. */
export async function withMfa(c: SupabaseClient, email: string) {
  const { data: f } = await c.auth.mfa.listFactors();
  let factorId = f?.totp?.find((x) => x.status === "verified")?.id;
  if (!factorId) {
    const { data, error } = await c.auth.mfa.enroll({ factorType: "totp", friendlyName: "live-test" });
    if (error || !data) throw new Error(`enroll failed: ${error?.message}`);
    secrets.set(email, data.totp.secret);
    factorId = data.id;
  }
  const secret = secrets.get(email)!;
  let last = "";
  for (const offset of [0, -30_000, 30_000]) {
    const { error } = await c.auth.mfa.challengeAndVerify({ factorId, code: totp(secret, Date.now() + offset) });
    if (!error) return c;
    last = error.message;
  }
  throw new Error(`MFA verify failed: ${last}`);
}

export interface Actor { email: string; id: string; c: SupabaseClient }
export async function makeUser(label: string, name: string, opts: { confirmed?: boolean } = {}) {
  const email = emailFor(label);
  const u = await createTestUser(email, PASSWORD, `LIVE TEST ${name} (test account, not a real clinician)`, opts.confirmed ?? true);
  return { email, id: u.id };
}
export async function actor(email: string, id: string, mfa = false): Promise<Actor> {
  const c = await signIn(email);
  if (mfa) await withMfa(c, email);
  return { email, id, c };
}

export const png = () => Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, ...Array(64).fill(0)]);

export async function cleanup(userIds: string[]) {
  // Reviews are immutable by design (they also block cascading deletes). For DEV test data only, lift that trigger for the
  // duration of one transaction, remove the test content, and restore it.
  await sql(`begin;
    alter table public.content_reviews disable trigger content_reviews_no_change;
    delete from public.topics where slug like 'live-%' or slug like 'ui-live-%';
    delete from public.sources where title like 'LIVE TEST %';
    alter table public.content_reviews enable trigger content_reviews_no_change;
    commit;`);
  for (const id of userIds) await deleteTestUser(id).catch(() => undefined);
}
export { deleteTestUser };
