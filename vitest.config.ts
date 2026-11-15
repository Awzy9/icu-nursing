import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@icu/fixtures": path.resolve(__dirname, "packages/fixtures"), "@icu/schemas": path.resolve(__dirname, "packages/schemas/src"), "@": path.resolve(__dirname, "src"), "server-only": path.resolve(__dirname, "tests/unit/stubs/server-only.ts") } },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["tests/unit/**/*.test.{ts,tsx}"],
    css: false,
  },
});
