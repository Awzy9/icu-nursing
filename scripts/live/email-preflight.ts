/** Read-only readiness check for real-email testing on the approved DEV project. Prints what is missing. */
import { api } from "./mgmt";

(async () => {
  const c = await api<Record<string, unknown>>("/config/auth");
  const rows: [string, boolean, string][] = [
    ["Custom SMTP host configured", Boolean(c.smtp_host), String(c.smtp_host ?? "not set (built-in sender: 2 emails/hour, team members only)")],
    ["Sender address configured", Boolean(c.smtp_admin_email), String(c.smtp_admin_email ?? "not set")],
    ["Email rate limit raised above the built-in 2/hour", Number(c.rate_limit_email_sent) > 2, `rate_limit_email_sent=${c.rate_limit_email_sent}`],
    ["Email confirmation required", c.mailer_autoconfirm === false, `mailer_autoconfirm=${c.mailer_autoconfirm}`],
    ["Site URL set", Boolean(c.site_url), String(c.site_url)],
    ["Callback URL(s) allow-listed", /\/auth\/callback/.test(String(c.uri_allow_list ?? "")), String(c.uri_allow_list)],
    ["CAPTCHA enabled (tests must send a token)", c.security_captcha_enabled === true, `provider=${c.security_captcha_provider}`],
    ["Branded confirmation template", /ICU Nurse Knowledge Map/.test(String(c.mailer_templates_confirmation_content ?? "")), "run configure-smtp.ts --templates"],
  ];
  for (const [name, ok, detail] of rows) console.log(`${ok ? "READY  " : "MISSING"}  ${name}  (${detail})`);
  try {
    const r = await fetch("https://api.resend.com/domains");
    console.log(`${r.status === 200 ? "READY  " : "MISSING"}  Resend API readable by the test harness  (HTTP ${r.status}${r.status === 401 ? ": no Resend API credential saved yet" : ""})`);
  } catch (e) { console.log(`MISSING  Resend API unreachable: ${(e as Error).message}`); }
  const missing = rows.filter((r) => !r[1]).length;
  console.log(missing ? `\n${missing} item(s) still need the owner. See docs/EMAIL_TESTING.md` : "\nReady: run LIVE_EMAIL=1 npm run test:e2e:live");
})().catch((e) => { console.error(e.message); process.exit(1); });
