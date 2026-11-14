/**
 * Real-email tests with Supabase's BUILT-IN sender (no custom SMTP, no domain) on the DEV project.
 * Limits: the built-in sender delivers only to members of the Supabase organisation and allows ~2 emails/hour per project.
 * Email confirmation stays ON. Usage:
 *   EMAIL_TEST_ADDRESS=<authorised org address> tsx scripts/live/email-builtin.ts signup|reset|status
 * The address is read from the environment only (never committed). A local, git-ignored ledger stops us exceeding the hourly cap.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { api, PROJECT_URL, publishableKey } from "./mgmt";
import { adminAuth } from "./admin";

const LEDGER = ".email-ledger.json";
const CAP = 2;
const DUMMY_CAPTCHA = "XXXX.DUMMY.TOKEN.XXXX"; // Cloudflare TEST token, accepted only while the dev project uses the TEST secret

const ledger = (): number[] => (existsSync(LEDGER) ? (JSON.parse(readFileSync(LEDGER, "utf8")) as number[]) : []).filter((t) => Date.now() - t < 3_600_000);
const record = () => writeFileSync(LEDGER, JSON.stringify([...ledger(), Date.now()]));

async function post(path: string, key: string, body: unknown) {
  const r = await fetch(`${PROJECT_URL}/auth/v1${path}`, { method: "POST", headers: { apikey: key, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return { status: r.status, body: (await r.text()).slice(0, 300) };
}

(async () => {
  const mode = process.argv[2];
  const email = process.env.EMAIL_TEST_ADDRESS;
  const cfg = await api<Record<string, unknown>>("/config/auth");
  if (cfg.mailer_autoconfirm !== false) throw new Error("Email confirmation must stay enabled (mailer_autoconfirm is not false). Refusing.");
  if (mode === "status") {
    console.log(`confirmation required: yes · custom SMTP: ${cfg.smtp_host ? "yes" : "no (built-in sender)"} · sent in the last hour (this machine): ${ledger().length}/${CAP}`);
    return;
  }
  if (!email) throw new Error("Set EMAIL_TEST_ADDRESS to an address authorised on the Supabase organisation.");
  if (ledger().length >= CAP) throw new Error(`Built-in limit reached (${CAP}/hour). Wait for the hour to pass.`);
  const key = await publishableKey();
  if (mode === "signup") {
    const pw = `Tmp-${Math.random().toString(36).slice(2)}-Aa1!x`;
    const res = await post("/signup", key, { email, password: pw, data: { display_name: "Email test" }, gotrue_meta_security: { captcha_token: DUMMY_CAPTCHA } });
    console.log("signup:", res.status, res.body.includes("email") ? "(user object returned; confirmation email requested)" : res.body);
    if (res.status < 300) record();
    console.log("Now check the inbox and click the confirmation link, then run: tsx scripts/live/email-builtin.ts verify");
  } else if (mode === "reset") {
    const res = await post("/recover", key, { email, gotrue_meta_security: { captcha_token: DUMMY_CAPTCHA } });
    console.log("recover:", res.status, res.body);
    if (res.status < 300) record();
    console.log("Check the inbox: a password-reset email should arrive.");
  } else if (mode === "verify") {
    const list = await adminAuth<{ users: { email: string; email_confirmed_at: string | null }[] }>(`/admin/users?per_page=200`);
    const u = list.users.find((x) => x.email?.toLowerCase() === email.toLowerCase());
    console.log(u ? `user exists; email_confirmed_at = ${u.email_confirmed_at ?? "NOT confirmed"}` : "no such user");
  } else throw new Error("mode: signup | reset | verify | status");
})().catch((e) => { console.error(e.message); process.exit(1); });
