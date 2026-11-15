import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { loadSkillDrafts } from "../../scripts/validate-skill-drafts";

const drafts = loadSkillDrafts();

const serious = async (page: Page) => {
  await page.waitForFunction(() => document.title.length > 0);
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  return r.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`);
};

test.describe("skills library", () => {
  test("lists only synthetic samples, labelled, with the self-study notice, and is accessible", async ({ page }) => {
    await page.goto("/en/skills");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Skills library");
    await expect(page.getByText(/SYNTHETIC DEVELOPMENT FIXTURES/)).toBeVisible();
    await expect(page.getByText(/not a validated clinical standard/i).first()).toBeVisible();
    await expect(page.getByRole("heading", { level: 3 })).toHaveCount(4);
    await expect(page.getByText("Synthetic sample").first()).toBeVisible();
    expect(await serious(page)).toEqual([]);
  });

  test("search, category browsing and filters narrow the list; no match explains itself", async ({ page }) => {
    await page.goto("/en/skills");
    await page.getByRole("searchbox", { name: "Search skills" }).fill("scanner");
    await page.getByRole("button", { name: "Search" }).click();
    await expect(page).toHaveURL(/q=scanner/);
    await expect(page.getByRole("heading", { level: 3 })).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 3, name: "Preparing the ferry ticket scanner" })).toBeVisible();
    await page.goto("/en/skills?category=assessment");
    await expect(page.getByRole("heading", { level: 3 })).toHaveCount(1);
    await expect(page.getByRole("link", { name: "Assessment" }).first()).toHaveAttribute("aria-current", "true");
    await page.goto("/en/skills?q=zzzz-nothing");
    await expect(page.getByText(/No skills match your search/)).toBeVisible();
    await page.goto("/en/skills?category=not-a-category&q=%25");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Skills library"); // invalid filters are ignored, never an error page
  });

  test("detail page shows sections, evidence panel, revision history and honest empty history; unknown codes are 404", async ({ page }) => {
    await page.goto("/en/skills/SYN-SKILL-001");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Preparing the ferry ticket scanner");
    for (const h of ["Learning objectives", "Indications", "Safety considerations", "Escalation", "Documentation", "Competency checklist (self-study)", "Evidence, references and licensing", "Revision history", "Your self-study history"]) {
      await expect(page.getByRole("heading", { name: new RegExp(`^${h.replace(/[().]/g, "\\$&")}`), level: 2 })).toBeVisible();
    }
    await expect(page.getByText(/synthetic sample with no clinical evidence/)).toBeVisible();
    await expect(page.getByText("You have not practised this skill yet.")).toBeVisible();
    expect(await serious(page)).toEqual([]);
    await page.goto("/en/skills/NOPE-001");
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible(); // streamed 404: the status line is already sent
  });

  test("self-study: tick steps, persist across reload, finish with a summary that is not a pass or certificate", async ({ page }) => {
    await page.goto("/en/skills/SYN-SKILL-001");
    await page.getByRole("button", { name: "Start self-study" }).click();
    await page.waitForURL(/skills\/session\//);
    await expect(page.getByText("0 of 7 steps ticked").first()).toBeVisible();
    const first = page.getByRole("group", { name: /Clear the desk/ });
    await first.getByLabel("Done", { exact: true }).check();
    await page.getByRole("group", { name: /Confirm the scanner case/ }).getByLabel("Not sure", { exact: true }).check();
    await page.getByRole("group", { name: /Scan one test ticket/ }).getByLabel("Done", { exact: true }).check();
    await expect(page.getByText("2 of 7 steps ticked").first()).toBeVisible();
    await page.reload();
    await expect(page.getByText("2 of 7 steps ticked").first()).toBeVisible();
    await expect(page.getByRole("group", { name: /Clear the desk/ }).getByLabel("Done", { exact: true })).toBeChecked();
    expect(await serious(page)).toEqual([]);
    await page.getByRole("button", { name: "Finish self-study" }).click();
    await expect(page.getByRole("heading", { name: "Your self-study summary" })).toBeVisible();
    await expect(page.getByText(/ticked 2 of 7 steps as done and 1 as not sure/)).toBeVisible();
    await expect(page.getByText("2 of 3 critical steps ticked.")).toBeVisible();
    await expect(page.getByText(/not a pass, a competency assessment or a certificate/)).toBeVisible();
    await expect(page.getByText(/\b(passed|competent|certified)\b/i)).toHaveCount(0);
    await page.getByRole("link", { name: "Back to this skill" }).click();
    await expect(page.getByText("2 of 7 steps ticked").first()).toBeVisible(); // history
    await expect(page.getByRole("button", { name: "Study again" })).toBeVisible();
  });

  test("bookmarks persist and drive the bookmarked-only filter", async ({ page }) => {
    await page.goto("/en/skills/SYN-SKILL-002");
    const saved = page.waitForResponse((r) => r.request().method() === "POST");
    await page.getByRole("button", { name: "Bookmark" }).click();
    await saved; // the server action has finished
    await expect(page.getByRole("button", { name: "Bookmarked" })).toHaveAttribute("aria-pressed", "true");
    await page.goto("/en/skills?bookmarked=1");
    await expect(page.getByRole("heading", { level: 3 })).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 3, name: "Reading the daily weather board" })).toBeVisible();
  });

  test("an in-progress session can be resumed and discarded", async ({ page }) => {
    await page.goto("/en/skills/SYN-SKILL-003");
    await page.getByRole("button", { name: "Start self-study" }).click();
    await page.waitForURL(/skills\/session\//);
    await page.getByRole("button", { name: "Discard session" }).click();
    await page.getByRole("button", { name: "Discard session" }).last().click();
    await page.waitForURL(/\/skills\/SYN-SKILL-003$/);
    await expect(page.getByRole("button", { name: "Start self-study" })).toBeVisible();
  });

  test("Arabic is right-to-left, uses Arabic text where it exists, falls back visibly for the rest, and is accessible", async ({ page }) => {
    await page.goto("/ar/skills/SYN-SKILL-001");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("تجهيز ماسح تذاكر العبّارة");
    await expect(page.locator('main [lang="en"]').first()).toBeVisible(); // English fallback marked for screen readers
    expect(await serious(page)).toEqual([]);
    await page.goto("/ar/skills");
    expect(await serious(page)).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  });

  test("dark mode and narrow screens: no overflow, accessible", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    for (const p of ["/en/skills", "/en/skills/SYN-SKILL-004"]) {
      await page.goto(p);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
      expect(await serious(page)).toEqual([]);
    }
  });

  test("the navigation lists Skills and marks it current", async ({ page, isMobile }) => {
    await page.goto("/en/skills");
    if (isMobile || (page.viewportSize()?.width ?? 0) < 1280) await page.getByRole("button", { name: "Menu" }).click();
    await expect(page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Skills", exact: true })).toHaveAttribute("aria-current", "page");
  });

  test("no clinical skill draft appears in the skills list, search, detail routes, library search, sitemap or page source", async ({ page, request }) => {
    expect(drafts).toHaveLength(25);
    const html = await (await request.get("/en/skills")).text();
    const map = await (await request.get("/sitemap.xml")).text();
    for (const d of drafts) {
      expect(html, d.skill_id).not.toContain(d.title);
      expect(map).not.toContain(d.skill_id);
      const code = `${d.skill_id}`;
      await page.goto(`/en/skills/${code}`);
      await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
    }
    for (const q of ["arterial", "suctioning", "blood transfusion", "defibrillator", "tracheostomy"]) {
      await page.goto(`/en/skills?q=${encodeURIComponent(q)}`);
      await expect(page.getByText(/No skills match your search/)).toBeVisible();
      const lib = await (await request.get(`/en/library?q=${encodeURIComponent(q)}`)).text();
      for (const d of drafts) expect(lib).not.toContain(d.title);
    }
  });
});
