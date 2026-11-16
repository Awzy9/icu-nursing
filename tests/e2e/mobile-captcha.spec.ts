import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const serious = async (page: Page) => {
  await page.waitForFunction(() => document.title.length > 0);
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  return r.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`);
};

// Demo mode has no CAPTCHA site key, so the bridge page must say so plainly and never post a token.
test.describe("native CAPTCHA bridge page (/mobile-captcha)", () => {
  for (const [locale, dir] of [["en", "ltr"], ["ar", "rtl"]] as const) {
    test(`${locale}: unavailable without a site key, noindex, correct direction, accessible, posts nothing`, async ({ page }) => {
      await page.addInitScript(() => { (window as unknown as { __posts: string[] }).__posts = []; (window as unknown as { ReactNativeWebView: unknown }).ReactNativeWebView = { postMessage: (d: string) => (window as unknown as { __posts: string[] }).__posts.push(d) }; });
      const res = await page.goto(`/${locale}/mobile-captcha`);
      expect(res?.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("dir", dir);
      await expect(page.getByRole("alert").filter({ hasText: /\S/ })).toBeVisible();
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
      expect(await page.evaluate(() => (window as unknown as { __posts: string[] }).__posts)).toEqual([]);
      expect(await serious(page)).toEqual([]);
    });
  }
  test("shows no site navigation or content, only the challenge", async ({ page }) => {
    await page.goto("/en/mobile-captcha");
    await expect(page.locator("a, nav, header, footer")).toHaveCount(0);
  });
});
