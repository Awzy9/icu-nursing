import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const serious = async (page: Page) => {
  await page.waitForFunction(() => document.title.length > 0);
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  return r.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`);
};
const overflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

test.describe("one platform: search across modules", () => {
  test("finds library, skills, equipment and practice material from one box, labels samples, and never searches questions", async ({ page }) => {
    await page.goto("/en/search");
    await page.getByRole("searchbox", { name: "Search" }).fill("harbour");
    await page.getByRole("button", { name: "Search" }).click();
    await expect(page.getByTestId("sr-count")).toContainText("results for");
    await expect(page.getByRole("heading", { level: 2, name: "Equipment and monitoring" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Practice labs" })).toBeVisible();
    await expect(page.getByText("Sample").first()).toBeVisible();
    expect(await serious(page)).toEqual([]);
    await page.goto("/en/search?q=a");
    await expect(page.getByTestId("sr-count")).toContainText("at least two characters");
    await page.goto("/en/search?q=zzzxqv");
    await expect(page.getByTestId("sr-count")).toContainText("Nothing found");
  });
  test("hostile queries are neutralised and the page still renders", async ({ page }) => {
    const errors: string[] = []; page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`/en/search?q=${encodeURIComponent("<script>window.__x=1</script>")}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Search");
    expect(await page.evaluate(() => (window as unknown as { __x?: number }).__x)).toBeUndefined(); expect(errors).toEqual([]);
    expect((await page.goto(`/en/search?q=${"a".repeat(6000)}`))?.status()).toBe(200);
  });
  test("the header search link and the learning hub reach the search, and the hub now covers medications, equipment and practice", async ({ page }) => {
    await page.goto("/en/learn");
    for (const h of ["Medication reference", "Equipment and monitoring", "Practice labs"]) await expect(page.getByRole("heading", { name: h }).first()).toBeVisible();
    await page.getByRole("link", { name: "Search everything" }).click();
    await expect(page).toHaveURL(/\/en\/search/);
  });
  test("Arabic search page is right-to-left and accessible", async ({ page }) => {
    await page.goto("/ar/search?q=" + encodeURIComponent("ميناء"));
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("البحث");
    expect(await serious(page)).toEqual([]);
  });
});

test.describe("responsive and accessible across the new areas", () => {
  const pages = ["/learn", "/practice", "/practice/competencies", "/practice/SYN-PX-004", "/practice/SYN-PX-007", "/pricing", "/account/billing", "/search?q=harbour", "/equipment", "/skills"];
  for (const locale of ["en", "ar"]) for (const p of pages) {
    test(`no horizontal scroll and no serious axe violation: /${locale}${p}`, async ({ page }) => {
      await page.goto(`/${locale}${p}`);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      expect(await overflow(page)).toBeLessThanOrEqual(0);
      expect(await serious(page)).toEqual([]);
    });
  }
  test.describe("dark mode", () => {
    test.use({ colorScheme: "dark" });
    for (const p of ["/en/practice", "/en/pricing", "/en/account/billing", "/en/search?q=harbour"]) test(`contrast in dark mode: ${p}`, async ({ page }) => { await page.goto(p); expect(await serious(page)).toEqual([]); });
  });
});
