/**
 * Real Cloudflare Turnstile against the DEV project (owner's real widget; real secret stored in Supabase).
 * The real widget is an interactive challenge that automated browsers cannot (and should not) solve, so these tests cover
 * everything verifiable WITHOUT a human token: the widget loads for the real site key on localhost under our CSP, a missing
 * token is refused, and a forged token is rejected by Supabase after Cloudflare's server-side verification.
 * A positive login / reset / sign-up with a genuine token is a manual check: docs/CAPTCHA.md "Manual real-CAPTCHA checklist".
 * This file never touches the CAPTCHA configuration. Run: REAL_CAPTCHA=1 npx playwright test --config playwright.live.config.ts captcha-real
 */
import { expect, test } from "@playwright/test";

test.skip(process.env.REAL_CAPTCHA !== "1", "set REAL_CAPTCHA=1");

for (const path of ["/en/login", "/en/register", "/en/forgot-password"]) {
  test(`${path}: real widget loads on localhost with no CSP violations; token field is empty until a human completes it`, async ({ page }) => {
    const problems: string[] = [];
    page.on("console", (m) => { if (/content security policy/i.test(m.text()) && !/data:,/.test(m.text())) problems.push(m.text().slice(0, 200)); });
    await page.goto(path);
    await expect(page.locator('script[src*="challenges.cloudflare.com/turnstile"]')).toBeAttached({ timeout: 30_000 });
    await page.waitForTimeout(6000);
    await expect(page.locator('input[name="captchaToken"]')).toHaveValue("");
    expect(problems).toEqual([]);
  });
}

test("login without a token is refused with our message", async ({ page }) => {
  await page.goto("/en/login");
  await page.getByLabel("Email address").fill("nobody@example.org");
  await page.getByLabel("Password").fill("Not-A-Real-Password-1!");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText("Please complete the security check.");
});

test("login with a forged token is rejected after Cloudflare's server-side check, and the form stays on the page", async ({ page }) => {
  await page.goto("/en/login");
  await page.getByLabel("Email address").fill("nobody@example.org");
  await page.getByLabel("Password").fill("Not-A-Real-Password-1!");
  await expect(page.locator('input[name="captchaToken"]')).toBeAttached();
  await page.evaluate(() => { (document.querySelector('input[name="captchaToken"]') as HTMLInputElement).value = "forged-token"; });
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText(/security check failed/i);
  await expect(page).toHaveURL(/\/login/);
});
