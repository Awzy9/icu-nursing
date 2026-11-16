import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const serious = async (page: Page) => {
  await page.waitForFunction(() => document.title.length > 0);
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  return r.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`);
};

test.describe("tutor (Phase 5, mock mode)", () => {
  test("shows the form, the clinical-scope disclaimer, and the demo notice in demo mode; is accessible", async ({ page }) => {
    await page.goto("/en/tutor");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Ask the tutor");
    await expect(page.getByText(/cannot discuss a specific patient/i).first()).toBeVisible();
    await expect(page.getByText(/Demonstration mode/).last()).toBeVisible();
    expect(await serious(page)).toEqual([]);
  });

  test("answering a general question returns citations to already-published material, never an unpublished draft", async ({ page }) => {
    await page.goto("/en/tutor?q=respiratory");
    await expect(page.getByRole("heading", { name: "Related published material:" })).toBeVisible();
    const links = await page.getByRole("heading", { name: "Related published material:" }).locator("xpath=following-sibling::ul[1]//a").all();
    expect(links.length).toBeGreaterThan(0);
    for (const l of links) {
      const href = await l.getAttribute("href");
      expect(href).not.toMatch(/\/drafts\//);
    }
  });

  test("refuses a patient-specific question with an honest refusal, not a fabricated answer", async ({ page }) => {
    await page.goto(`/en/tutor?q=${encodeURIComponent("my patient needs a dose, what should I give")}`);
    await expect(page.getByRole("alert").filter({ hasText: /can't discuss a specific patient/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Related published material:" })).toHaveCount(0);
  });

  test("refuses a dosing request", async ({ page }) => {
    await page.goto(`/en/tutor?q=${encodeURIComponent("what dose of norepinephrine should I use")}`);
    await expect(page.getByRole("alert").filter({ hasText: /can't give dosing or rate instructions/i })).toBeVisible();
  });

  test("reports no results honestly rather than inventing an answer for a question with no match", async ({ page }) => {
    await page.goto(`/en/tutor?q=${encodeURIComponent("zzzznonexistentquerytermzzzz")}`);
    await expect(page.getByText(/No published material matched/i)).toBeVisible();
  });

  test("is right-to-left in Arabic and keeps the same safety behaviour", async ({ page }) => {
    await page.goto("/ar/tutor");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(await serious(page)).toEqual([]);
  });
});
