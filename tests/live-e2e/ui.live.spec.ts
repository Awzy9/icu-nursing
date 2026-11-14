/**
 * UI tests: the real Next.js app (production build) against the approved DEV Supabase project.
 * Staff identities are clearly-labelled TEST accounts (never presented as real clinicians). Roles for UI fixtures are
 * inserted by SQL as the project owner would (the RPC-based path is covered by tests/live/workflow.live.test.ts).
 */
import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { RUN, PASSWORD, adminAuth, api, emailFor, makeUser, newClient, sql, totp } from "../live/helpers";
import { adminStorageRemove } from "../../scripts/live/admin";
import { cleanup } from "../live/helpers";

test.describe.configure({ mode: "serial" });

const ids: string[] = [];
const slug = `ui-live-${RUN}-topic`;
let learner = { email: "", id: "" }, author = { email: "", id: "" }, publisher = { email: "", id: "" }, reviewer = { email: "", id: "" }, boss = { email: "", id: "" };
let topicId = "", sourceTitle = "";
const uploadedPaths: string[] = [];
const secrets: Record<string, string> = {};

/** The Turnstile TEST widget issues a token on its own; wait until it has been written into the form. */
async function waitForCaptcha(page: Page) {
  await expect(page.locator('input[name="captchaToken"]')).not.toHaveValue("", { timeout: 30_000 });
}

