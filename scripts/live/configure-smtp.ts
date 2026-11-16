/**
 * Configures custom SMTP (and optional branded templates) on the approved DEV project. RUN THIS LOCALLY with your own
 * Supabase access token; the SMTP password is a secret and is never committed or sent to chat.
 *
 *   SUPABASE_ACCESS_TOKEN=sbp_... SMTP_PASS=re_... SMTP_ADMIN_EMAIL=onboarding@resend.dev \
 *     npx tsx scripts/live/configure-smtp.ts [--templates]
 *
 * Defaults target Resend (smtp.resend.com:465, user "resend"). Any SMTP provider works: override SMTP_HOST/PORT/USER.
 */
import { api } from "./mgmt";

const env = (k: string, d?: string) => process.env[k] ?? d;
const pass = env("SMTP_PASS");
const sender = env("SMTP_ADMIN_EMAIL");
if (!pass || !sender) { console.error("Set SMTP_PASS and SMTP_ADMIN_EMAIL (and SUPABASE_ACCESS_TOKEN when running locally)."); process.exit(1); }

const wrap = (title: string, body: string, link: string, cta: string) => `<h2>${title}</h2>
<p>${body}</p>
<p><a href="${link}">${cta}</a></p>
<p style="color:#555;font-size:13px">If you did not request this email you can ignore it; nothing will change. ICU Nurse Knowledge Map is an educational platform and never asks for patient information.</p>`;

const templates = process.argv.includes("--templates") ? {
  mailer_subjects_confirmation: "Confirm your ICU Nurse Knowledge Map account",
  mailer_templates_confirmation_content: wrap("Confirm your email address", "Thank you for registering with ICU Nurse Knowledge Map. Confirm your email address to activate your account.", "{{ .ConfirmationURL }}", "Confirm my email"),
  mailer_subjects_recovery: "Reset your ICU Nurse Knowledge Map password",
  mailer_templates_recovery_content: wrap("Reset your password", "We received a request to reset your password. This link works once and expires shortly.", "{{ .ConfirmationURL }}", "Choose a new password"),
} : {};

(async () => {
  await api("/config/auth", {
    method: "PATCH",
    body: JSON.stringify({
      smtp_host: env("SMTP_HOST", "smtp.resend.com"), smtp_port: env("SMTP_PORT", "465"), smtp_user: env("SMTP_USER", "resend"), smtp_pass: pass,
      smtp_admin_email: sender, smtp_sender_name: env("SMTP_SENDER_NAME", "ICU Nurse Knowledge Map"),
      rate_limit_email_sent: Number(env("RATE_LIMIT_EMAIL", "30")), ...templates,
    }),
  });
  const c = await api<Record<string, unknown>>("/config/auth");
  console.log({ smtp_host: c.smtp_host, smtp_port: c.smtp_port, smtp_user: c.smtp_user, smtp_admin_email: c.smtp_admin_email, smtp_sender_name: c.smtp_sender_name, rate_limit_email_sent: c.rate_limit_email_sent, templates: Boolean(Object.keys(templates).length) });
})().catch((e) => { console.error(e.message); process.exit(1); });
