import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import type { WorkingEntry } from "./model";
import { checkProductionPublication } from "./publication-gate";
import { isProductionWorkingRelease } from "./publication-policy";
export type { WorkingEntry } from "./model";
// A preview disclaimer is not a publication permission. Staging/local working
// editions remain unchanged; a production working edition MUST have human
// approval and licensed, hash-pinned content for every entry and lab dataset.
export const workingEditionEnabled = () => {
  if (process.env.CONTENT_EDITION !== "working") return false;
  if (!isProductionWorkingRelease(process.env)) return true;
  try {
    return checkProductionPublication(loadCatalog()).ready;
  } catch {
    // Missing register, generated catalog or clinical review must fail closed.
    return false;
  }
};
let catalog: WorkingEntry[] | undefined;
function loadCatalog(): WorkingEntry[] {
  catalog ??= JSON.parse(readFileSync(path.join(process.cwd(), "content", "working-catalog.json"), "utf8")) as WorkingEntry[];
  return catalog;
}
export function workingContent(): WorkingEntry[] {
  if (!workingEditionEnabled()) return [];
  return loadCatalog();
}
export const workingEntry = (key: string) => /^[A-Z0-9-]+$/.test(key) ? workingContent().find((e) => e.key === key) : undefined;
export const workingTypes = ["topics", "skills", "medications", "cases", "equipment", "practice", "questions"] as const;
export const workingLabels: Record<string, [string, string]> = {
  topics: ["Topics", "المواضيع"], skills: ["Clinical skills", "المهارات السريرية"], medications: ["Medications", "الأدوية"], cases: ["Clinical scenarios", "السيناريوهات السريرية"], equipment: ["Equipment and monitoring", "الأجهزة والمراقبة"], practice: ["Practice modules", "وحدات التدريب"], questions: ["Question bank", "بنك الأسئلة"],
};

export async function workingQuery(params: Promise<{ q?: string | string[] }>): Promise<string> { const { q } = await params; return (Array.isArray(q) ? q[0] : q)?.slice(0, 100) ?? ""; }
