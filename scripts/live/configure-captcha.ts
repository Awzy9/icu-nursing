/**
 * Enables Cloudflare Turnstile CAPTCHA in Supabase Auth for the approved DEV project.
 *
 *   npx tsx scripts/live/configure-captcha.ts --test-keys=pass   # Cloudflare's published TEST secret: every token passes
 *   npx tsx scripts/live/configure-captcha.ts --test-keys=fail   # Cloudflare's published TEST secret: every token fails
 *   TURNSTILE_SECRET=... npx tsx scripts/live/configure-captcha.ts   # your REAL secret (run locally; never commit it)
 *   npx tsx scripts/live/configure-captcha.ts --off
 *
 * The secret is write-only in Supabase and is never needed by the Next.js app (which only holds the public SITE key).
 */
import { api, refuseCaptchaWeakeningOnDev } from "./mgmt";

// Public, documented Cloudflare test secrets (https://developers.cloudflare.com/turnstile/troubleshooting/testing/). Not real secrets.
const TEST_SECRET = { pass: "1x0000000000000000000000000000000AA", fail: "2x0000000000000000000000000000000AA" } as const;

(async () => {
  const arg = process.argv.find((a) => a.startsWith("--test-keys="))?.split("=")[1] as "pass" | "fail" | undefined;
  if (process.argv.includes("--off") || arg) refuseCaptchaWeakeningOnDev();
  if (process.argv.includes("--off")) {
    await api("/config/auth", { method: "PATCH", body: JSON.stringify({ security_captcha_enabled: false }) });
  } else {
    const secret = arg ? TEST_SECRET[arg] : process.env.TURNSTILE_SECRET;
    if (!secret) { console.error("Provide --test-keys=pass|fail or TURNSTILE_SECRET"); process.exit(1); }
    await api("/config/auth", { method: "PATCH", body: JSON.stringify({ security_captcha_enabled: true, security_captcha_provider: "turnstile", security_captcha_secret: secret }) });
  }
  const c = await api<Record<string, unknown>>("/config/auth");
  console.log({ enabled: c.security_captcha_enabled, provider: c.security_captcha_provider, mode: arg ?? (process.argv.includes("--off") ? "off" : "real secret") });
})().catch((e) => { console.error(e.message); process.exit(1); });
