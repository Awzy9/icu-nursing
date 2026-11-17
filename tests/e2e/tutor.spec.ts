import { expect, test } from "@playwright/test";
for (const locale of ["en", "ar"]) {
  test("AI assistant is removed in " + locale, async ({ page }) => {
    await page.goto("/" + locale + "/learn");
    await expect(page.locator('header a[href$="/tutor"]')).toHaveCount(0);
    await page.goto("/" + locale + "/tutor");
    await expect(page.getByRole("heading", { name: /404/ })).toBeVisible();
  });
}
