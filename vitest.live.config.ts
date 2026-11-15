import { defineConfig } from "vitest/config";
import path from "node:path";

// LIVE integration tests against the approved DEV Supabase project (see scripts/live/mgmt.ts for the pinned ref).
// Run: NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=... npm run test:live   (needs .env.local from scripts/live/write-env.ts)
export default defineConfig({
  resolve: { alias: { "@icu/schemas": path.resolve(__dirname, "packages/schemas/src"), "@": path.resolve(__dirname, "src") } },
  test: {
    environment: "node",
    include: ["tests/live/**/*.live.test.ts"],
    testTimeout: 90_000,
    hookTimeout: 180_000,
    fileParallelism: false,
    sequence: { concurrent: false },
  },
});
