import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const serious = async (page: import("@playwright/test").Page) => {
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  return r.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`);
};

test.describe("dark mode", () => {
  test.use({ colorScheme: "dark" });
  for (const path of ["/en", "/ar", "/en/library", "/en/library/demo-renal-metabolic", "/en/login"]) {
    test(`meets contrast and a11y rules: ${path}`, async ({ page }) => {
      await page.goto(path);
      expect(await serious(page)).toEqual([]);
    });
  }
});

test.describe("keyboard and navigation", () => {
  test("skip link moves focus to the main content", async ({ page }) => {
    await page.goto("/en");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Skip to main content" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("#main")).toBeFocused();
  });

  test("language switcher changes locale and direction", async ({ page }) => {
    await page.goto("/en/library");
    const language = page.getByRole("combobox", { name: "Language" });
    if (!(await language.isVisible())) {
      await page.getByRole("button", { name: "Menu", exact: true }).click();
      await expect(page.locator("#mobile-menu").getByLabel("Language")).toBeVisible();
    }
    await language.selectOption("ar");
    await expect(page).toHaveURL(/\/ar\/library/);
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("مكتبة المعرفة");
  });

  test("mobile menu opens, lists planned features as 'soon', and closes with Escape", async ({ page, isMobile }) => {
    test.skip(!isMobile, "mobile only");
    await page.goto("/en");
    const toggle = page.getByRole("button", { name: "Menu" });
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("link", { name: /Simulation/ })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(toggle).toBeFocused();
  });

  test("future features are honest placeholders, not fake functionality", async ({ page }) => {
    await page.goto("/en/coming-soon/simulation");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("coming in a later phase");
  });
  test("a feature that has shipped (the tutor) is no longer a placeholder", async ({ page }) => {
    const res = await page.goto("/en/coming-soon/assistant");
    expect(res?.status()).toBe(404);
  });
});

test.describe("error handling and input safety", () => {
  test("hostile query strings do not break or reflect into the page", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`/en/library?q=${encodeURIComponent("<script>window.__x=1</script>")}&level=nope&domain=../../etc&q=${"a".repeat(5000)}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => (window as unknown as { __x?: number }).__x)).toBeUndefined();
    expect(errors).toEqual([]);
  });

  test("login never keeps an external 'next' redirect target", async ({ page }) => {
    await page.goto(`/en/login?next=${encodeURIComponent("https://evil.example/phish")}`);
    await expect(page.locator('input[name="next"]')).toHaveValue("/dashboard");
    await page.goto(`/en/login?next=${encodeURIComponent("//evil.example")}`);
    await expect(page.locator('input[name="next"]')).toHaveValue("/dashboard");
  });

  test("the check-email page escapes the address it displays", async ({ page }) => {
    await page.goto(`/en/check-email?email=${encodeURIComponent("<img src=x onerror=window.__y=1>")}`);
    expect(await page.evaluate(() => (window as unknown as { __y?: number }).__y)).toBeUndefined();
    await expect(page.locator("main p[role='status']")).toContainText("<img");
  });

  test("auth forms explain that accounts are unavailable in demonstration mode", async ({ page }) => {
    await page.goto("/en/register");
    await page.getByLabel("Display name").fill("Test");
    await page.getByLabel("Email address").fill("test@example.org");
    await page.getByLabel("Password", { exact: true }).fill("a-very-long-password");
    await page.getByLabel("Confirm password").fill("a-very-long-password");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.locator("main").getByRole("alert")).toContainText("unavailable in demonstration mode");
  });

  test("unknown routes show the localized not-found page", async ({ page }) => {
    const res = await page.goto("/ar/nothing-here");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("الصفحة غير موجودة");
  });

  test("health endpoint reports mode without leaking configuration", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(await res.json()).toEqual({ status: "ok", mode: "demo", captcha: false });
    expect(res.headers()["cache-control"]).toContain("no-store");
  });
});

test.describe("performance budgets (local, production build)", () => {
  test("home page ships a small JavaScript payload and renders quickly", async ({ page }) => {
    let jsBytes = 0;
    page.on("response", async (r) => {
      if (r.url().endsWith(".js")) jsBytes += Number(r.headers()["content-length"] ?? 0) || (await r.body().catch(() => Buffer.alloc(0))).length;
    });
    await page.goto("/en", { waitUntil: "networkidle" });
    const lcp = await page.evaluate(() => new Promise<number>((resolve) => {
      new PerformanceObserver((l) => resolve(l.getEntries().at(-1)!.startTime)).observe({ type: "largest-contentful-paint", buffered: true });
      setTimeout(() => resolve(0), 1500);
    }));
    expect(jsBytes).toBeLessThan(400_000);
    expect(lcp).toBeLessThan(2500);
  });
});

test.describe("content security policy", () => {
  test("pages hydrate with no CSP violations and every inline script carries the request nonce", async ({ page }) => {
    const violations: string[] = [];
    page.on("console", (m) => { if (/content security policy/i.test(m.text())) violations.push(m.text()); });
    for (const path of ["/en", "/ar/library", "/en/library/demo-renal-metabolic", "/en/login"]) {
      const res = await page.goto(path, { waitUntil: "networkidle" });
      const nonce = /'nonce-([^']+)'/.exec(res!.headers()["content-security-policy"]!)![1]!;
      const bad = await page.evaluate((n) => [...document.querySelectorAll("script:not([src])")].filter((s) => (s as HTMLScriptElement).nonce !== n && s.getAttribute("type") !== "application/json").length, nonce);
      expect(bad, path).toBe(0);
    }
    expect(violations).toEqual([]);
  });

  test("each request gets a different nonce, and interactive features still work under the policy", async ({ page, request }) => {
    const a = (await request.get("/en")).headers()["content-security-policy"];
    const b = (await request.get("/en")).headers()["content-security-policy"];
    expect(a).not.toEqual(b);
    await page.goto("/en/library");
    const language = page.getByRole("combobox", { name: "Language" });
    if (!(await language.isVisible())) {
      await page.getByRole("button", { name: "Menu", exact: true }).click();
      await expect(page.locator("#mobile-menu").getByLabel("Language")).toBeVisible();
    }
    await language.selectOption("ar"); // client-side JS must run
    await expect(page).toHaveURL(/\/ar\/library/);
  });
});
