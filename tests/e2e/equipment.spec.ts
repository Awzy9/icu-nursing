import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const serious = async (page: Page) => {
  await page.waitForFunction(() => document.title.length > 0);
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  return r.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`);
};

test.describe("equipment learning (synthetic fixtures only)", () => {
  test("lists the eight categories, labels everything synthetic and is accessible", async ({ page }) => {
    await page.goto("/en/equipment");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Equipment and monitoring");
    await expect(page.getByText(/SYNTHETIC DEVELOPMENT FIXTURES/)).toBeVisible();
    await expect(page.getByText(/not a copy of any manufacturer/i)).toBeVisible();
    await expect(page.getByRole("heading", { level: 3 })).toHaveCount(8);
    await expect(page.getByRole("heading", { level: 2, name: "Defibrillators" })).toBeVisible();
    expect(await serious(page)).toEqual([]);
  });

  test("detail page: diagram with text alternative, keyboard part selection, progress and bookmark persist on this device", async ({ page }) => {
    await page.goto("/en/equipment/SYN-EQ-002");
    await expect(page.getByRole("img", { name: /Harbour fan speed trace/ })).toBeVisible();
    await expect(page.locator("figcaption")).toContainText("repeating wave drawn over time");
    await expect(page.getByTestId("eq-progress")).toHaveText("0 of 4 parts viewed");
    await page.getByRole("button", { name: /Peak/ }).first().focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("status").filter({ hasText: "The highest speed in one cycle." })).toBeVisible();
    await expect(page.getByTestId("eq-progress")).toHaveText("1 of 4 parts viewed");
    await page.getByRole("button", { name: "Bookmark this module" }).click();
    await expect(page.getByRole("button", { name: "Bookmarked" })).toHaveAttribute("aria-pressed", "true");
    await page.reload();
    await expect(page.getByTestId("eq-progress")).toHaveText("1 of 4 parts viewed");
    await page.goto("/en/equipment");
    await page.getByRole("checkbox", { name: "Show bookmarked only" }).check();
    await expect(page.getByRole("heading", { level: 3 })).toHaveCount(1);
    expect(await serious(page)).toEqual([]);
  });

  test("Arabic renders right-to-left with Arabic labels and is accessible", async ({ page }) => {
    await page.goto("/ar/equipment/SYN-EQ-001");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("لوحة العرض والجرس في مكتب الميناء");
    await expect(page.getByRole("heading", { level: 2, name: "أجزاء المخطط" })).toBeVisible();
    expect(await serious(page)).toEqual([]);
  });

  test("unknown modules and real draft codes are 404", async ({ page }) => {
    for (const code of ["EQ-01", "SYN-EQ-999", "nope"]) {
      const r = await page.goto(`/en/equipment/${code}`);
      expect(r?.status()).toBe(404);
    }
  });
});
