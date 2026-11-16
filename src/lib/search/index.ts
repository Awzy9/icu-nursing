import "server-only";
import { getCaseService } from "@/lib/cases";
import { getContentRepository } from "@/lib/content";
import { localize, matchesQuery } from "@/lib/content/localize";
import { listEquipment } from "@/lib/equipment";
import { getMedicationService } from "@/lib/medications";
import { listPractice } from "@/lib/practice";
import { resolveMode } from "@/lib/question-bank";
import { getSkillService } from "@/lib/skills";

export const SEARCH_KINDS = ["library", "skills", "medications", "equipment", "cases", "practice"] as const;
export type SearchKind = (typeof SEARCH_KINDS)[number];
export interface SearchHit { kind: SearchKind; href: string; title: string; summary: string; synthetic: boolean }
export const MAX_QUERY = 80; const PER_KIND = 6;
export const cleanQuery = (q: unknown): string => (typeof q === "string" ? q.normalize("NFKC").replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, MAX_QUERY) : "");

/**
 * One search over every learning module the signed-in (or demonstration) visitor can open: library topics, skills, medications, equipment, cases and
 * practice labs. It searches titles and short summaries only. It never searches question stems, options or answers (so it cannot leak a question bank),
 * never touches an unpublished draft, and a module that is unavailable to the visitor simply contributes nothing.
 */
export async function searchEverything(raw: unknown, locale: string): Promise<{ query: string; hits: SearchHit[]; skipped: SearchKind[] }> {
  const query = cleanQuery(raw);
  if (query.length < 2) return { query, hits: [], skipped: [] };
  const hits: SearchHit[] = []; const skipped: SearchKind[] = [];
  const guard = async (kind: SearchKind, fn: () => Promise<SearchHit[]>) => { try { hits.push(...(await fn()).slice(0, PER_KIND)); } catch { skipped.push(kind); } };
  const mode = resolveMode();
  await Promise.all([
    guard("library", async () => (await (await getContentRepository()).listTopics({ locale, q: query })).map((t) => ({ kind: "library" as const, href: `/library/${t.slug}`, title: localize(t.title, locale), summary: localize(t.summary, locale), synthetic: false }))),
    guard("skills", async () => { const s = await getSkillService(); return (await s?.list({ query }))?.map((x) => ({ kind: "skills" as const, href: `/skills/${x.code}`, title: localize(x.title, locale), summary: localize(x.summary, locale), synthetic: x.synthetic })) ?? []; }),
    guard("medications", async () => { const s = await getMedicationService(); return (await s?.list({ query }))?.map((x) => ({ kind: "medications" as const, href: `/medications/${x.code}`, title: localize(x.name, locale), summary: localize(x.summary, locale), synthetic: x.synthetic })) ?? []; }),
    guard("cases", async () => { const s = await getCaseService(); return (await s?.list())?.filter((c) => matchesQuery([localize(c.title, locale)], query)).map((c) => ({ kind: "cases" as const, href: "/cases", title: localize(c.title, locale), summary: "", synthetic: c.synthetic })) ?? []; }),
  ]);
  if (mode !== "disabled") {
    hits.push(...listEquipment().filter((m) => matchesQuery([localize(m.title, locale), localize(m.summary, locale), ...m.parameters.map((p) => localize(p.name, locale))], query)).slice(0, PER_KIND).map((m) => ({ kind: "equipment" as const, href: `/equipment/${m.code}`, title: localize(m.title, locale), summary: localize(m.summary, locale), synthetic: true })));
    hits.push(...listPractice().filter((e) => matchesQuery([localize(e.title, locale), localize(e.intro, locale)], query)).slice(0, PER_KIND).map((e) => ({ kind: "practice" as const, href: `/practice/${e.code}`, title: localize(e.title, locale), summary: localize(e.intro, locale), synthetic: true })));
  }
  return { query, hits: hits.sort((a, b) => SEARCH_KINDS.indexOf(a.kind) - SEARCH_KINDS.indexOf(b.kind)), skipped };
}
