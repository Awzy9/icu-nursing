import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import type { WorkingEntry } from "./model";
export type { WorkingEntry } from "./model";
export const workingEditionEnabled = () => process.env.CONTENT_EDITION === "working";
let catalog: WorkingEntry[] | undefined;
export function workingContent(): WorkingEntry[] {
  if (!workingEditionEnabled()) return [];
  catalog ??= JSON.parse(readFileSync(path.join(process.cwd(), "content", "working-catalog.json"), "utf8")) as WorkingEntry[];
  return catalog!;
}
export const workingEntry = (key: string) => /^[A-Z0-9-]+$/.test(key) ? workingContent().find((e) => e.key === key) : undefined;
export const workingTypes = ["topics", "skills", "medications", "cases", "equipment", "practice", "questions"] as const;
export const workingLabels: Record<string, [string, string]> = {
  topics: ["Topics", "المواضيع"], skills: ["Clinical skills", "المهارات السريرية"], medications: ["Medications", "الأدوية"], cases: ["Clinical scenarios", "السيناريوهات السريرية"], equipment: ["Equipment and monitoring", "الأجهزة والمراقبة"], practice: ["Practice modules", "وحدات التدريب"], questions: ["Question bank", "بنك الأسئلة"],
};

export async function workingQuery(params: Promise<{ q?: string | string[] }>): Promise<string> { const { q } = await params; return (Array.isArray(q) ? q[0] : q)?.slice(0, 100) ?? ""; }
