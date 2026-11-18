// Pure client-side filter over the (cached, already-fetched) catalog list. Searches title,
// category and key, case-insensitively, against the real "working" catalog the rest of the app
// already uses - not the website's own /search page, which (as of this writing) still queries
// an older, separate content system and does not search the working-edition catalog that
// actually powers /library, /skills, etc. in production. This searches the catalog mobile
// already reads, which is the more correct target for parity.
import type { WorkingEntrySummary } from "./remoteContent";

export const MIN_QUERY_LENGTH = 2;
export const MAX_QUERY_LENGTH = 80;

export function cleanQuery(raw: string): string {
  return raw.normalize("NFKC").replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, MAX_QUERY_LENGTH);
}

export function searchCatalog(items: WorkingEntrySummary[], rawQuery: string): WorkingEntrySummary[] {
  const query = cleanQuery(rawQuery);
  if (query.length < MIN_QUERY_LENGTH) return [];
  const needle = query.toLowerCase();
  return items.filter((e) => `${e.title} ${e.key} ${e.category}`.toLowerCase().includes(needle));
}

export function groupByType(items: WorkingEntrySummary[]): Map<string, WorkingEntrySummary[]> {
  const groups = new Map<string, WorkingEntrySummary[]>();
  for (const e of items) groups.set(e.type, [...(groups.get(e.type) ?? []), e]);
  return groups;
}

// The route prefix for each catalog entry type, shared by the search screen and exam results'
// "read the lesson" links (both need to turn a catalog key into a navigable mobile route).
export const ROUTE_FOR_TYPE: Record<string, string> = { topics: "/topics/", skills: "/skills/", medications: "/medications/", equipment: "/equipment/", cases: "/cases/", questions: "/quiz/" };
