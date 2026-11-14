import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const pages = ["/en", "/ar", "/en/library", "/ar/library", "/en/library/demo-renal-metabolic", "/en/login", "/en/register", "/en/coming-soon/simulation"];

test.describe("public pages", () => {
  for (const path of pages) {
    test(`no serious accessibility violations: ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator("h1").first()).toBeVisible();
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
      const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`)).toEqual([]);
    });

    test(`no horizontal overflow: ${path}`, async ({ page }) => {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
      expect(overflow).toBe(false);
    });
  }

  test("English is LTR and Arabic is RTL", async ({ page }) => {
    await page.goto("/en");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await page.goto("/ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  });

  test("shows the demonstration banner and disclaimer", async ({ page }) => {
    await page.goto("/en");
    await expect(page.getByText(/Demonstration mode/)).toBeVisible();
    await expect(page.getByText(/Educational use only/).first()).toBeVisible();
  });

  test("home lists ten domains and navigates into the library", async ({ page }) => {
    await page.goto("/en");
    await expect(page.locator("section[aria-labelledby='domains-h'] ol > li")).toHaveCount(10);
    await page.getByRole("link", { name: "Respiratory and Airway Management" }).first().click();
    await expect(page).toHaveURL(/library\?domain=respiratory-airway/);
    await expect(page.getByRole("link", { name: /Demonstration topic: Respiratory/ })).toBeVisible();
  });

  test("library search and filters work", async ({ page }) => {
    await page.goto("/en/library");
    await page.getByLabel("Search topics").fill("renal");
    await page.getByRole("button", { name: "Apply filters" }).click();
    await expect(page.getByRole("status").filter({ hasText: "1 topic" })).toBeVisible();
    await page.getByLabel("Search topics").fill("zzzzz");
    await page.getByRole("button", { name: "Apply filters" }).click();
    await expect(page.getByText("No topics match your filters.")).toBeVisible();
  });

  test("topic page shows scope labels, draft guideline label and demo review status", async ({ page }) => {
    await page.goto("/en/library/demo-renal-metabolic");
    await expect(page.getByRole("heading", { name: "Nursing actions and scope" })).toBeVisible();
    await expect(page.getByText("Needs an order or approved protocol")).toBeVisible();
    await expect(page.getByText("DRAFT guideline — not final")).toBeVisible();
    await expect(page.getByText(/not clinically reviewed/i).first()).toBeVisible();
  });

  test("unknown topic and unknown feature return 404", async ({ page }) => {
    expect((await page.goto("/en/library/does-not-exist"))?.status()).toBe(404);
    expect((await page.goto("/en/coming-soon/unknown"))?.status()).toBe(404);
    expect((await page.goto("/en/nothing-here"))?.status()).toBe(404);
  });

  test("security headers are present", async ({ request }) => {
    const res = await request.get("/en");
    const h = res.headers();
    expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["x-frame-options"]).toBe("DENY");
    expect(h["x-powered-by"]).toBeUndefined();
  });

  test("protected pages need an account in demo mode (no crash)", async ({ page }) => {
    const res = await page.goto("/en/dashboard");
    expect(res?.status()).toBeLessThan(500);
  });
});
