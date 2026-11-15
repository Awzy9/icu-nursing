/**
 * Real application integration check against the approved DEV project (CAPTCHA stays ON; nothing is weakened).
 * Sessions are obtained WITHOUT the CAPTCHA-protected password endpoint: an admin-issued recovery link is exchanged for a real
 * session (CAPTCHA does not apply to links already issued). The built app (build:live, database mode) is then driven in Chromium,
 * and the same real sessions are used for raw PostgREST requests. Temporary test accounts are removed at the end.
 * Run:  NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt npx tsx scripts/live/verify-app-on-dev.ts   (app on :3106)
 */
import { createClient } from "@supabase/supabase-js";
import { chromium, devices, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { PROJECT_URL, REF, DEV_REF, publishableKey } from "./mgmt";
import { adminAuth, createTestUser, deleteTestUser } from "./admin";
import { loadFixtures } from "../../src/lib/question-bank/fixtures";
import { loadCaseFixtures } from "../../src/lib/cases/fixtures";

const BASE = process.env.APP_URL ?? "http://localhost:3106";
const SHOTS = "docs/phase6/screenshots/";
const fx = loadFixtures();
const cases = loadCaseFixtures();
const PW = "correct-horse-battery-DEVCHECK-1";
let failed = 0;
const check = (name: string, ok: boolean, detail = "") => { console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  " + detail : ""}`); if (!ok) failed++; };

async function link(email: string) {
  const l = await adminAuth<{ hashed_token: string }>("/admin/generate_link", { method: "POST", body: JSON.stringify({ type: "recovery", email }) });
  return l.hashed_token;
}
async function loginUi(page: Page, email: string, next: string) {
  await page.goto(`${BASE}/auth/callback?token_hash=${await link(email)}&type=recovery&next=${encodeURIComponent(next)}`);
  await page.waitForURL(new RegExp(next.replace(/[/]/g, "\\/")));
}
const stepInfo = async (page: Page) => ((await page.locator("section[aria-labelledby=cs-step] p").nth(1).textContent()) ?? "").trim();
const currentQ = async (page: Page) => {
  const stem = (await page.locator("fieldset legend").first().evaluate((l) => (l.firstElementChild as HTMLElement).textContent ?? "")).trim();
  return fx.find((q) => q.stem.en === stem)!;
};
async function answer(page: Page, right: boolean) {
  const q = await currentQ(page);
  const o = right ? q.options.find((x) => x.id === q.correctOptionId)! : q.options.find((x) => x.id !== q.correctOptionId)!;
  await page.getByRole("radio", { name: o.text.en!, exact: false }).first().check();
  await page.getByRole("button", { name: "Submit answer" }).click();
  await page.getByText("Why this is the correct answer").first().waitFor();
}
async function waitResults(page: Page) {
  try { await page.waitForURL(/results$/); } catch (e) {
    console.log("DEBUG url:", page.url(), "\nDEBUG main:", ((await page.locator("main").innerText().catch(() => "")) || "").slice(0, 500).replace(/\n+/g, " | "));
    throw e;
  }
}
const overflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
const serious = async (page: Page) => (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()).violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => v.id);

(async () => {
  if (REF !== DEV_REF) throw new Error("expected the dev target");
  const stamp = Date.now().toString(36);
  const ids: string[] = [];
  const mk = async (l: string) => { const email = `live-test-${stamp}-${l}@example.org`; const u = await createTestUser(email, PW, `LIVE TEST ${l} (temporary check account)`); ids.push(u.id); return { email, id: u.id }; };
  const A = await mk("app-a"), B = await mk("app-b");
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM_PATH || undefined });
  const newCtx = async (o: Parameters<typeof browser.newContext>[0]) => { const c = await browser.newContext(o); c.setDefaultTimeout(60_000); c.setDefaultNavigationTimeout(60_000); return c; }; // the hosted project adds latency
  try {
    // ---- real sessions + raw PostgREST on the hosted dev project -------------------------------------------------------
    const anon = await publishableKey();
    const sess = async (u: { email: string }) => {
      const c = createClient(PROJECT_URL, anon, { auth: { persistSession: false, autoRefreshToken: false } });
      const { data, error } = await c.auth.verifyOtp({ token_hash: await link(u.email), type: "recovery" });
      if (error || !data.session) throw new Error(`verifyOtp failed: ${error?.message}`);
      return { c, token: data.session.access_token };
    };
    const sa = await sess(A), sb = await sess(B);
    const rest = (path: string, token: string, init: RequestInit = {}) => fetch(`${PROJECT_URL}/rest/v1${path}`, { ...init, headers: { apikey: anon, Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers as Record<string, string>) } });
    const att = (await sa.c.rpc("qb_start_attempt", { p_mode: "exam", p_count: 4 })).data as string;
    const raw = await (await rest("/rpc/qb_get_attempt", sa.token, { method: "POST", body: JSON.stringify({ p_attempt: att }) })).text();
    check("[PostgREST dev] in-progress attempt response carries no key, rationale or explanation", !/correct_option_id|rationale|explanations/.test(raw) && fx.every((f) => !raw.includes(f.rationale.en!)));
    for (const t of ["question_answer_keys", "question_explanations", "question_items", "case_option_keys", "case_items"]) {
      const r = await rest(`/${t}?select=*`, sa.token);
      check(`[PostgREST dev] learner reads 0 rows from ${t}`, r.status === 200 && (await r.json()).length === 0);
    }
    const w = await rest("/quiz_attempts", sa.token, { method: "POST", body: JSON.stringify({ user_id: A.id, mode: "exam", seed: "abcdefgh", question_count: 1 }) });
    check("[PostgREST dev] learner cannot insert an attempt row (permission denied)", w.status === 403 || w.status === 401);
    check("[PostgREST dev] other learner cannot see the attempt", (await (await rest(`/quiz_attempts?id=eq.${att}`, sb.token)).json()).length === 0);
    const probe = await rest("/rpc/qb_get_attempt", sb.token, { method: "POST", body: JSON.stringify({ p_attempt: att }) });
    check("[PostgREST dev] other learner's qb_get_attempt -> attempt not found", probe.status >= 400 && /attempt not found/.test(await probe.text()));
    check("[PostgREST dev] anonymous learner functions denied", [401, 403].includes((await fetch(`${PROJECT_URL}/rest/v1/rpc/qb_progress`, { method: "POST", headers: { apikey: anon, Authorization: `Bearer ${anon}`, "Content-Type": "application/json" }, body: "{}" })).status));

    // ---- the built app, signed in as learner A ----------------------------------------------------------------------------
    const ctx = await newCtx({ viewport: { width: 1280, height: 900 } });
    const p = await ctx.newPage();
    const bodies: string[] = [];
    p.on("response", async (r) => { if (/html|json|x-component|text/.test(r.headers()["content-type"] ?? "")) bodies.push(await r.text().catch(() => "")); });
    await loginUi(p, A.email, "/en/question-bank");
    await p.getByRole("heading", { level: 1, name: "Question bank" }).waitFor();
    check("[app dev] authenticated learner reaches the question-bank dashboard (database mode, no demo banner)", (await p.getByText("SYNTHETIC DEVELOPMENT FIXTURES").count()) === 0 && (await p.getByRole("button", { name: "Start practice" }).isEnabled()));
    await p.screenshot({ path: SHOTS + "dev-1-dashboard.png", fullPage: true });
    // practice
    await p.locator("#qb-count").selectOption("5");
    await p.getByRole("button", { name: /^Start (practice|exam)$/ }).click();
    await p.waitForURL(/attempt\/[0-9a-f-]{36}$/);
    const before = bodies.join("\n") + (await p.content());
    check("[app dev] practice question page delivers no explanation or rationale before submission", fx.every((f) => !before.includes(f.rationale.en!) && f.options.every((o) => !before.includes(o.explanation.en!))));
    await answer(p, false);
    check("[app dev] practice: feedback after submit shows the correct answer and explanations", (await p.getByText("Correct answer").count()) > 0);
    await p.screenshot({ path: SHOTS + "dev-2-practice-feedback.png", fullPage: true });
    await p.getByRole("button", { name: "Flag for review" }).click();
    await p.getByRole("button", { name: "Next" }).click();
    await answer(p, true);
    await p.getByRole("button", { name: "Finish and see results" }).click();
    await p.getByRole("button", { name: "Yes, submit" }).click();
    await waitResults(p);
    check("[app dev] practice summary: server score 1 of 5 = 20.0%", (await p.getByTestId("score").textContent()) === "20.0%" && (await p.getByTestId("score-detail").textContent()) === "1 of 5 correct");
    // study right after the practice attempt: the wrong answer is due now and counted as incorrect
    await p.goto(`${BASE}/en/study`);
    await p.getByRole("heading", { level: 1, name: "Study and revision" }).waitFor();
    const due = Number(await p.getByTestId("due-count").textContent()), inc = Number(await p.getByTestId("count-incorrect").textContent());
    check("[app dev] study dashboard: due and incorrect counters reflect the persisted wrong answer", due >= 1 && inc >= 1, `due=${due} incorrect=${inc}`);
    await p.getByRole("button", { name: /Review due questions/ }).click();
    await p.waitForURL(/attempt\//);
    await p.getByRole("heading", { level: 2, name: /^Question 1 of/ }).waitFor();
    check("[app dev] study: 'due' revision starts a practice attempt over exactly the due questions", (await p.getByRole("heading", { level: 2, name: new RegExp(`^Question 1 of ${due}$`) }).count()) === 1);
    // exam
    await p.goto(`${BASE}/en/question-bank`);
    await p.locator("input[name=mode][value=exam]").check();
    await p.locator("#qb-count").selectOption("5");
    await p.locator("#qb-limit").selectOption("10");
    await p.getByRole("button", { name: /^Start (practice|exam)$/ }).click();
    await p.waitForURL(/attempt\/[0-9a-f-]{36}$/);
    const examUrl = p.url();
    await p.getByRole("heading", { level: 2, name: /^Question 1 of/ }).waitFor();
    check("[app dev] exam shows a server-anchored timer and no immediate feedback", (await p.getByRole("timer").count()) === 1 && (await p.getByText("Why this is the correct answer").count()) === 0);
    const q1 = await currentQ(p);
    await p.getByRole("radio", { name: q1.options.find((o) => o.id === q1.correctOptionId)!.text.en!, exact: false }).first().check();
    await p.getByRole("button", { name: "Next" }).click();
    await p.getByRole("button", { name: "Flag for review" }).click();
    await p.getByRole("button", { name: "Remove flag" }).waitFor();
    await p.waitForTimeout(2500); // let the fire-and-forget position/flag saves reach the server before navigating away
    await p.screenshot({ path: SHOTS + "dev-3-exam-question.png", fullPage: true });
    await p.goto(`${BASE}/en/question-bank`);
    await p.locator(`a[href$="${new URL(examUrl).pathname.replace(/^\/(en|ar)/, "")}"], a[href="${new URL(examUrl).pathname}"]`).first().click();
    await p.getByRole("heading", { level: 2, name: /^Question \d of 5$/ }).waitFor();
    const head = await p.getByRole("heading", { level: 2, name: /^Question \d of 5$/ }).textContent();
    check("[app dev] exam resumes at the saved question with the saved flag", p.url() === examUrl && head === "Question 2 of 5" && (await p.getByRole("button", { name: "Remove flag" }).count()) === 1, `url ok=${p.url() === examUrl} heading=${head}`);
    await p.getByRole("button", { name: "Submit exam" }).click();
    await p.getByRole("button", { name: "Yes, submit" }).click();
    await waitResults(p);
    check("[app dev] exam scored on the server: 1 of 5 = 20.0%, review shows explanations", (await p.getByTestId("score").textContent()) === "20.0%" && (await p.getByText("Why this is the correct answer").count()) > 0);
    await p.screenshot({ path: SHOTS + "dev-4-exam-results.png", fullPage: true });
    // study (history after both attempts)
    await p.goto(`${BASE}/en/study`);
    await p.getByRole("heading", { level: 1, name: "Study and revision" }).waitFor();
    check("[app dev] study dashboard: revision history lists persisted answers from both attempts", (await p.getByRole("table", { name: "Revision history" }).locator("tbody tr").count()) >= 2);
    await p.screenshot({ path: SHOTS + "dev-5-study.png", fullPage: true });
    await p.goto(`${BASE}/en/study/sheets`);
    check("[app dev] revision sheets list only published topics (none exist: honest empty state)", (await p.getByText("No published topics are available yet.").count()) === 1);
    // cases
    await p.goto(`${BASE}/en/cases`);
    await p.getByRole("button", { name: /^(Start|Resume|Try again)/ }).first().waitFor(); // the list streams in behind loading.tsx
    const nCases = await p.getByRole("button", { name: /^(Start|Resume) case|Try again/ }).count();
    check("[app dev] case dashboard lists 3 synthetic cases", nCases === 3, `found ${nCases}`);
    await p.getByRole("button", { name: "Start case" }).first().click();
    await p.waitForURL(/cases\/attempt\//);
    const pageHtml = bodies.join("\n") + (await p.content());
    check("[app dev] case page hides scoring keys and later steps", cases.every((c) => c.steps.every((s) => s.options.every((o) => !pageHtml.includes(o.feedback.en!)))));
    for (let i = 0; i < 6; i++) {
      if (await p.getByTestId("case-score").count()) break;
      const info = await stepInfo(p);
      const step = cases.flatMap((c) => c.steps).find((s) => s.info.en === info)!;
      await p.getByRole("radio", { name: step.options.find((o) => o.points === 2)!.text.en!, exact: false }).first().check();
      if (i === 0) await p.screenshot({ path: SHOTS + "dev-6-case-decision.png", fullPage: true });
      const before = await p.locator("details").count();
      await p.getByRole("button", { name: "Commit this decision" }).click();
      await p.waitForFunction((n) => document.querySelectorAll("details").length > n, before, { timeout: 30_000 });
    }
    check("[app dev] case completes with a deterministic server score of 100.0% on the best path", (await p.getByTestId("case-score").textContent()) === "100.0%");
    await p.screenshot({ path: SHOTS + "dev-7-case-summary.png", fullPage: true });
    // persistence across sessions + isolation
    await ctx.clearCookies();
    await loginUi(p, A.email, "/en/question-bank");
    check("[app dev] after signing out and in again, previous attempts persist", (await p.getByRole("table", { name: "Previous attempts" }).locator("tbody tr").count()) === 2);
    const ctxB = await newCtx({ viewport: { width: 1280, height: 900 } });
    const pb = await ctxB.newPage();
    await loginUi(pb, B.email, "/en/question-bank");
    check("[app dev] learner B sees none of learner A's attempts", (await pb.getByText("No attempts yet").count()) === 1);
    await pb.goto(examUrl);
    check("[app dev] learner B cannot open learner A's attempt URL", (await pb.getByRole("heading", { level: 1, name: "Page not found" }).count()) === 1 && (await pb.getByRole("radio").count()) === 0);
    await pb.goto(`${BASE}/en/study`);
    check("[app dev] learner B's study dashboard is empty", Number(await pb.getByTestId("due-count").textContent()) === 0);
    await ctxB.close();
    // unauthenticated access
    const anonCtx = await newCtx({});
    const pa = await anonCtx.newPage();
    await pa.goto(`${BASE}/en/question-bank`);
    check("[app dev] signed-out visitors are redirected to sign in", /\/login/.test(pa.url()));
    await anonCtx.close();
    // layout: RTL, mobile
    await p.goto(`${BASE}/ar/question-bank`);
    check("[app dev] Arabic dashboard is RTL with Arabic heading", (await p.locator("html").getAttribute("dir")) === "rtl" && (await p.getByRole("heading", { level: 1 }).textContent()) === "بنك الأسئلة");
    check("[app dev] axe: no serious/critical issues on the Arabic dashboard", (await serious(p)).length === 0);
    await p.screenshot({ path: SHOTS + "dev-8-arabic-rtl.png", fullPage: true });
    const mob = await newCtx({ ...devices["Pixel 7"], viewport: { width: 390, height: 844 } });
    const pm = await mob.newPage();
    await loginUi(pm, A.email, "/en/question-bank");
    for (const path of ["/en/question-bank", "/en/study", "/en/cases", "/ar/study"]) {
      await pm.goto(`${BASE}${path}`);
      check(`[app dev] mobile ${path}: no horizontal overflow`, (await overflow(pm)) <= 0);
    }
    await pm.goto(`${BASE}/en/study`);
    await pm.screenshot({ path: SHOTS + "dev-9-mobile-study.png", fullPage: true });
    await mob.close();
    await ctx.close();
  } finally {
    await browser.close();
    for (const id of ids) await deleteTestUser(id).catch((e) => console.log("could not delete", id, String(e.message).slice(0, 60)));
  }
  console.log(failed ? `\n${failed} check(s) FAILED` : "\nall dev-integration checks passed");
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error("ERR", e.message); process.exit(1); });
