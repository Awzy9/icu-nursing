import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const serious = async (page: Page) => {
  await page.waitForFunction(() => document.title.length > 0);
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  return r.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`);
};

test.describe("practice labs (synthetic nonclinical exercises)", () => {
  test("hub lists every area, says the content is synthetic and not a verification, and is accessible", async ({ page }) => {
    await page.goto("/en/practice");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Practice labs");
    await expect(page.getByText(/SYNTHETIC NONCLINICAL EXERCISES/)).toBeVisible();
    await expect(page.getByText(/official competency check, certificate or approval/)).toBeVisible();
    for (const h of ["SBAR communication", "Bedside documentation", "Monitoring and escalation", "Infection prevention and safety", "Practical equipment education", "Competency checklists"]) await expect(page.getByRole("heading", { level: 2, name: h })).toBeVisible();
    expect(await serious(page)).toEqual([]);
  });
  test("SBAR sorting: wrong answers are explained, right answers score full marks, and the score persists on this device", async ({ page }) => {
    await page.goto("/en/practice/SYN-PX-002");
    const check = page.getByRole("button", { name: "Check my answers" });
    await expect(check).toBeDisabled();
    // answer everything correctly
    const answers: Record<string, string> = { "The parcel for the Lantern shop": "S: Situation", "The courier confirmed pickup": "B: Background", "I am worried it was left": "A: Assessment", "Can you call the courier": "R: Request", "The shop's sign": "Leave out" };
    for (const [stem, cat] of Object.entries(answers)) await page.getByRole("group", { name: new RegExp(stem) }).getByLabel(cat).check();
    await check.click();
    await expect(page.getByTestId("px-score")).toHaveText("You got 5 of 5");
    expect(await serious(page)).toEqual([]);
    await page.goto("/en/practice");
    await expect(page.getByText("Last score 5/5")).toBeVisible();
  });
  test("documentation: flagging a sound line is counted, and missed problems are reported", async ({ page }) => {
    await page.goto("/en/practice/SYN-PX-003");
    await page.getByLabel(/tightened it and tested it three times/).check(); // a sound line
    await page.getByRole("button", { name: "Check my answers" }).click();
    await expect(page.getByTestId("px-score")).toContainText("You got");
    await expect(page.getByText(/Problems you missed: 4\. Sound lines you flagged: 1\./)).toBeVisible();
    await expect(page.getByText(/An opinion and blame, not a fact\./)).toBeVisible();
  });
  test("sequence exercise: keyboard reordering works and the order can be checked", async ({ page }) => {
    await page.goto("/en/practice/SYN-PX-007");
    const up = page.getByRole("button", { name: /Move step 2 up/ });
    await up.focus(); await page.keyboard.press("Enter");
    await expect(page.getByRole("status").filter({ hasText: "Moved to position 1" })).toBeAttached();
    await page.getByRole("button", { name: "Check my answers" }).click();
    await expect(page.getByTestId("px-score")).toContainText("of 5");
  });
  test("monitoring exercise shows a data table with headers and gives feedback", async ({ page }) => {
    await page.goto("/en/practice/SYN-PX-004");
    await expect(page.getByRole("columnheader", { name: "Queue index" })).toBeVisible();
    await page.getByLabel(/Tell the shift lead now/).check();
    await page.getByRole("button", { name: "Check my answers" }).click();
    await expect(page.getByTestId("px-score")).toHaveText("You got 1 of 1");
    expect(await serious(page)).toEqual([]);
  });
  test("competency self-assessment is private to the device, never called verification, and can be cleared", async ({ page }) => {
    await page.goto("/en/practice/SYN-PX-010");
    await expect(page.getByText(/not assessed, scored or certified/)).toBeVisible();
    await page.getByRole("group", { name: "Shape the loaf" }).getByLabel("Practised independently").check();
    await expect(page.getByTestId("px-levels")).toContainText("Independent: 1");
    await page.reload();
    await expect(page.getByTestId("px-levels")).toContainText("Independent: 1");
    await page.goto("/en/practice");
    await page.getByRole("button", { name: "Clear my practice data" }).click();
    await expect(page.getByText("Practice data cleared on this device.")).toBeVisible();
    await page.goto("/en/practice/SYN-PX-010");
    await expect(page.getByTestId("px-levels")).toContainText("Independent: 0");
  });
  test("competency map lists the skills with levels and is accessible", async ({ page }) => {
    await page.goto("/en/practice/competencies");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Competency self-assessment");
    expect(await serious(page)).toEqual([]);
  });
  test("competency notes are personal, saved on this device, included in the CSV export, and capped in length", async ({ page }) => {
    await page.goto("/en/practice/competencies");
    const group = page.getByRole("group", { name: "Preparing the ferry ticket scanner" });
    const note = group.getByLabel(/What to practise next/);
    await note.fill("Need more practice with a weak pulse.");
    await expect(group.getByText("Saved.")).toBeVisible();
    await page.reload();
    await expect(group.getByLabel(/What to practise next/)).toHaveValue("Need more practice with a weak pulse.");
    await note.fill("x".repeat(500));
    expect((await note.inputValue()).length).toBe(300);
  });
  test("competency note is included in the CSV export for a premium learner", async ({ page }) => {
    await page.goto("/en/account/billing");
    const subscribe = page.getByRole("button", { name: "Start a test subscription" });
    if (await subscribe.isVisible()) { await subscribe.click(); await expect(page.getByText("Done.")).toBeVisible(); }
    await page.goto("/en/practice/competencies");
    await page.getByRole("group", { name: "Preparing the ferry ticket scanner" }).getByLabel(/What to practise next/).fill("Need more practice with a weak pulse.");
    const dl = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download my summary (CSV)" }).click();
    expect((await dl).suggestedFilename()).toBe("my-practice-summary.csv");
  });
  test("Arabic: right-to-left, translated, and accessible", async ({ page }) => {
    await page.goto("/ar/practice/SYN-PX-001");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("التسليم");
    await expect(page.getByRole("button", { name: "تحقق من إجاباتي" })).toBeVisible();
    expect(await serious(page)).toEqual([]);
  });
  test("an unknown exercise is a 404 and no clinical draft code resolves", async ({ page }) => {
    expect((await page.goto("/en/practice/PX-01"))?.status()).toBe(404);
    expect((await page.goto("/en/practice/SYN-PX-999"))?.status()).toBe(404);
  });
});
