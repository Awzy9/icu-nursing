import { defineConfig } from "@playwright/test";

// UI tests against the real app AND the approved dev Supabase project. Build first: npm run build:live
// (Next.js inlines the public Supabase URL/key from .env.local at build time.)
const port = 3100;
const executablePath = process.env.PW_CHROMIUM_PATH || undefined;

export default defineConfig({
  testDir: "tests/live-e2e",
  timeout: 120_000,
  workers: 1,
  fullyParallel: false,
  reporter: [["list"]],
  use: { baseURL: `http://localhost:${port}`, trace: "off", launchOptions: { executablePath } },
  projects: [{ name: "desktop", use: { viewport: { width: 1280, height: 900 }, launchOptions: { executablePath } } }],
  webServer: {
    command: `npx next start -p ${port}`,
    url: `http://localhost:${port}/api/health`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: { NEXT_DIST_DIR: ".next-live", NODE_USE_ENV_PROXY: "1", NODE_EXTRA_CA_CERTS: process.env.NODE_EXTRA_CA_CERTS ?? "/root/.ccr/ca-bundle.crt" },
  },
});
