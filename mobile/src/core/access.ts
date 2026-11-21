// Guest access rules: without an account a learner can open the first FREE_COUNT items of every area; the rest needs a free account.
// Pure functions only (no React) so the rules are unit-tested; src/auth/useAccess.ts and the root layout guard apply them.
export const FREE_COUNT = 3;
export type CatalogType = "topics" | "skills" | "medications" | "equipment" | "cases" | "practice";

/** Route segment -> catalog list whose first FREE_COUNT entries stay open. */
const CATALOG_SEGMENTS: Record<string, CatalogType> = { topics: "topics", skills: "skills", medications: "medications", equipment: "equipment", cases: "cases", "practice-activity": "practice" };

/** Tools, simulations and interpretation labs that need an account. The free ones are infusion-calculator, hemo-lab, abg (Tools) and quiz, nursing-lab, ecg (Practice): simply not listed here. */
const LOCKED_SEGMENTS = new Set(["gcs", "news2", "aline", "crrt", "defib", "waveforms", "waveform-compare", "vent-lab", "infusion", "transfusion"]);

/** The path of a string href without query or hash, or null for anything that is not a plain path. */
export function pathOf(href: unknown): string | null {
  if (typeof href !== "string" || !href.startsWith("/")) return null;
  return href.split(/[?#]/)[0] || null;
}
const segments = (path: string): string[] => path.split("/").filter(Boolean).map((s) => { try { return decodeURIComponent(s); } catch { return s; } });

export function isLockedStaticRoute(path: string): boolean {
  const first = segments(path)[0];
  return first !== undefined && LOCKED_SEGMENTS.has(first);
}

/** `/topics/D04-T03` -> { type: "topics", key: "D04-T03" }; any other shape is not a catalog detail route. */
export function catalogRoute(path: string): { type: CatalogType; key: string } | null {
  const [first, key, ...rest] = segments(path);
  const type = first ? CATALOG_SEGMENTS[first] : undefined;
  return type && key && rest.length === 0 ? { type, key } : null;
}

export const isFreeIndex = (index: number): boolean => index >= 0 && index < FREE_COUNT;
/** Whether a catalog entry is among the first FREE_COUNT of its list (a key missing from the list is not free). */
export const isFreeCatalogEntry = (keys: readonly string[], key: string): boolean => isFreeIndex(keys.indexOf(key));

/** A same-app path that is safe to return to after sign-in; anything else (other origins, auth screens) becomes null. */
export function safeNext(next: unknown): string | null {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//") || next.includes("://") || next.includes("\\")) return null;
  const first = segments(next.split(/[?#]/)[0] ?? "")[0];
  if (!first || ["signin", "signup", "account-required", "auth", "reset-password", "delete-account", "onboarding"].includes(first)) return null;
  return next;
}
