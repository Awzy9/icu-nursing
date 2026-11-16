import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { loadFixtures } from "../../src/lib/question-bank/fixtures";

const fx = loadFixtures();
const serious = async (page: Page) => {
  await page.waitForFunction(() => document.title.length > 0); // metadata streams in after a client-side navigation; axe needs a title
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  return r.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`);
};
const current = async (page: Page) => {
  const stem = (await page.locator("fieldset legend").first().evaluate((l) => (l.firstElementChild as HTMLElement).textContent ?? "")).trim();
  return fx.find((q) => q.stem.en === stem || q.stem.ar === stem)!;
};
async function answer(page: Page, right: boolean) {
  const q = await current(page);
  const o = right ? q.options.find((x) => x.id === q.correctOptionId)! : q.options.find((x) => x.id !== q.correctOptionId)!;
  await page.getByRole("radio", { name: o.text.en!, exact: false }).first().check();
  await page.getByRole("button", { name: "Submit answer" }).click();
  await expect(page.getByText("Why this is the correct answer").first()).toBeVisible();
}
async function practise(page: Page, count: number) {
  await page.goto("/en/question-bank");
  await page.locator("#qb-count").selectOption(String(count));
  await page.locator("form button[type=submit]").click();
  await page.waitForURL(/attempt\/[0-9a-f-]{36}$/);
}
const num = async (page: Page, id: string) => Number(await page.getByTestId(id).textContent());

test.describe("study mode", () => {
  test("an empty learner sees zero counters, the schedule explanation and no history", async ({ page }) => {
    await page.goto("/en/study");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Study and revision");
    await expect(page.getByText(/SYNTHETIC DEVELOPMENT FIXTURES/)).toBeVisible();
    expect(await num(page, "due-count")).toBe(0);
    await expect(page.getByRole("button", { name: /Review due questions/ })).toBeDisabled();
    await expect(page.getByText("No answers yet")).toBeVisible();
    await expect(page.getByText(/There is no hidden algorithm/)).toBeVisible();
    expect(await serious(page)).toEqual([]);
  });

  test("wrong answers become due and revisable; fixing them clears the counters; history records everything", async ({ page }) => {
    await practise(page, 5);
    await answer(page, false);
    await page.getByRole("button", { name: "Flag for review" }).click();
    await page.getByRole("button", { name: "Next" }).click();
    await answer(page, false);
    await page.getByRole("button", { name: "Bookmark", exact: true }).click();
    await page.getByRole("button", { name: "Next" }).click();
    await answer(page, true);
    await page.goto("/en/study");
    expect(await num(page, "due-count")).toBe(2); // two wrong answers are due immediately; the correct one is due tomorrow
    expect(await num(page, "count-incorrect")).toBe(2);
    expect(await num(page, "count-flagged")).toBe(1);
    expect(await num(page, "count-bookmarked")).toBe(1);
    await expect(page.getByText("Next review:")).toBeVisible();
    await expect(page.getByRole("table", { name: "Revision history" }).locator("tbody tr")).toHaveCount(3);
    expect(await serious(page)).toEqual([]);

    await page.getByRole("button", { name: /Review due questions/ }).click();
    await page.waitForURL(/attempt\//);
    await expect(page.getByRole("heading", { level: 2, name: "Question 1 of 2" })).toBeVisible();
    await answer(page, true);
    await page.getByRole("button", { name: "Next" }).click();
    await answer(page, true);
    await page.getByRole("button", { name: "Finish and see results" }).click();
    await page.getByRole("button", { name: "Yes, submit" }).click();
    await page.waitForURL(/results$/);
    await expect(page.getByTestId("score")).toHaveText("100.0%");

    await page.goto("/en/study");
    expect(await num(page, "due-count")).toBe(0);
    expect(await num(page, "count-incorrect")).toBe(0);
    await expect(page.getByRole("table", { name: "Revision history" }).locator("tbody tr")).toHaveCount(5);
    await expect(page.getByText("Box 2").first()).toBeVisible();
  });

  test("flagged and bookmarked sets start a revision attempt over exactly those questions", async ({ page }) => {
    await practise(page, 5);
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByRole("button", { name: "Flag for review" }).click();
    await page.getByRole("button", { name: "Bookmark", exact: true }).click();
    await page.goto("/en/study");
    await page.getByRole("heading", { name: "Flagged" }).locator("xpath=ancestor::li").getByRole("button", { name: /Practise these/ }).click();
    await page.waitForURL(/attempt\//);
    await expect(page.getByRole("heading", { level: 2, name: "Question 1 of 1" })).toBeVisible();
  });

  test("keeps one learner's study data private from another session", async ({ page, browser }) => {
    await practise(page, 3);
    await answer(page, false);
    const other = await browser.newContext();
    const p2 = await other.newPage();
    await p2.goto("/en/study");
    expect(await num(p2, "due-count")).toBe(0);
    await expect(p2.getByText("No answers yet")).toBeVisible();
    await other.close();
  });
});

test.describe("revision sheets", () => {
  test("lists published topics (labelled synthetic here) and shows key points, scope-labelled actions and the synthetic notice", async ({ page }) => {
    await page.goto("/en/study/sheets");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Key-point revision sheets");
    await expect(page.getByText("Synthetic demo", { exact: true }).first()).toBeVisible();
    await page.getByRole("link", { name: /Open sheet/ }).first().click();
    await expect(page.getByRole("heading", { name: "Key points to remember" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Warning signs and escalation" })).toBeVisible();
    await expect(page.getByText("Synthetic demonstration content. Not clinically reviewed.").first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Nursing actions and scope" })).toBeVisible();
    expect(await serious(page)).toEqual([]);
  });
  test("unknown sheets and hostile slugs return not found", async ({ page }) => {
    await page.goto("/en/study/sheets/%3Cscript%3E");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Page not found");
  });
});

test.describe("study: Arabic, dark mode and layout", () => {
  test("renders right-to-left in Arabic and keeps a clean accessibility report", async ({ page }) => {
    await page.goto("/ar/study");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("الدراسة والمراجعة");
    expect(await serious(page)).toEqual([]);
    await page.goto("/ar/study/sheets");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("أوراق مراجعة النقاط الرئيسية");
    expect(await serious(page)).toEqual([]);
  });
  test.describe("dark mode", () => {
    test.use({ colorScheme: "dark" });
    test("meets contrast rules", async ({ page }) => {
      for (const p of ["/en/study", "/en/study/sheets"]) { await page.goto(p); expect(await serious(page)).toEqual([]); }
    });
  });
  test("has no horizontal overflow", async ({ page }) => {
    await page.goto("/en/study");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  });
});