async function login(page: Page, email: string, password = PASSWORD, expectSuccess = true) {
  await page.goto("/en/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(password);
  await waitForCaptcha(page);
  await page.getByRole("button", { name: "Sign in" }).click();
  if (expectSuccess) await expect(page).not.toHaveURL(/\/login/, { timeout: 20_000 }); // wait for the server action to finish
}

/** Signs out and waits for the server action to finish (it redirects to the home page). */
async function signOut(page: Page) {
  await page.getByRole("button", { name: "Sign out" }).first().click();
  await expect(page).toHaveURL(/\/en$/);
}

/** Completes the /mfa page like a person with an authenticator app (enrols on first use). */
async function mfa(page: Page, email: string) {
  await expect(page).toHaveURL(/\/en\/mfa/);
  const secretLoc = page.locator("code");
  const enrolling = await secretLoc.waitFor({ timeout: 15_000 }).then(() => true).catch(() => false);
  if (enrolling) secrets[email] = (await secretLoc.first().textContent())!.trim();
  await page.getByLabel("6-digit code").fill(totp(secrets[email]!));
  await page.getByRole("button", { name: "Verify" }).click();
  await expect(page).not.toHaveURL(/\/en\/mfa/, { timeout: 20_000 });
}

test.beforeAll(async () => {
  const mk = async (label: string, name: string) => { const u = await makeUser(label, name); ids.push(u.id); return u; };
  learner = await mk("ui-learner", "UI Learner"); author = await mk("ui-author", "UI Author"); publisher = await mk("ui-publisher", "UI Publisher");
  reviewer = await mk("ui-reviewer", "UI Reviewer"); boss = await mk("ui-admin", "UI Admin");
  await sql(`insert into public.user_roles (user_id, role) values ('${author.id}','author'),('${publisher.id}','publisher'),('${reviewer.id}','clinical_reviewer'),('${boss.id}','admin');
             insert into public.reviewer_specialties (user_id, specialty) values ('${reviewer.id}','NE');`);
  sourceTitle = `LIVE TEST ${RUN} UI source`;
  await sql(`insert into public.sources (source_code, organization, title, url, licence_class) values ('UI-${RUN}', 'Live Test', '${sourceTitle}', 'https://example.org/ui', 'GREEN')`);
});
test.afterAll(async () => { await adminStorageRemove(uploadedPaths); await cleanup(ids); await sql(`delete from public.topics where slug like 'ui-live-%'`).catch(() => undefined); });

test("registration page validates input and does not pretend an undeliverable address was registered", async ({ page }) => {
  await page.goto("/en/register");
  await page.getByLabel("Display name").fill("LIVE TEST registrant");
  await page.getByLabel("Email address").fill(emailFor("registrant"));
  await page.getByLabel("Password", { exact: true }).fill("correct-horse-battery-1");
  await page.getByLabel("Confirm password").fill("correct-horse-battery-1");
  await waitForCaptcha(page);
  await page.getByRole("button", { name: "Create account" }).click();
  // Supabase rejects domains without a mail server; if the built-in SMTP quota (2 emails/hour) is exhausted it answers 429 first.
  // Either way the person is told the truth and is NOT sent to a "check your email" page for an address that was never registered.
  await expect(page.locator("main").getByRole("alert")).toContainText(/valid email|Too many attempts/i);
  await expect(page).toHaveURL(/\/en\/register/);
  await page.getByLabel("Email address").fill("a@b.co");
  await page.getByLabel("Password", { exact: true }).fill("short");
  await page.getByLabel("Confirm password").fill("short");
  await waitForCaptcha(page);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText(/at least 12/i);
});

test("CAPTCHA: the widget loads under the CSP and fills the form; a missing token is refused; a rejected token shows a clear error and re-arms the widget", async ({ page }) => {
  // This test REPLACES the project's CAPTCHA secret with Cloudflare TEST secrets. Never run it against the owner's real secret.
  test.skip(process.env.CAPTCHA_MODE !== "test", "needs CAPTCHA_MODE=test (it would overwrite the real Turnstile secret)");
  test.setTimeout(240_000);
  const violations: string[] = [];
  page.on("console", (m) => { if (/content security policy/i.test(m.text())) violations.push(m.text()); });
  await page.goto("/en/login");
  await expect(page.locator('script[src*="challenges.cloudflare.com/turnstile"]')).toBeAttached({ timeout: 30_000 }); // loaded by our nonce'd bundle (strict-dynamic)
  await waitForCaptcha(page); // Cloudflare's widget (closed shadow DOM) issued a token and our form received it
  expect(violations).toEqual([]);
  // 1) no token (e.g. the person submits before the challenge completes, or tampers with the form)
  await page.getByLabel("Email address").fill(learner.email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.evaluate(() => { (document.querySelector('input[name="captchaToken"]') as HTMLInputElement).value = ""; });
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText("Please complete the security check.");
  await expect(page).toHaveURL(/\/login/);
  // 2) the provider rejects the token (Cloudflare TEST secret that always fails), then restore the passing secret
  const secret = (s: string) => api("/config/auth", { method: "PATCH", body: JSON.stringify({ security_captcha_enabled: true, security_captcha_provider: "turnstile", security_captcha_secret: s }) });
  const settled = async (want: "captcha_failed" | "ok") => {
    for (let i = 0; i < 15; i++) {
      const r = await newClient().auth.signInWithPassword({ email: learner.email, password: PASSWORD });
      if ((r.error ? r.error.code : "ok") === want) return;
      await new Promise((x) => setTimeout(x, 3000)); // Supabase Auth needs a few seconds to apply a new CAPTCHA secret
    }
    throw new Error("CAPTCHA configuration did not settle");
  };
  await secret("2x0000000000000000000000000000000AA");
  try {
    await settled("captcha_failed");
    await page.goto("/en/login");
    await page.getByLabel("Email address").fill(learner.email);
    await page.getByLabel("Password").fill(PASSWORD);
    await waitForCaptcha(page);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.locator("main").getByRole("alert")).toContainText(/security check failed/i);
    await expect(page).toHaveURL(/\/login/);
    await waitForCaptcha(page); // the widget was reset and issued a fresh token
    await expect(page.getByLabel("Password")).toHaveValue(""); // password cleared after a failure
  } finally {
    await secret("1x0000000000000000000000000000000AA");
  }
  await settled("ok");
});

test("login: wrong password is refused; right password shows the dashboard; protected pages redirect when signed out", async ({ page }) => {
  await page.goto("/en/dashboard");
  await expect(page).toHaveURL(/\/en\/login\?next=%2Fdashboard/);
  await login(page, learner.email, "wrong-password-12345", false);
  await expect(page.locator("main").getByRole("alert")).toContainText("Email or password is incorrect");
  await login(page, learner.email);
  await expect(page).toHaveURL(/\/en\/dashboard/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("LIVE TEST UI Learner");
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations.filter((v) => ["serious", "critical"].includes(v.impact ?? ""))).toEqual([]);
  await signOut(page);
  await page.goto("/en/dashboard");
  await expect(page).toHaveURL(/\/en\/login/);
});

test("staff areas demand MFA: an administrator is sent to /mfa, enrols TOTP in the UI, then reaches the admin pages", async ({ page }) => {
  await login(page, boss.email);
  await page.goto("/en/admin");
  await expect(page).toHaveURL(/\/en\/mfa\?next=/);
  await mfa(page, boss.email);
  await expect(page).toHaveURL(/\/en\/admin/);
  await expect(page.getByRole("heading", { name: "Administration" })).toBeVisible();
  await page.goto("/en/admin/users");
  await expect(page.getByText("LIVE TEST UI Reviewer")).toBeVisible();
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations.filter((v) => ["serious", "critical"].includes(v.impact ?? ""))).toEqual([]);
  await signOut(page);
});

