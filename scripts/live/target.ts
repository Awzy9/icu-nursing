/**
 * Target selection for the live test suites.
 *   LIVE_TARGET unset      -> the approved hosted DEV project (pinned in mgmt.ts). Test CAPTCHA keys are NEVER allowed here.
 *   LIVE_TARGET=isolated   -> the local Supabase stack of an isolated CI job (docker, `supabase start`).
 * Every operation that uses Cloudflare TEST keys goes through requireIsolated(); the only targets accepted are the explicit
 * loopback allow-list in isolated-targets.json. Nothing here can reach, read or change the real Turnstile secret.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

interface Allow { api: string[]; db: string[]; captchaTestSecrets: string[] }
const allow: Allow = JSON.parse(readFileSync(path.resolve(__dirname, "isolated-targets.json"), "utf8"));

/** The approved hosted DEVELOPMENT project (holds the real Turnstile secret). It can never be an isolated target. */
export const DEV_REF = "dvmevjomyaqrojsiffnf";

export const ISOLATED = process.env.LIVE_TARGET === "isolated";

const origin = (u: string) => { try { return new URL(u).origin; } catch { return ""; } };

/** Throws unless `u` is an allow-listed loopback API URL and not a hosted Supabase host. */
export function assertIsolatedApi(u: string | undefined): string {
  const o = origin(u ?? "");
  const host = o ? new URL(o).hostname : "";
  if (!o || !allow.api.includes(o) || !["127.0.0.1", "localhost", "[::1]"].includes(host) || /supabase\.(co|com|in)$/i.test(host)) {
    throw new Error(`Refusing: "${u ?? ""}" is not an allow-listed isolated target (scripts/live/isolated-targets.json). Test-key operations may only run against the local CI stack.`);
  }
  return o;
}
export function assertIsolatedDb(u: string | undefined): string {
  if (!u || !allow.db.includes(u)) throw new Error("Refusing: database URL is not on the isolated allow-list.");
  return u;
}
/** Guard for any operation that applies Cloudflare TEST keys or sends the dummy CAPTCHA token. */
export function requireIsolated(what: string): void {
  if (!ISOLATED) throw new Error(`Refusing to ${what}: Cloudflare test keys are allowed only with LIVE_TARGET=isolated against the local CI stack, never against a hosted project.`);
  assertIsolatedApi(process.env.LIVE_SUPABASE_URL);
}
export function assertTestCaptchaSecret(secret: string): void {
  if (!allow.captchaTestSecrets.includes(secret)) throw new Error("Refusing: only Cloudflare's public TEST secrets may be set on the isolated stack.");
}

export const isolatedEnv = () => ({
  url: assertIsolatedApi(process.env.LIVE_SUPABASE_URL),
  anonKey: process.env.LIVE_ANON_KEY ?? "",
  serviceKey: process.env.LIVE_SERVICE_ROLE_KEY ?? "",
  dbUrl: assertIsolatedDb(process.env.LIVE_DB_URL),
});
