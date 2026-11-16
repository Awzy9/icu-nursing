import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PORT ?? 3100);
// Use the preinstalled Chromium when present (CI installs its own via `playwright install`).
const executablePath = process.env.PW_CHROMIUM_PATH || undefined;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: { baseURL: `http://localhost:${port}`, trace: "off", launchOptions: { executablePath } },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], launchOptions: { executablePath } } },
    { name: "tablet", use: { viewport: { width: 768, height: 1024 }, hasTouch: true, launchOptions: { executablePath } } },
    { name: "mobile", use: { viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true, userAgent: devices["Pixel 7"].userAgent, launchOptions: { executablePath } } },
  ],
  webServer: {
    command: `npx next start -p ${port}`,
    url: `http://localhost:${port}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { NEXT_PUBLIC_SUPABASE_URL: "", NEXT_PUBLIC_SUPABASE_ANON_KEY: "" },
  },
});
