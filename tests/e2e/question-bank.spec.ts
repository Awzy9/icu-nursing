import { expect, test, type Page, type Response } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { loadFixtures } from "../../src/lib/question-bank/fixtures";

const fx = loadFixtures();
const byStem = (stem: string) => fx.find((q) => q.stem.en === stem || q.stem.ar === stem)!;

const serious = async (page: Page) => {
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  return r.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`);
};

/** Starts a set from the dashboard through the real form. */
async function begin(page: Page, opts: { mode?: "practice" | "exam"; count?: number; limit?: number; locale?: "en" | "ar" } = {}) {
  const loc = opts.locale ?? "en";
  await page.goto(`/${loc}/question-bank`);
  const form = page.locator("form").filter({ has: page.locator("#qb-count") });
  await form.locator(`input[name=mode][value=${opts.mode ?? "practice"}]`).check();
  await form.locator("#qb-count").selectOption(String(opts.count ?? 5));
  if (opts.limit) await form.locator("#qb-limit").selectOption(String(opts.limit));
  await form.locator("button[type=submit]").click();
  await page.waitForURL(/\/question-bank\/attempt\/[0-9a-f-]{36}$/);
}

const currentQuestion = async (page: Page) => {
  const stem = (await page.locator("fieldset legend").first().evaluate((l) => (l.firstElementChild as HTMLElement).textContent ?? "")).trim();
  return byStem(stem);
};
const pickOption = async (page: Page, text: string) => {
  await page.getByRole("radio", { name: text, exact: false }).first().check();
};

test.describe("question bank: dashboard and content gate", () => {
  test("shows the synthetic-fixture banner, empty history and start form", async ({ page }) => {
    await page.goto("/en/question-bank");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Question bank");
    await expect(page.getByText(/SYNTHETIC DEVELOPMENT FIXTURES/)).toBeVisible();
    await expect(page.getByText("No attempts yet")).toBeVisible();
    await expect(page.getByRole("button", { name: "Start practice" })).toBeEnabled();
    expect(await serious(page)).toEqual([]);
  });

  test("exposes no clinical draft text and no question API", async ({ page, request }) => {
    for (const path of ["/api/questions", "/api/question-bank", "/api/question_items", "/api/rest/v1/question_answer_keys"]) {
      const r = await request.get(path);
      expect(r.status()).toBe(404);
    }
    await begin(page, { count: 40 });
    const html = await page.content();
    // Nothing that looks like one of the 240 clinical draft MCQs (they cite guidelines and use clinical vocabulary).
    expect(html).not.toMatch(/ARDSNet|norepinephrine|PEEP|hyperkal|vasopressor|extubat/i);
    expect(html).toContain("Synthetic sample");
  });
});

test.describe("question bank: practice mode", () => {
  test("one question at a time; feedback only after submitting; summary and score at the end", async ({ page }) => {
    const bodies: string[] = [];
    page.on("response", async (r: Response) => {
      const ct = r.headers()["content-type"] ?? "";
      if (/json|html|text|x-component/.test(ct)) bodies.push(await r.text().catch(() => ""));
    });
    await begin(page, { count: 3 });
    await expect(page.getByRole("heading", { level: 2, name: "Question 1 of 3" })).toBeVisible();
    await expect(page.getByRole("radio")).toHaveCount(4);

    // Secrecy: nothing delivered so far contains any explanation, rationale or key text.
    const secrets = fx.flatMap((q) => [q.rationale.en!, ...q.options.map((o) => o.explanation.en!)]);
    const before = [...bodies, await page.content()].join("\n");
    for (const s of secrets) expect(before, `leaked: ${s}`).not.toContain(s);
    await expect(page.getByText("Why this is the correct answer")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Submit answer" })).toBeDisabled();

    let correct = 0;
    for (let n = 1; n <= 3; n++) {
      const q = await currentQuestion(page);
      const right = n !== 2; // answer question 2 wrongly on purpose
      const target = right ? q.options.find((o) => o.id === q.correctOptionId)! : q.options.find((o) => o.id !== q.correctOptionId)!;
      await pickOption(page, target.text.en!);
      await page.getByRole("button", { name: "Submit answer" }).click();
      await expect(page.getByText(right ? "Correct" : "Incorrect", { exact: true }).first()).toBeVisible();
      await expect(page.getByText("Why this is the correct answer").first()).toBeVisible();
      if (!right) await expect(page.getByText("Why this answer is wrong").first()).toBeVisible();
      await expect(page.getByText("Your answer is submitted and cannot be changed.")).toBeVisible();
      await expect(page.getByRole("radio").first()).toBeDisabled();
      if (right) correct++;
      if (n === 1) expect(await serious(page)).toEqual([]);
      if (n < 3) await page.getByRole("button", { name: "Next" }).click();
    }
    // Previous navigation shows the locked, explained answer.
    await page.getByRole("button", { name: "Previous" }).click();
    await expect(page.getByRole("heading", { level: 2, name: "Question 2 of 3" })).toBeFocused();
    await expect(page.getByText("Incorrect", { exact: true }).first()).toBeVisible();

    await page.getByRole("button", { name: "Finish and see results" }).click();
    await expect(page.getByRole("alertdialog")).toBeFocused();
    await page.getByRole("button", { name: "Yes, submit" }).click();
    await page.waitForURL(/results$/);
    await expect(page.getByTestId("score")).toHaveText("66.7%");
    await expect(page.getByTestId("score-detail")).toHaveText(`${correct} of 3 correct`);
    expect(await serious(page)).toEqual([]);
  });

  test("is fully operable with the keyboard", async ({ page, isMobile }) => {
    test.skip(isMobile, "keyboard flow");
    await begin(page, { count: 3 });
    await page.getByRole("radio").first().focus();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("radio").nth(1)).toBeChecked();
    await page.getByRole("button", { name: "Submit answer" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByText("Why this is the correct answer").first()).toBeVisible();
    await page.getByRole("button", { name: "Next" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { level: 2, name: "Question 2 of 3" })).toBeFocused();
  });
});

test.describe("question bank: exam mode", () => {
  test("no feedback until submission; flag, change answers, navigate, submit, then review", async ({ page }) => {
    await begin(page, { mode: "exam", count: 5, limit: 10 });
    await expect(page.getByRole("timer")).toBeVisible();
    await expect(page.getByRole("button", { name: "Submit answer" })).toHaveCount(0);

    const q1 = await currentQuestion(page);
    const wrong1 = q1.options.find((o) => o.id !== q1.correctOptionId)!;
    const right1 = q1.options.find((o) => o.id === q1.correctOptionId)!;
    await pickOption(page, wrong1.text.en!);
    await pickOption(page, right1.text.en!); // change of mind
    await expect(page.getByText("Why this is the correct answer")).toHaveCount(0);
    await expect(page.getByText("Correct", { exact: true })).toHaveCount(0);

    await page.getByRole("button", { name: "Next" }).click();
    await page.getByRole("button", { name: "Flag for review" }).click();
    await expect(page.getByRole("button", { name: "Remove flag" })).toHaveAttribute("aria-pressed", "true");
    const nav = page.getByRole("navigation", { name: "Question navigator" });
    await expect(nav.getByRole("button", { name: /Question 1 of 5: answered/ })).toBeVisible();
    await expect(nav.getByRole("button", { name: /Question 2 of 5: not answered, flagged, current question/ })).toBeVisible();
    expect(await serious(page)).toEqual([]);

    await nav.getByRole("button", { name: /Question 5 of 5/ }).click();
    await expect(page.getByRole("heading", { level: 2, name: "Question 5 of 5" })).toBeFocused();
    await page.getByRole("button", { name: "Submit exam" }).click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toContainText("4 questions have no answer and will count as incorrect.");
    await expect(dialog).toContainText("1 question is flagged for review.");
    await page.getByRole("button", { name: "Keep working" }).click();
    await expect(dialog).toHaveCount(0);
    await page.getByRole("button", { name: "Submit exam" }).click();
    await page.getByRole("button", { name: "Yes, submit" }).click();
    await page.waitForURL(/results$/);
    await expect(page.getByTestId("score")).toHaveText("20.0%");
    await expect(page.getByTestId("score-detail")).toHaveText("1 of 5 correct");
    // Review with explanations, now allowed.
    await expect(page.getByText("Why this is the correct answer").first()).toBeVisible();
    await page.getByRole("link", { name: "Flagged", exact: true }).click();
    await expect(page.getByRole("article")).toHaveCount(1);
    await page.getByRole("link", { name: "Not answered" }).click();
    await expect(page.getByRole("article")).toHaveCount(4);
    await expect(page).toHaveTitle(/Results/); // metadata streams in after a client-side navigation
    expect(await serious(page)).toEqual([]);
  });

  test("auto-submits when the time limit elapses", async ({ page }) => {
    await page.clock.install();
    await begin(page, { mode: "exam", count: 3, limit: 10 });
    await expect(page.getByRole("timer")).toContainText(/(10:00|09:5\d)/);
    await page.clock.fastForward("10:05");
    await page.waitForURL(/results$/, { timeout: 15_000 });
    await expect(page.getByTestId("score")).toBeVisible();
  });

  test("resumes an unfinished attempt with answers, flags and the same questions", async ({ page }) => {
    await begin(page, { mode: "exam", count: 5 });
    const q1 = await currentQuestion(page);
    const pick = q1.options[2]!;
    await pickOption(page, pick.text.en!);
    await page.getByRole("button", { name: "Next" }).click();
    const q2 = await currentQuestion(page);
    await page.getByRole("button", { name: "Flag for review" }).click();
    const url = page.url();

    await page.goto("/en/question-bank");
    await expect(page.getByRole("heading", { name: "Continue where you left off" })).toBeVisible();
    await page.getByRole("link", { name: "Resume" }).click();
    await expect(page).toHaveURL(url);
    await expect(page.getByRole("heading", { level: 2, name: "Question 2 of 5" })).toBeVisible();
    expect((await currentQuestion(page)).id).toBe(q2.id);
    await expect(page.getByRole("button", { name: "Remove flag" })).toBeVisible();
    await page.getByRole("button", { name: "Previous" }).click();
    await expect(page.getByRole("radio", { name: pick.text.en!, exact: false }).first()).toBeChecked();
  });

  test("keeps one learner's attempt private from another browser session", async ({ page, browser }) => {
    await begin(page, { mode: "exam", count: 3 });
    const url = page.url();
    const other = await browser.newContext();
    const p2 = await other.newPage();
    await p2.goto(url);
    // Another session cannot see the attempt: it gets the not-found page and none of the question content.
    await expect(p2.getByRole("heading", { level: 1 })).toHaveText("Page not found");
    await expect(p2.getByRole("radio")).toHaveCount(0);
    await other.close();
  });
});

test.describe("question bank: bookmarks, history and layout", () => {
  test("bookmarks a question, then practises only bookmarked questions; previous attempts are listed", async ({ page }) => {
    await begin(page, { count: 3 });
    await page.getByRole("button", { name: "Bookmark", exact: true }).click();
    await expect(page.getByRole("button", { name: "Remove bookmark" })).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "Finish and see results" }).click();
    await page.getByRole("button", { name: "Yes, submit" }).click();
    await page.waitForURL(/results$/);
    await page.goto("/en/question-bank");
    await expect(page.getByRole("table", { name: "Previous attempts" })).toBeVisible();
    await expect(page.getByRole("table").getByRole("link", { name: "View results" })).toHaveCount(1);
    await expect(page.getByText("Only questions I bookmarked (1)")).toBeVisible();
    await page.getByLabel("Only questions I bookmarked (1)").check();
    await page.locator("button[type=submit]").click();
    await page.waitForURL(/attempt\//);
    await expect(page.getByRole("heading", { level: 2, name: "Question 1 of 1" })).toBeVisible();
  });

  test("filters by topic", async ({ page }) => {
    await page.goto("/en/question-bank");
    await page.getByRole("checkbox", { name: /Renal and Metabolic Care/ }).check();
    await page.locator("#qb-count").selectOption("40");
    await page.locator("button[type=submit]").click();
    await page.waitForURL(/attempt\//);
    await expect(page.getByRole("heading", { level: 2, name: /Question 1 of 4$/ })).toBeVisible();
  });

  test("has no horizontal overflow and keeps touch targets usable on every viewport", async ({ page }) => {
    await begin(page, { count: 3 });
    const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(await overflow()).toBeLessThanOrEqual(0);
    const small = await page.locator("main button:visible, main label:has(input):visible").evaluateAll((els) =>
      els.filter((e) => { const r = e.getBoundingClientRect(); return r.height < 36; }).map((e) => (e.textContent ?? "").trim().slice(0, 30)));
    expect(small).toEqual([]);
  });
});

test.describe("question bank: Arabic and RTL", () => {
  test("renders right-to-left with Arabic chrome, Arabic content where available and a labelled English fallback", async ({ page }) => {
    await begin(page, { count: 40, locale: "ar" });
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("heading", { level: 2, name: /^السؤال 1 من 16$/ })).toBeVisible();
    let sawArabic = false, sawFallback = false;
    for (let i = 0; i < 16; i++) {
      const legend = page.locator("fieldset legend").first();
      const lang = await legend.locator(":scope > *").first().getAttribute("lang");
      if (lang === "en") { sawFallback = true; await expect(legend).toContainText("معروض بالإنجليزية"); }
      else sawArabic = true;
      if (i < 15) await page.getByRole("button", { name: "التالي" }).click();
    }
    expect(sawArabic && sawFallback).toBe(true);
    expect(await serious(page)).toEqual([]);
  });

  for (const path of ["/en/question-bank", "/ar/question-bank"]) {
    test.describe(`dark mode ${path}`, () => {
      test.use({ colorScheme: "dark" });
      test("meets contrast rules", async ({ page }) => {
        await page.goto(path);
        expect(await serious(page)).toEqual([]);
      });
    });
  }
});
