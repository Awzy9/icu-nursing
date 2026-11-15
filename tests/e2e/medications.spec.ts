import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const serious = async (page: Page) => {
  await page.waitForFunction(() => document.title.length > 0);
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  return r.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`);
};

test.describe("medication reference", () => {
  test("lists only fictional synthetic agents, labelled, with the no-dosing notice, and is accessible", async ({ page }) => {
    await page.goto("/en/medications");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Medication reference");
    await expect(page.getByText(/SYNTHETIC DEVELOPMENT FIXTURES/)).toBeVisible();
    await expect(page.getByText(/no doses, concentrations, infusion rates, titration or compatibility/i).first()).toBeVisible();
    await expect(page.getByRole("heading", { level: 3 })).toHaveCount(4);
    await expect(page.getByText("High-alert", { exact: true }).first()).toBeVisible();
    expect(await serious(page)).toEqual([]);
  });

  test("search, category, high-alert and bookmark filters work; invalid filters never error", async ({ page }) => {
    await page.goto("/en/medications");
    await page.getByRole("searchbox", { name: "Search medications" }).fill("examplol");
    await page.getByRole("button", { name: "Search" }).click();
    await expect(page.getByRole("heading", { level: 3 })).toHaveCount(1);
    await page.goto("/en/medications?category=anti-infectives");
    await expect(page.getByRole("heading", { level: 3, name: "Testocillin (fictional)" })).toBeVisible();
    await page.goto("/en/medications?highAlert=1");
    await expect(page.getByRole("heading", { level: 3 })).toHaveCount(3);
    await page.goto("/en/medications?q=zzzz-nothing");
    await expect(page.getByText(/No medications match your search/)).toBeVisible();
    await page.goto("/en/medications?category=bogus&q=%25");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Medication reference");
  });

  test("detail page separates general information from institution-specific preparation and dosing, shows monitoring, label panel, evidence and revisions", async ({ page }) => {
    await page.goto("/en/medications/SYN-MED-001");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Examplol (fictional)");
    for (const h of ["General pharmacological information", "Common administration considerations", "Institution-specific preparation", "Institution-specific dosing", "Nursing responsibilities", "Safety alerts", "Escalation", "Documentation", "Nursing monitoring and safety checklist", "Regulator label and jurisdiction", "Evidence, references and licensing", "Revision history"]) {
      await expect(page.getByRole("heading", { name: new RegExp(`^${h}`), level: 2 })).toBeVisible();
    }
    await expect(page.getByText(/follow your pharmacy's preparation standard/)).toBeVisible();
    await expect(page.getByText(/follow the prescriber's order/)).toBeVisible();
    await expect(page.getByText("No regulator label is recorded for this entry.")).toBeVisible();
    expect(await serious(page)).toEqual([]);
    await page.goto("/en/medications/NOPE-001");
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  });

  test("no page contains a dose, concentration, rate or titration expression", async ({ page, request }) => {
    for (const p of ["/en/medications", "/en/medications/SYN-MED-001", "/en/medications/SYN-MED-002", "/en/medications/SYN-MED-003", "/en/medications/SYN-MED-004"]) {
      await page.goto(p);
      // the disclaimer notices themselves name what is excluded, so they are left out of the check
      const text = await page.locator("main").evaluate((el) => { const c = el.cloneNode(true) as HTMLElement; c.querySelectorAll("[role=note]").forEach((n) => n.remove()); return c.textContent ?? ""; });
      expect(text, p).not.toMatch(/\b\d+(\.\d+)?\s?(mcg|µg|mg|units?|meq|mmol|ml)\b/i);
      expect(text, p).not.toMatch(/titrat|y-site|compatib/i);
    }
    expect((await request.get("/en/medications")).status()).toBe(200);
  });

  test("bookmarks persist and drive the bookmarked-only filter", async ({ page }) => {
    await page.goto("/en/medications/SYN-MED-004");
    const saved = page.waitForResponse((r) => r.request().method() === "POST");
    await page.getByRole("button", { name: "Bookmark" }).click();
    await saved;
    await expect(page.getByRole("button", { name: "Bookmarked" })).toHaveAttribute("aria-pressed", "true");
    await page.goto("/en/medications?bookmarked=1");
    await expect(page.getByRole("heading", { level: 3 })).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 3, name: "Mockinase (fictional)" })).toBeVisible();
  });

  test("Arabic is right-to-left, falls back visibly, and is accessible without overflow", async ({ page }) => {
    await page.goto("/ar/medications/SYN-MED-001");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("إكزامبلول (خيالي)");
    expect(await serious(page)).toEqual([]);
    await page.goto("/ar/medications");
    expect(await serious(page)).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  });

  test("dark mode and narrow screens: no overflow, accessible; navigation marks the page", async ({ page, isMobile }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    for (const p of ["/en/medications", "/en/medications/SYN-MED-002"]) {
      await page.goto(p);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
      expect(await serious(page)).toEqual([]);
    }
    await page.goto("/en/medications");
    if (isMobile || (page.viewportSize()?.width ?? 0) < 1280) await page.getByRole("button", { name: "Menu" }).click();
    await expect(page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Medications", exact: true })).toHaveAttribute("aria-current", "page");
  });
});
