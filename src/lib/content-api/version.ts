import "server-only";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { workingContent, workingEditionEnabled } from "@/lib/working";

// A stable short hash of the full catalog, so clients (the mobile app) can cheaply detect
// "has the content changed since I last cached it" without re-downloading or re-diffing the
// whole catalog on every check.
let cachedVersion: string | undefined;
export function contentVersion(): string {
  if (!workingEditionEnabled()) return "disabled";
  if (cachedVersion) return cachedVersion;
  const hash = createHash("sha256").update(JSON.stringify(workingContent())).digest("hex").slice(0, 16);
  cachedVersion = hash;
  return hash;
}

// Specialized lab datasets live as separate JSON files alongside the catalog, each a flat array
// of records. Whitelisted by exact name only - never accept an arbitrary filename from the
// request path. working-case-visuals.json and working-crrt.json are structured lookup/config
// objects, not arrays of records, so they are not served through this array-shaped list (see
// GET /api/content/case-visuals and GET /api/content/crrt instead).
export const LAB_DATASETS: Record<string, string> = {
  ecg: "working-ecg.json",
  abg: "working-abg.json",
  "gcs-cases": "working-gcs-cases.json",
  "news2-cases": "working-news2-cases.json",
  defib: "working-defib.json",
  transfusion: "working-transfusion.json",
  aline: "working-aline.json",
  "infusion-cases": "working-infusion-cases.json",
  waveforms: "working-waveforms.json",
  paths: "working-paths.json",
};

let cachedCaseVisuals: unknown;
export function loadCaseVisuals(): unknown {
  if (cachedCaseVisuals) return cachedCaseVisuals;
  cachedCaseVisuals = JSON.parse(readFileSync(path.join(process.cwd(), "content", "working-case-visuals.json"), "utf8"));
  return cachedCaseVisuals;
}

let cachedCrrt: unknown;
export function loadCrrtData(): unknown {
  if (cachedCrrt) return cachedCrrt;
  cachedCrrt = JSON.parse(readFileSync(path.join(process.cwd(), "content", "working-crrt.json"), "utf8"));
  return cachedCrrt;
}

const labCache = new Map<string, unknown[]>();
export function loadLabDataset(name: string): unknown[] | undefined {
  const file = LAB_DATASETS[name];
  if (!file) return undefined;
  const cached = labCache.get(name);
  if (cached) return cached;
  const data = JSON.parse(readFileSync(path.join(process.cwd(), "content", file), "utf8")) as unknown[];
  labCache.set(name, data);
  return data;
}