test("a learner cannot reach the admin area", async ({ page }) => {
  await login(page, learner.email);
  await page.goto("/en/admin");
  await expect(page).toHaveURL(/\/en\/dashboard/);
  await signOut(page);
});

test("author drafts a topic in the CMS, sees the readiness checks, and submits it for clinical review", async ({ page }) => {
  await login(page, author.email);
  await page.goto("/en/admin/topics/new");
  await mfa(page, author.email);
  await page.goto("/en/admin/topics/new");
  await page.getByLabel("URL slug").fill(slug);
  await page.getByLabel("Title (English)").fill(`LIVE TEST ${RUN} UI topic`);
  await page.getByLabel("Summary (English)").fill("Synthetic UI test topic. No clinical content.");
  await page.getByRole("button", { name: "Create draft" }).click();
  await expect(page).toHaveURL(/\/en\/admin\/topics\/[0-9a-f-]{36}$/);
  topicId = page.url().split("/").pop()!;
  await expect(page.getByText("Not ready for review yet")).toBeVisible();
  await expect(page.getByText("A learning objectives section is required")).toBeVisible();

  await page.getByText("Add a section").click();
  const sec = page.locator("details[open]").last();
  await sec.getByLabel("Type").selectOption("objectives");
  await sec.getByLabel("Title (English)").fill("Objectives");
  await sec.getByLabel("Text (English)", { exact: false }).fill("- Placeholder objective (synthetic).");
  await sec.getByRole("button", { name: "Save section" }).click();
  await expect(page.getByText("Section saved.")).toBeVisible();

  await page.getByLabel("Source", { exact: true }).selectOption({ label: new RegExp(sourceTitle.slice(0, 30)) as never }).catch(async () => {
    const opt = await page.locator("#rf-s option", { hasText: sourceTitle.slice(0, 30) }).first().getAttribute("value");
    await page.locator("#rf-s").selectOption(opt!);
  });
  await page.getByRole("button", { name: "Add / update reference" }).click();
  await expect(page.getByText("Reference saved.")).toBeVisible();
  await expect(page.getByText("All submission checks pass.")).toBeVisible();

  // Image upload through the real form: a disguised non-image is refused by file signature; a real PNG is stored with licence metadata.
  const pngBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, ...Array(64).fill(0)]);
  await page.getByLabel("Image file (PNG, JPEG or WebP, max 2 MB)").setInputFiles({ name: "evil.png", mimeType: "image/png", buffer: Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'><script>alert(1)</script></svg>") });
  await page.getByLabel("Alt text (English)", { exact: true }).fill("Synthetic test figure");
  await page.getByLabel("Licence", { exact: true }).fill("Original");
  await page.getByLabel("Licence class").selectOption("GREEN");
  await page.getByRole("checkbox", { name: /Original illustration/ }).check();
  await page.getByRole("button", { name: "Upload image" }).click();
  await expect(page.locator("main").getByRole("alert").filter({ hasText: "Only PNG, JPEG or WebP" })).toBeVisible();
  await page.getByLabel("Image file (PNG, JPEG or WebP, max 2 MB)").setInputFiles({ name: "figure.png", mimeType: "image/png", buffer: pngBytes });
  await page.getByRole("button", { name: "Upload image" }).click();
  await expect(page.getByText("Image uploaded.")).toBeVisible();
  const imgRows = await sql<{ storage_path: string; licence: string; is_original: boolean }>(`select storage_path, licence, is_original from public.topic_images where topic_id='${topicId}'`);
  expect(imgRows).toHaveLength(1);
  expect(imgRows[0]!.storage_path).toMatch(new RegExp(`^${topicId}/[0-9a-f-]{36}\\.png$`));
  expect(imgRows[0]).toMatchObject({ licence: "Original", is_original: true });
  uploadedPaths.push(imgRows[0]!.storage_path);
  const publicUrl = `https://dvmevjomyaqrojsiffnf.supabase.co/storage/v1/object/public/topic-images/${imgRows[0]!.storage_path}`;
  expect((await page.request.get(publicUrl)).status()).toBe(200);
  await expect(page.getByText("All submission checks pass.")).toBeVisible();

  await page.getByRole("button", { name: "Submit for clinical review" }).click();
  // The submit form disappears once the status changes, so the status badge is the reliable confirmation.
  await expect(page.locator("header").getByText("in review")).toBeVisible();
  await expect(page.getByRole("button", { name: "Submit for clinical review" })).toHaveCount(0);
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations.filter((v) => ["serious", "critical"].includes(v.impact ?? ""))).toEqual([]);
  await signOut(page);
});

