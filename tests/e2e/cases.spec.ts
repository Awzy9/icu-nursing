import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { loadCaseFixtures } from "../../src/lib/cases/fixtures";

const cases = loadCaseFixtures();
const serious = async (page: Page) => {
  await page.waitForFunction(() => document.title.length > 0); // metadata streams in after a client-side navigation; axe needs a title
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  return r.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`);
};
const card = (page: Page, title: string) => page.getByRole("heading", { name: title }).locator("xpath=ancestor::li");
/** The step shown now (matched by its prompt text), so tests choose by points regardless of option shuffling. */
async function stepNow(page: Page) {
  const info = ((await page.locator("section[aria-labelledby=cs-step] p").nth(1).textContent()) ?? "").trim();
  for (const c of cases) for (const s of c.steps) if (s.info.en === info) return s;
  throw new Error(`unknown step: ${info}`);
}
async function decide(page: Page, points: 0 | 1 | 2) {
  const s = await stepNow(page);
  const o = s.options.find((x) => x.points === points)!;
  const before = await page.locator("section[aria-labelledby=cs-trail] details").count();
  await page.getByRole("radio", { name: o.text.en!, exact: false }).first().check();
  await page.locator("section[aria-labelledby=cs-step]").getByRole("button").click(); // the commit button (locale-independent)
  await page.waitForFunction((n) => document.querySelectorAll("section[aria-labelledby=cs-trail] details").length > n, before);
  return o;
}

test.describe("case-based learning", () => {
  test("dashboard lists labelled synthetic cases with the educational-scoring notice", async ({ page }) => {
    await page.goto("/en/cases");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Case-based learning");
    await expect(page.getByText(/SYNTHETIC DEVELOPMENT FIXTURES/)).toBeVisible();
    await expect(page.getByText(/educational feedback, not proof of clinical competence/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Start case" })).toHaveCount(3);
    await expect(page.getByText("Synthetic sample").first()).toBeVisible();
    expect(await serious(page)).toEqual([]);
  });

  test("a full branching run: hidden keys, committed feedback with scope labels, scoring and a completion summary", async ({ page }) => {
    await page.goto("/en/cases");
    await card(page, "The blank timetable board").getByRole("button", { name: "Start case" }).click();
    await page.waitForURL(/cases\/attempt\//);
    const secrets = cases[0]!.steps.flatMap((s) => s.options.map((o) => o.feedback.en!));
    const html = await page.content();
    for (const x of secrets) expect(html, `leaked: ${x}`).not.toContain(x);
    await expect(page.getByRole("heading", { name: "Decision 1" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Commit this decision" })).toBeDisabled();

    await decide(page, 0); // the 0-point decision diverts to decision 3 (error branch)
    await expect(page.getByRole("heading", { name: "Feedback on decision 1" }).first()).toBeVisible();
    await expect(page.getByText("0 of 2 points").first()).toBeVisible();
    await expect(page.getByText(/Scope labels describe who may decide or act/).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Decision 3" })).toBeVisible();
    expect(await serious(page)).toEqual([]);
    await decide(page, 2);
    await expect(page.getByRole("heading", { name: "Decision 4" })).toBeVisible();
    await decide(page, 1);
    await expect(page.getByRole("heading", { name: "Case complete · Score" })).toBeVisible();
    await expect(page.getByTestId("case-score")).toHaveText("50.0%");
    await expect(page.getByTestId("case-points")).toHaveText("3 of 6 points across 3 decisions");
    await expect(page.getByRole("heading", { name: "Your path" })).toBeVisible();
    expect(await serious(page)).toEqual([]);

    await page.getByRole("link", { name: "Back to all cases" }).first().click();
    await expect(card(page, "The blank timetable board")).toContainText("Best score: 50.0%");
    await expect(card(page, "The blank timetable board").getByRole("button", { name: "Review last attempt" })).toBeVisible();
  });

  test("resumes an unfinished case at the right decision; discarding works", async ({ page }) => {
    await page.goto("/en/cases");
    await card(page, "The noisy reading room").getByRole("button", { name: "Start case" }).click();
    await page.waitForURL(/cases\/attempt\//);
    const url = page.url();
    await decide(page, 2);
    await page.goto("/en/cases");
    const c = card(page, "The noisy reading room");
    await expect(c.getByRole("button", { name: "Resume at decision 2" })).toBeVisible();
    await c.getByRole("button", { name: "Resume at decision 2" }).click();
    await expect(page).toHaveURL(url);
    await expect(page.getByRole("heading", { name: "Decision 2" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Feedback on decision 1" }).first()).toBeVisible();
    await page.goto("/en/cases");
    await c.getByRole("button", { name: "Discard unfinished attempt" }).click();
    await c.getByRole("button", { name: "Discard unfinished attempt" }).last().click();
    await expect(c.getByRole("button", { name: "Start case" })).toBeVisible();
  });

  test("is operable by keyboard", async ({ page, isMobile }) => {
    test.skip(isMobile, "keyboard flow");
    await page.goto("/en/cases");
    await card(page, "The overdue loan desk").getByRole("button", { name: "Start case" }).click();
    await page.waitForURL(/cases\/attempt\//);
    await page.getByRole("radio").first().focus();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("radio").nth(1)).toBeChecked();
    await page.getByRole("button", { name: "Commit this decision" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { name: "Feedback on decision 1" }).first()).toBeVisible();
  });

  test("another session cannot open someone else's attempt", async ({ page, browser }) => {
    await page.goto("/en/cases");
    await card(page, "The blank timetable board").getByRole("button", { name: "Start case" }).click();
    await page.waitForURL(/cases\/attempt\//);
    const other = await browser.newContext();
    const p2 = await other.newPage();
    await p2.goto(page.url());
    await expect(p2.getByRole("heading", { level: 1 })).toHaveText("Page not found");
    await other.close();
  });
});

test.describe("cases: Arabic, dark mode, layout", () => {
  test("renders RTL in Arabic with a clean accessibility report", async ({ page }) => {
    await page.goto("/ar/cases");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("التعلّم القائم على الحالات");
    await page.getByRole("button", { name: "ابدأ الحالة" }).first().click();
    await page.waitForURL(/cases\/attempt\//);
    await expect(page.getByRole("heading", { name: "القرار 1" })).toBeVisible();
    await expect(page).toHaveTitle(/التعلّم/);
    expect(await serious(page)).toEqual([]);
  });
  test.describe("dark mode", () => {
    test.use({ colorScheme: "dark" });
    test("meets contrast rules", async ({ page }) => {
      await page.goto("/en/cases");
      expect(await serious(page)).toEqual([]);
      await page.getByRole("button", { name: "Start case" }).first().click();
      await page.waitForURL(/cases\/attempt\//);
      await expect(page.getByRole("heading", { name: "Decision 1" })).toBeVisible();
      await expect(page).toHaveTitle(/Case-based/); // metadata streams in after a client-side navigation
      expect(await serious(page)).toEqual([]);
    });
  });
  test("has no horizontal overflow", async ({ page }) => {
    await page.goto("/en/cases");
    await page.getByRole("button", { name: "Start case" }).first().click();
    await page.waitForURL(/cases\/attempt\//);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  });

  test("observations change with the path, consequences stay hidden until a decision is committed, and a structured debrief closes the case", async ({ page }) => {
    await page.goto("/en/cases");
    await card(page, "The blank timetable board").getByRole("button", { name: "Start case" }).click();
    await page.waitForURL(/cases\/attempt\//);
    const c = cases[0]!;
    // the first step shows its readings with no comparison yet; nothing from later steps or consequences is in the page
    const obs = page.getByTestId("observations");
    await expect(obs.getByRole("heading", { name: "Observations at this decision" })).toBeVisible();
    await expect(obs.getByRole("row", { name: /Passengers waiting\s+6 people\s+First reading\s+Within the band/ })).toBeVisible();
    const html = await page.content();
    for (const st of c.steps) for (const o of st.options) expect(html, `leaked consequence: ${o.consequence?.en}`).not.toContain(o.consequence!.en!);
    expect(html).not.toContain("Passengers waiting</th><td class=\"py-1 pe-3 tabular-nums\">14");
    // commit the best option: its consequence and the next step's changed readings appear
    const first = await decide(page, 2);
    await expect(page.getByText(first.consequence!.en!)).toBeVisible();
    await expect(page.getByTestId("observations").last().getByRole("row", { name: /Passengers waiting\s+14 people\s+Up from 6\s+Within the band/ })).toBeVisible();
    // finish with best decisions
    for (let i = 0; i < 3; i++) { if (await page.getByTestId("debrief").count()) break; await decide(page, 2); }
    const debrief = page.getByTestId("debrief");
    await expect(debrief.getByRole("heading", { name: "Structured debrief" })).toBeVisible();
    await expect(debrief.getByText("Confirm facts from the official source before telling anyone anything.")).toBeVisible();
    await expect(debrief.getByText("Every decision matched the reference answer.")).toBeVisible();
    await expect(debrief.getByRole("link", { name: "Open skill SYN-SKILL-002" })).toHaveAttribute("href", /\/en\/skills\/SYN-SKILL-002$/);
    expect(await serious(page)).toEqual([]);
  });

  test("the debrief lists decisions to revisit after a weaker choice, and works in Arabic right-to-left", async ({ page }) => {
    await page.goto("/ar/cases");
    await page.getByRole("button", { name: /ابدأ الحالة|Start case/ }).first().click();
    await page.waitForURL(/cases\/attempt\//);
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await decide(page, 1);
    for (let i = 0; i < 4; i++) { if (await page.getByTestId("debrief").count()) break; await decide(page, 2); }
    const debrief = page.getByTestId("debrief");
    await expect(debrief.getByRole("heading", { name: "جلسة المراجعة المنظمة" })).toBeVisible();
    await expect(debrief.getByText("القرار 1")).toBeVisible();
    expect(await serious(page)).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  });
});
