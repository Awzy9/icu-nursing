import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { loadFixtures } from "../../src/lib/question-bank/fixtures";

const fx = loadFixtures();
const serious = async (page: Page) => {
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  return r.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`);
};
const current = async (page: Page) => {
  const stem = (await page.locator("fieldset legend").first().evaluate((l) => (l.firstElementChild as HTMLElement).textContent ?? "")).trim();
  return fx.find((q) => q.stem.en === stem)!;
};
async function answerWrong(page: Page) {
  const q = await current(page);
  const o = q.options.find((x) => x.id !== q.correctOptionId)!;
  await page.getByRole("radio", { name: o.text.en!, exact: false }).first().check();
  await page.getByRole("button", { name: "Submit answer" }).click();
  await expect(page.getByText("Why this is the correct answer").first()).toBeVisible();
}

test.describe("learning hub", () => {
  test("a new learner is pointed at their first practice set, with all four areas one click away", async ({ page }) => {
    await page.goto("/en/learn");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Your learning");
    await expect(page.getByText(/SYNTHETIC DEVELOPMENT FIXTURES/)).toBeVisible();
    await expect(page.getByText("Start your first practice set")).toBeVisible();
    for (const name of ["Library", "Question bank", "Study and revision", "Cases"]) await expect(page.getByRole("heading", { level: 3, name })).toBeVisible();
    await expect(page.getByText("Nothing unfinished. Start something below.")).toBeVisible();
    expect(await serious(page)).toEqual([]);
  });

  test("after a wrong answer the hub suggests the due review, and the progress bar has a text alternative", async ({ page }) => {
    await page.goto("/en/question-bank");
    await page.locator("#qb-count").selectOption("3");
    await page.getByRole("button", { name: "Start practice" }).click();
    await page.waitForURL(/attempt\//);
    await answerWrong(page);
    await page.goto("/en/learn");
    await expect(page.getByText(/Review 1 question that is due/)).toBeVisible();
    await expect(page.getByText("A short review now keeps what you learned fresh.")).toBeVisible();
    await expect(page.getByRole("img", { name: /Questions: correct, incorrect, not yet answered: 0 correct, 1 incorrect, 15 not yet answered/ })).toBeVisible();
    await page.getByRole("link", { name: "Go" }).first().click();
    await expect(page).toHaveURL(/\/en\/study/);
    // resume list on the hub
    await page.goto("/en/learn");
    await expect(page.getByRole("heading", { name: "Continue" })).toBeVisible();
    await expect(page.getByText(/practice set|practice · 1\/3|practice · 1\/3/i).first()).toBeVisible();
  });

  test("navigation marks the current section for assistive technology and sighted users", async ({ page, isMobile }) => {
    test.skip(isMobile || (page.viewportSize()?.width ?? 0) < 1024, "desktop navigation; the mobile/tablet menu is covered below");
    await page.goto("/en/study");
    await expect(page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Study" })).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Cases" })).not.toHaveAttribute("aria-current", "page");
    await page.goto("/en/question-bank/attempt/00000000-0000-4000-8000-000000000000");
    await page.goto("/en/cases");
    await expect(page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Cases" })).toHaveAttribute("aria-current", "page");
  });

  test("the mobile and tablet menu lists every learning area and marks the current one", async ({ page, isMobile }) => {
    test.skip(!isMobile && (page.viewportSize()?.width ?? 0) > 800, "narrow viewports only");
    await page.goto("/en/study");
    await page.getByRole("button", { name: "Menu" }).click();
    const nav = page.getByRole("navigation", { name: "Main navigation" });
    for (const n of ["Library", "Learn", "Question bank", "Study", "Cases"]) await expect(nav.getByRole("link", { name: n, exact: true })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Study", exact: true })).toHaveAttribute("aria-current", "page");
  });

  test("the desktop header does not overflow at 1024px (laptop / tablet landscape)", async ({ page, isMobile }) => {
    test.skip(isMobile, "desktop-class widths");
    await page.setViewportSize({ width: 1024, height: 768 });
    for (const p of ["/en/learn", "/ar/learn"]) {
      await page.goto(p);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    }
  });

  test("results page offers to revise what was missed and starts that exact set", async ({ page }) => {
    await page.goto("/en/question-bank");
    await page.locator("#qb-count").selectOption("3");
    await page.getByRole("button", { name: "Start practice" }).click();
    await page.waitForURL(/attempt\//);
    await answerWrong(page);
    await page.getByRole("button", { name: "Finish and see results" }).click();
    await page.getByRole("button", { name: "Yes, submit" }).click();
    await page.waitForURL(/results$/);
    await expect(page.getByRole("heading", { name: "Revise what you missed" })).toBeVisible();
    await expect(page).toHaveTitle(/Results/); // metadata streams in after a client-side navigation
    expect(await serious(page)).toEqual([]);
    await page.getByRole("button", { name: /Practise these/ }).click();
    await page.waitForURL(/attempt\//);
    await expect(page.getByRole("heading", { level: 2, name: "Question 1 of 1" })).toBeVisible();
  });

  test("Arabic hub is right-to-left, accessible and has no overflow", async ({ page }) => {
    await page.goto("/ar/learn");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("تعلّمك");
    expect(await serious(page)).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  });

  test.describe("dark mode", () => {
    test.use({ colorScheme: "dark" });
    test("meets contrast rules", async ({ page }) => {
      await page.goto("/en/learn");
      expect(await serious(page)).toEqual([]);
    });
  });
});
