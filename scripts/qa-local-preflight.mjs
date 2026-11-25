// Read-only preflight for the private tailnet local QA route. Never links or
// modifies a database, starts a container, writes credentials, or creates a build.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { configure } = require("../mobile/app.config.js");
const app = require("../mobile/app.json").expo;

export function validateLocalQa(env) {
  const issues = [];
  if (env.APP_VARIANT !== "isolated-replay") issues.push("APP_VARIANT must be isolated-replay");
  if (env.EXPO_PUBLIC_PROGRESS_REPLAY !== "true") issues.push("EXPO_PUBLIC_PROGRESS_REPLAY must be true");
  for (const key of ["EXPO_PUBLIC_SUPABASE_URL", "EXPO_PUBLIC_SITE_URL"]) {
    try {
      const url = new URL(env[key]);
      if (url.protocol !== "https:" || !url.hostname.endsWith(".ts.net") || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
        issues.push(key + " must be an exact HTTPS tailnet origin for this local route");
      }
    } catch { issues.push(key + " is missing or invalid"); }
  }
  if (env.NEXT_PUBLIC_APP_ENV !== "staging") issues.push("NEXT_PUBLIC_APP_ENV must be staging");
  if (env.CONTENT_EDITION !== "working") issues.push("CONTENT_EDITION must be working (private, draft-labelled QA only)");
  if (env.VERCEL_ENV === "production" || env.CI === "true") issues.push("Run local QA preflight on the tester workstation, not production or CI");
  if (env.NEXT_PUBLIC_SUPABASE_URL !== env.EXPO_PUBLIC_SUPABASE_URL) issues.push("Website and native backend origins differ");
  if (env.NEXT_PUBLIC_SITE_URL !== env.EXPO_PUBLIC_SITE_URL) issues.push("Website and native site origins differ");
  if (env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY) issues.push("Website and native public keys differ");
  if (!env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || /^([123]x0{10,})/.test(env.NEXT_PUBLIC_TURNSTILE_SITE_KEY)) issues.push("A separate real QA Turnstile site key is required");
  try { configure(app, env); } catch { issues.push("Isolated Expo configuration rejected the supplied origins or key"); }
  return issues;
}

function checkCommand(cmd, args) {
  const result = spawnSync(cmd, args, { encoding: "utf8", timeout: 15000, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
  return result.status === 0 && !result.error;
}

export function checkLocalWorkspace(root) {
  const issues = [];
  if (!existsSync(resolve(root, "supabase/config.toml"))) issues.push("Run from the nursing repository root");
  if (existsSync(resolve(root, "supabase/.temp/project-ref"))) issues.push("Checkout is linked to a hosted project; use a fresh disposable checkout");
  for (const file of [".env.local", "mobile/.env.local", ".env", "mobile/.env", ".env.development.local", ".env.development", "mobile/.env.development.local", "mobile/.env.development"]) {
    const path = resolve(root, file);
    if (!existsSync(path)) continue;
    const body = readFileSync(path, "utf8");
    if (/https?:\/\/[^\s"'#]*\.supabase\.co\b|https?:\/\/(?:icu-nursing|icu-nursing-preview)\.vercel\.app\b/i.test(body)) issues.push("Hosted or live URL found in " + file + "; use a fresh QA checkout");
  }
  return issues;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const issues = [...checkLocalWorkspace(process.cwd()), ...validateLocalQa(process.env)];
  for (const [cmd, args, label] of [
    ["docker", ["info"], "Docker daemon is unavailable"],
    ["supabase", ["--version"], "Supabase CLI is unavailable"],
    ["tailscale", ["status"], "Tailscale is unavailable or not connected"],
  ]) if (!checkCommand(cmd, args)) issues.push(label);
  if (issues.length) {
    for (const issue of issues) console.error("FAIL: " + issue);
    process.exitCode = 1;
  } else {
    console.log("PASS: local QA preflight configuration and tools");
    console.log("Still verify private-only ACLs, Funnel disabled, proxy path restrictions, local DB/key identity, CAPTCHA, migrations and physical-device tests manually.");
  }
}
