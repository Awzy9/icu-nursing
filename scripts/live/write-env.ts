/** Writes .env.local (gitignored) for the approved dev project using its PUBLISHABLE key. Never writes secret keys. */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { PROJECT_URL, publishableKey } from "./mgmt";

(async () => {
  const key = await publishableKey();
  if (!key.startsWith("sb_publishable_")) throw new Error("Expected a publishable key");
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? (existsSync(".env.local") ? /^NEXT_PUBLIC_TURNSTILE_SITE_KEY=(.+)$/m.exec(readFileSync(".env.local", "utf8"))?.[1] : undefined) ?? "1x00000000000000000000AA"; // keeps the real public site key if one is already set
  writeFileSync(".env.local", `NEXT_PUBLIC_SITE_URL=http://localhost:3000\nNEXT_PUBLIC_SUPABASE_URL=${PROJECT_URL}\nNEXT_PUBLIC_SUPABASE_ANON_KEY=${key}\n# Cloudflare Turnstile TEST site key (public, always passes). Replace with your real site key for staging.\nNEXT_PUBLIC_TURNSTILE_SITE_KEY=${siteKey}\n`, { mode: 0o600 });
  console.log(".env.local written (URL + publishable key + Turnstile TEST site key)");
})().catch((e) => { console.error(e.message); process.exit(1); });
