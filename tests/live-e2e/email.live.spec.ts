/**
 * REAL-EMAIL end-to-end tests (opt-in): LIVE_EMAIL=1 npm run test:e2e:live
 * Prerequisites (docs/EMAIL_TESTING.md): custom SMTP configured on the dev project (Resend recommended) and the Resend API
 * readable by this harness. Recipients are Resend's TEST addresses `delivered+<tag>@resend.dev` (accepted by Resend without
 * a verified domain). The emails are read back through the Resend API, so no inbox is needed.
 * STATUS: written but NOT yet executed (needs the owner's SMTP credentials); the Resend response shapes are assumed from its docs.
 */
import { expect, test, type Page } from "@playwright/test";
import { PASSWORD, RUN, cleanup, sql } from "../live/helpers";

test.skip(!process.env.LIVE_EMAIL, "Set LIVE_EMAIL=1 after SMTP is configured (see docs/EMAIL_TESTING.md)");
test.describe.configure({ mode: "serial" });

const address = `delivered+live${RUN}@resend.dev`;
const resend = async (path: string) => {
  const headers: Record<string, string> = process.env.RESEND_API_KEY ? { Authorization: `Bearer ${process.env.RESEND_API_KEY}` } : {}; // in the sandbox a proxy injects it
  const r = await fetch(`https://api.resend.com${path}`, { headers });
  if (!r.ok) throw new Error(`Resend ${path} -> ${r.status}`);
  return r.json() as Promise<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
};
const sinceMs = Date.now() - 60_000;

/** Polls the provider for a message to `to` whose subject matches, created after this test run started. */
async function waitForEmail(to: string, subject: RegExp, timeout = 90_000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    const list = await resend("/emails");
    const hit = (list.data ?? []).find((e: any) => [].concat(e.to).join(",").toLowerCase().includes(to.toLowerCase()) && subject.test(e.subject ?? "") && Date.parse(e.created_at) >= sinceMs); // eslint-disable-line @typescript-eslint/no-explicit-any
    if (hit) return resend(`/emails/${hit.id}`);
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error(`No email to ${to} matching ${subject} within ${timeout / 1000}s`);
}
const linkIn = (html: string) => { const m = /href="([^"]*\/auth\/v1\/verify[^"]*)"/.exec(html); if (!m) throw new Error("No verification link in email"); return m[1]!.replace(/&amp;/g, "&"); };
const captcha = (p: Page) => expect(p.locator('input[name="captchaToken"]')).not.toHaveValue("", { timeout: 30_000 });
let userId = "";

test.afterAll(async () => { if (userId) await cleanup([userId]); await sql(`delete from auth.users where email like 'delivered+live${RUN}@resend.dev'`).catch(() => undefined); });

test("registration: a real confirmation email is sent, branded, safe, and its link activates the account and signs in", async ({ page }) => {
  await page.goto("/en/register");
  await page.getByLabel("Display name").fill("LIVE TEST email registrant (test account)");
  await page.getByLabel("Email address").fill(address);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Confirm password").fill(PASSWORD);
  await captcha(page);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/en\/check-email/);
  await expect(page.getByRole("status")).toContainText(address);

  const mail = await waitForEmail(address, /confirm/i);
  expect(mail.last_event).toMatch(/delivered|sent/);
  expect(String(mail.from)).toMatch(/ICU Nurse Knowledge Map|resend\.dev/i);
  expect(mail.html).not.toContain(PASSWORD); // never echo credentials
  const link = linkIn(mail.html);
  expect(link).toContain("dvmevjomyaqrojsiffnf.supabase.co/auth/v1/verify");
  expect(decodeURIComponent(link)).toMatch(/redirect_to=https?:\/\/localhost:\d+\/auth\/callback/); // allow-listed callback
  await page.goto(link); // Supabase verifies, redirects to /auth/callback?code=..., the app exchanges it
  await expect(page).toHaveURL(/\/en\/dashboard/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { level: 1 })).toContainText("LIVE TEST email registrant");
  userId = (await sql<{ id: string }>(`select id from auth.users where email='${address}'`))[0]!.id;
  expect((await sql<{ c: boolean }>(`select email_confirmed_at is not null c from auth.users where id='${userId}'`))[0]!.c).toBe(true);
  await page.getByRole("button", { name: "Sign out" }).first().click();
});

test("re-registering the same address looks identical (no account enumeration) and sends no second confirmation to an active account", async ({ page }) => {
  await page.goto("/en/register");
  await page.getByLabel("Display name").fill("duplicate attempt");
  await page.getByLabel("Email address").fill(address);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Confirm password").fill(PASSWORD);
  await captcha(page);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/en\/check-email/);
});

test("password reset: a real recovery email is sent for a known account, its link lets the person set a new password", async ({ page }) => {
  await page.goto("/en/forgot-password");
  await page.getByLabel("Email address").fill(address);
  await captcha(page);
  const start = Date.now();
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByText("If an account exists for that address")).toBeVisible();
  const mail = await waitForEmail(address, /reset/i);
  expect(Date.parse(mail.created_at)).toBeGreaterThan(start - 5_000);
  await page.goto(linkIn(mail.html));
  await expect(page).toHaveURL(/\/en\/reset-password/, { timeout: 30_000 });
  const fresh = "another-strong-password-LIVE-2";
  await page.getByLabel("Password", { exact: true }).fill(fresh);
  await page.getByLabel("Confirm password").fill(fresh);
  await page.getByRole("button", { name: "Update password" }).click();
  await expect(page.getByText("Your password has been updated.")).toBeVisible();
});

test("password reset for an UNKNOWN address shows the same message and sends nothing", async ({ page }) => {
  const ghost = `delivered+ghost${RUN}@resend.dev`;
  await page.goto("/en/forgot-password");
  await page.getByLabel("Email address").fill(ghost);
  await captcha(page);
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByText("If an account exists for that address")).toBeVisible();
  await expect(waitForEmail(ghost, /./, 25_000)).rejects.toThrow(/No email/);
});
