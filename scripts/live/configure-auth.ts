/** Applies the hardened Auth settings to the approved DEV project and reads them back. Idempotent. */
import { api } from "./mgmt";

const desired = {
  site_url: "http://localhost:3000",
  uri_allow_list: "http://localhost:3000/auth/callback,http://localhost:3100/auth/callback",
  mailer_autoconfirm: false,                 // email confirmation required
  password_min_length: 12,
  mfa_totp_enroll_enabled: true,
  mfa_totp_verify_enabled: true,
  mfa_allow_low_aal: false,
  refresh_token_rotation_enabled: true,
  security_refresh_token_reuse_interval: 10,
  external_anonymous_users_enabled: false,
  mailer_notifications_password_changed_enabled: true,
  mailer_notifications_mfa_factor_enrolled_enabled: true,
  mailer_notifications_mfa_factor_unenrolled_enabled: true,
  mailer_notifications_email_changed_enabled: true,
  jwt_exp: 3600,
};

(async () => {
  await api("/config/auth", { method: "PATCH", body: JSON.stringify(desired) });
  const now = await api<Record<string, unknown>>("/config/auth");
  let bad = 0;
  for (const [k, v] of Object.entries(desired)) {
    const ok = JSON.stringify(now[k]) === JSON.stringify(v);
    if (!ok) bad++;
    console.log(`${ok ? "OK  " : "DIFF"} ${k} = ${JSON.stringify(now[k])}`);
  }
  console.log(bad ? `${bad} setting(s) differ` : "all settings applied");
})().catch((e) => { console.error(e.message); process.exit(1); });
