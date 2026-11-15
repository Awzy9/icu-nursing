import { defineConfig } from "vitest/config";
import path from "node:path";

// Database tests: real PostgreSQL, migrations applied from supabase/migrations.
export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: {
    environment: "node",
    include: ["tests/db/**/*.test.ts"],
    globalSetup: ["./tests/db/global-setup.ts"],
    testTimeout: 30000,
    hookTimeout: 60000,
    fileParallelism: false,
  },
});