test("publisher cannot publish before approval; assigns the reviewer; the reviewer approves; the publisher publishes", async ({ page }) => {
  await login(page, publisher.email);
  await page.goto(`/en/admin/topics/${topicId}`);
  await mfa(page, publisher.email);
  await page.goto(`/en/admin/topics/${topicId}`);
  await expect(page.getByRole("button", { name: /Publish version/ })).toHaveCount(0); // nothing approved yet
  await page.getByLabel("Reviewer").selectOption({ label: "LIVE TEST UI Reviewer (test account, not a real clinician)" });
  await page.getByRole("button", { name: "Assign reviewer" }).click();
  await expect(page.getByText("Reviewer assigned.")).toBeVisible();
  await signOut(page);

  await login(page, reviewer.email);
  await page.goto("/en/admin");
  await mfa(page, reviewer.email);
  await page.goto("/en/admin");
  await expect(page.getByRole("heading", { name: "My review queue" })).toBeVisible();
  await page.getByRole("link", { name: new RegExp(`LIVE TEST ${RUN} UI topic`) }).click();
  await page.getByLabel("Decision").selectOption("approve");
  await page.getByRole("button", { name: "Record my review" }).click();
  await expect(page.locator("header").getByText("approved")).toBeVisible();
  await signOut(page);

  await login(page, publisher.email);
  await page.goto(`/en/admin/topics/${topicId}`);
  await mfa(page, publisher.email).catch(() => undefined);
  await page.goto(`/en/admin/topics/${topicId}`);
  await page.getByRole("button", { name: /Publish version 1/ }).click();
  await expect(page.locator("header").getByText("published")).toBeVisible();
  await signOut(page);
});

