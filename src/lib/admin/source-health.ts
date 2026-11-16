/** Licence-tracking helper for the source register: which sources need attention before any reuse. Pure functions (unit tested). */
export interface SourceRow { id: string; licence_class: string; last_checked: string | null; is_draft_guideline: boolean; url: string | null }
export type SourceFlag = "never_checked" | "stale" | "not_reusable_without_permission" | "draft_guideline" | "no_url";
export const STALE_DAYS = 180;

export function sourceFlags(s: SourceRow, today: Date = new Date()): SourceFlag[] {
  const flags: SourceFlag[] = [];
  if (!s.last_checked) flags.push("never_checked");
  else if ((today.getTime() - new Date(`${s.last_checked}T00:00:00Z`).getTime()) / 86_400_000 > STALE_DAYS) flags.push("stale");
  if (s.licence_class === "RED" || s.licence_class === "UNVERIFIED") flags.push("not_reusable_without_permission");
  if (s.is_draft_guideline) flags.push("draft_guideline");
  if (!s.url) flags.push("no_url");
  return flags;
}
export function sourceSummary(rows: SourceRow[], today: Date = new Date()) {
  const byClass: Record<string, number> = {};
  let attention = 0;
  for (const r of rows) { byClass[r.licence_class] = (byClass[r.licence_class] ?? 0) + 1; if (sourceFlags(r, today).some((f) => f !== "no_url")) attention++; }
  return { total: rows.length, byClass, attention };
}
