import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const serious = async (page: Page) => {
  await page.waitForFunction(() => document.title.length > 0);
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  return r.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`);
};

test.describe("account deletion (public information and demonstration mode)", () => {
  test("the public page explains how, what is deleted and what is kept, and is accessible", async ({ page }) => {
    await page.goto("/en/account-deletion");
    await expect(page.getByRole("heading", { level: 1, name: "Delete your account and data" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "How to delete your account" })).toBeVisible();
    await expect(page.getByText(/no name or email address/i)).toBeVisible();
    await expect(page.getByText("Staff and reviewer accounts")).toBeVisible();
    await expect(page.getByRole("link", { name: "Go to account deletion" })).toHaveAttribute("href", "/en/account/delete");
    expect(await serious(page)).toEqual([]);
  });
  test("Arabic is right-to-left, fully translated and accessible", async ({ page }) => {
    await page.goto("/ar/account-deletion");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("heading", { level: 1, name: "حذف حسابك وبياناتك" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "ما الذي يُحذف" })).toBeVisible();
    expect(await serious(page)).toEqual([]);
  });
  test("every page links to it from the footer", async ({ page }) => {
    await page.goto("/en");
    await page.getByRole("contentinfo").getByRole("link", { name: "Delete your account and data" }).click();
    await expect(page).toHaveURL(/\/en\/account-deletion$/);
  });
  test("the in-account route is a safe, clear message in demonstration mode (no backend), and the confirmation page is public", async ({ page }) => {
    await page.goto("/en/account/delete");
    await expect(page.getByText(/needs a configured backend/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Delete my account permanently" })).toHaveCount(0);
    await page.goto("/en/account-deleted");
    await expect(page.getByRole("heading", { level: 1, name: "Your account has been deleted" })).toBeVisible();
    expect(await serious(page)).toEqual([]);
  });
});