test("the published topic is visible to anonymous learners with its approval metadata, and is accessible", async ({ page }) => {
  await page.goto(`/en/library/${slug}`);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(`LIVE TEST ${RUN} UI topic`);
  await expect(page.getByText(/Approved version 1/)).toBeVisible();
  await expect(page.locator("#review")).toContainText("Reviewed by (roles)");
  await expect(page.locator("#review")).toContainText("NE");
  await expect(page.getByText("Synthetic demonstration content")).toHaveCount(0); // real (workflow-approved) content, not demo
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations.filter((v) => ["serious", "critical"].includes(v.impact ?? ""))).toEqual([]);
  await page.goto("/en/library");
  await expect(page.getByRole("link", { name: new RegExp(`LIVE TEST ${RUN} UI topic`) })).toBeVisible();
});

test("a learner bookmarks and completes the topic; both persist across reloads and sign-ins and appear on the dashboard", async ({ page }) => {
  await login(page, learner.email);
  await page.goto(`/en/library/${slug}`);
  await page.getByRole("button", { name: "Bookmark", exact: true }).click();
  await expect(page.getByRole("button", { name: "Remove bookmark" })).toBeVisible();
  await page.getByRole("button", { name: "Mark as completed" }).click();
  await expect(page.getByRole("button", { name: "Mark as not completed" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Remove bookmark" })).toBeVisible();
  await signOut(page);
  await login(page, learner.email);
  await page.goto("/en/bookmarks");
  await expect(page.getByRole("link", { name: new RegExp(`LIVE TEST ${RUN} UI topic`) })).toBeVisible();
  await page.goto("/en/dashboard");
  await expect(page.getByRole("heading", { name: "Completed topics" })).toBeVisible();
  await expect(page.getByRole("link", { name: new RegExp(`LIVE TEST ${RUN} UI topic`) }).first()).toBeVisible();
  const views = await sql<{ view_count: number; status: string }>(`select view_count, status from public.learning_progress where user_id='${learner.id}'`);
  expect(views[0]).toMatchObject({ status: "completed" });
});

test("email-link callback: a recovery link signs the user in and the reset form sets a new password", async ({ page }) => {
  const link = await adminAuth<{ hashed_token: string }>("/admin/generate_link", { method: "POST", body: JSON.stringify({ type: "recovery", email: learner.email }) });
  await page.goto(`/auth/callback?token_hash=${link.hashed_token}&type=recovery&next=${encodeURIComponent("/en/reset-password")}`);
  await expect(page).toHaveURL(/\/en\/reset-password/);
  await page.getByLabel("Password", { exact: true }).fill("short1");
  await page.getByLabel("Confirm password").fill("short1");
  await page.getByRole("button", { name: "Update password" }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText(/at least 12/);
  await page.getByLabel("Password", { exact: true }).fill("a-brand-new-strong-password-3");
  await page.getByLabel("Confirm password").fill("a-brand-new-strong-password-3");
  await page.getByRole("button", { name: "Update password" }).click();
  await expect(page.getByText("Your password has been updated.")).toBeVisible();
  const c = newClient();
  expect((await c.auth.signInWithPassword({ email: learner.email, password: "a-brand-new-strong-password-3" })).error).toBeNull();
  // an open-redirect attempt through the callback is neutralised
  const evil = await page.request.get(`/auth/callback?token_hash=bad&type=recovery&next=${encodeURIComponent("https://evil.example")}`, { maxRedirects: 0 });
  expect(evil.headers().location ?? "").not.toContain("evil.example");
});

test("sessions persist across pages and tabs, and the security headers hold on live pages", async ({ browser }) => {
  const ctx = await browser.newContext();
  const a = await ctx.newPage();
  await login(a, boss.email, PASSWORD);
  await expect(a).toHaveURL(/\/en\/dashboard/);
  const b = await ctx.newPage(); // second tab shares the session cookie
  await b.goto("/en/dashboard");
  await expect(b.getByRole("heading", { level: 1 })).toContainText("LIVE TEST UI Admin");
  const res = await b.goto("/en/library");
  const csp = res!.headers()["content-security-policy"]!;
  expect(csp).toContain("connect-src 'self' https://dvmevjomyaqrojsiffnf.supabase.co");
  expect(csp).not.toContain("*.supabase.co");
  await ctx.close();
});
