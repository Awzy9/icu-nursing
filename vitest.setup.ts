import "@testing-library/jest-dom/vitest";
import { existsSync, writeFileSync } from "node:fs";
import path from "node:path";

// src/lib/working/index.ts reads the pre-built content/working-catalog.json - a prebuild artifact,
// not checked in. Unit tests run before `npm run build`, so build it here if a fresh checkout hasn't yet.
const workingCatalogPath = path.join(process.cwd(), "content", "working-catalog.json");
if (!existsSync(workingCatalogPath)) {
  const { buildWorkingContent } = await import("./scripts/build-working-content");
  writeFileSync(workingCatalogPath, JSON.stringify(buildWorkingContent()));
}
