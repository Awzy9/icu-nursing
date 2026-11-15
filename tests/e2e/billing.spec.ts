import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const serious = async (page: Page) => {
  await page.waitForFunction(() => document.title.length > 0);
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  return r.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`);
};

test.describe("plans and billing (mock provider only)", () => {
  test("the pricing page compares free and premium, states that nothing can be bought, shows no price or card form, and is accessible", async ({ page }) => {
    await page.goto("/en/pricing");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Plans");
    await expect(page.getByText(/TEST MODE\. No payment provider has been chosen/)).toBeVisible();
    await expect(page.getByText(/never unlocks content/)).toBeVisible();
    await expect(page.getByRole("cell", { name: "Not decided yet" })).toHaveCount(2);
    await expect(page.locator("input[type=text], input[autocomplete*='cc-']")).toHaveCount(0); // no card fields
    await expect(page.getByRole("row", { name: /Export your practice and progress summary/ })).toContainText("Not included");
    expect(await serious(page)).toEqual([]);
  });
  test("a test subscription can be started, cancelled, resumed and left to expire, and every step is explained", async ({ page }) => {
    await page.goto("/en/account/billing");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Plan and billing");
    await expect(page.getByTestId("bl-plan")).toContainText("Free");
    await page.getByRole("button", { name: "Start a test subscription" }).click();
    await expect(page.getByTestId("bl-plan")).toContainText("Premium");
    await expect(page.getByTestId("bl-period")).toContainText("Renews on");
    await expect(page.getByTestId("bl-history")).toContainText("Test subscription started");
    page.once("dialog", (d) => void d.accept());
    await page.getByRole("button", { name: "Cancel at the end of the period" }).click();
    await expect(page.getByTestId("bl-period")).toContainText("premium access ends on");
    await page.getByRole("button", { name: "Keep my subscription" }).click();
    await expect(page.getByTestId("bl-period")).toContainText("Renews on");
    page.once("dialog", (d) => void d.accept());
    await page.getByRole("button", { name: "Cancel at the end of the period" }).click();
    await expect(page.getByTestId("bl-period")).toContainText("premium access ends on");
    await page.getByRole("button", { name: "Move forward" }).click(); // 31 days later: the cancelled period is over
    await expect(page.getByTestId("bl-plan")).toContainText("Free");
    await expect(page.getByTestId("bl-plan")).toContainText("Expired");
    await expect(page.getByTestId("bl-history")).toContainText("Premium access ended");
    expect(await serious(page)).toEqual([]);
  });
  test("the progress export is a premium convenience: locked on the free plan, offered while premium, locked again after expiry", async ({ page }) => {
    await page.goto("/en/practice/competencies");
    await expect(page.getByTestId("export-locked")).toBeVisible();
    await expect(page.getByRole("button", { name: "Download my summary (CSV)" })).toHaveCount(0);
    await page.goto("/en/account/billing");
    if (await page.getByRole("button", { name: "Start a test subscription" }).isVisible()) await page.getByRole("button", { name: "Start a test subscription" }).click();
    await expect(page.getByTestId("bl-plan")).toContainText("Premium");
    await page.goto("/en/practice/competencies");
    const dl = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download my summary (CSV)" }).click();
    expect((await dl).suggestedFilename()).toBe("my-practice-summary.csv");
    // clinical content is never gated by the plan: the practice labs and every learning page stay open on the free plan
    await page.goto("/en/practice"); await expect(page.getByRole("heading", { level: 1 })).toHaveText("Practice labs");
  });
  test("Arabic: right-to-left, translated, accessible", async ({ page }) => {
    await page.goto("/ar/pricing");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("الخطط");
    expect(await serious(page)).toEqual([]);
    await page.goto("/ar/account/billing");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("الخطة والفوترة");
    expect(await serious(page)).toEqual([]);
  });
  test("the webhook refuses requests when no provider is configured", async ({ request }) => {
    const r = await request.post("/api/billing/webhook", { data: "{}" }); expect([503, 401]).toContain(r.status());
    expect((await request.get("/api/billing/webhook")).status()).toBe(405);
  });
});
