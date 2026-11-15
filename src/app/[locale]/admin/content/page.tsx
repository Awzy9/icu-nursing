import { setRequestLocale } from "next-intl/server";
import { Badge, Callout } from "@/components/ui/feedback";
import { Link } from "@/i18n/navigation";
import { requireStaff } from "@/lib/auth";
import { sourceSummary, type SourceRow } from "@/lib/admin/source-health";
import { createClient } from "@/lib/supabase/server";
import register from "@/content/draft-register.json";

export const dynamic = "force-dynamic";
export const metadata = { title: "Content overview", robots: { index: false, follow: false } };

const TABLES = [
  ["Topics", "topics", "status"], ["Questions", "question_items", "status"], ["Cases", "case_items", "status"], ["Skills", "skill_items", "status"], ["Medications", "medication_items", "status"],
] as const;
const GATE: Record<string, string> = {
  topics: "Full review workflow: author, assigned clinical reviewers, approver, independent publisher; versions are immutable once published.",
  question_items: "Publish guard and freeze triggers; clinical items need an approver and an independent reviewer; fixtures only on a development database.",
  case_items: "Publish guard and structure checks; clinical cases need approver, reviewer and supported evidence; fixtures only on development.",
  skill_items: "Publish guard; clinical skills need approver, independent reviewer, evidence_status = supported and cleared licensing.",
  medication_items: "Publish guard plus a no-dosing trigger; clinical entries also need a pharmacist reviewer.",
};

export default async function ContentOverview({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireStaff(locale);
  const db = (await createClient())!;
  const live = await Promise.all(TABLES.map(async ([label, table, col]) => {
    const { data } = await db.from(table).select(table === "topics" ? col : `${col}, kind`).limit(2000);
    const rows = (data ?? []) as unknown as Record<string, string>[];
    const by: Record<string, number> = {};
    for (const r of rows) { const k = `${r[col] ?? "?"}${r.kind === "demo_synthetic" ? " (synthetic fixture)" : ""}`; by[k] = (by[k] ?? 0) + 1; }
    return { label, table, by, total: rows.length };
  }));
  const { data: src } = await db.from("sources").select("id, licence_class, last_checked, is_draft_guideline, url");
  const sources = sourceSummary((src ?? []) as SourceRow[]);
  const types = Object.entries(register.types) as [string, { total: number; validator_issues: number; clinically_reviewed: number; evidence: Record<string, number>; extra?: Record<string, number> }][];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Content overview</h1>
      <p className="flex flex-wrap gap-3"><Link href="/admin/content/register" className="font-medium">Draft register (filter, validation, notes)</Link><Link href="/admin/content/coverage" className="font-medium">Coverage dashboard</Link></p>
      <Callout tone="warning" role="note">Nothing here publishes, imports or reviews content. The clinical drafts listed below live outside the database and cannot satisfy any publication gate.</Callout>

      <section aria-labelledby="live" className="space-y-3">
        <h2 id="live" className="text-xl font-semibold">In the database</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-start text-sm">
            <caption className="sr-only">Database content by type and status, with the gate that protects publication</caption>
            <thead><tr className="border-b border-border"><th scope="col" className="py-2 pe-4 text-start">Type</th><th scope="col" className="py-2 pe-4 text-start">Items by status</th><th scope="col" className="py-2 text-start">Publication gate</th></tr></thead>
            <tbody>
              {live.map((r) => (
                <tr key={r.table} className="border-b border-border align-top">
                  <th scope="row" className="py-2 pe-4 text-start font-medium">{r.label}</th>
                  <td className="py-2 pe-4">{r.total === 0 ? "none visible to you" : Object.entries(r.by).map(([k, n]) => `${k}: ${n}`).join("; ")}</td>
                  <td className="py-2">{GATE[r.table]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="drafts" className="space-y-3">
        <h2 id="drafts" className="text-xl font-semibold">Unpublished clinical drafts (files, not in the database)</h2>
        <p className="text-sm text-muted-foreground">{register.note}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-start text-sm">
            <caption className="sr-only">Draft counts, validator results and evidence status by type</caption>
            <thead><tr className="border-b border-border"><th scope="col" className="py-2 pe-4 text-start">Type</th><th scope="col" className="py-2 pe-4 text-start">Drafts</th><th scope="col" className="py-2 pe-4 text-start">Validator issues</th><th scope="col" className="py-2 pe-4 text-start">Clinically reviewed</th><th scope="col" className="py-2 text-start">Evidence status / detail</th></tr></thead>
            <tbody>
              {types.map(([k, v]) => (
                <tr key={k} className="border-b border-border">
                  <th scope="row" className="py-2 pe-4 text-start font-medium capitalize">{k}</th>
                  <td className="py-2 pe-4 tabular-nums">{v.total}</td>
                  <td className="py-2 pe-4 tabular-nums">{v.validator_issues === 0 ? <Badge tone="success">0</Badge> : <Badge tone="danger">{v.validator_issues}</Badge>}</td>
                  <td className="py-2 pe-4 tabular-nums">{v.clinically_reviewed}</td>
                  <td className="py-2">{[...Object.entries(v.evidence), ...Object.entries(v.extra ?? {})].map(([a, n]) => `${a.replace(/_/g, " ")}: ${n}`).join("; ") || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="lic" className="space-y-2">
        <h2 id="lic" className="text-xl font-semibold">Licensing tracking</h2>
        <p>{sources.total} sources in the register: {Object.entries(sources.byClass).map(([c, n]) => `${c} ${n}`).join(", ") || "none"}. <b>{sources.attention}</b> need attention (never checked, not checked in the last 180 days, RED or UNVERIFIED, or a draft guideline).</p>
        <p className="text-sm text-muted-foreground">The file-based licensing register (LICENSING_REGISTER.md) and the evidence registers cover the clinical drafts; reconciling them with this table is listed as a gap in the Phase 10 administration audit.</p>
      </section>
    </div>
  );
}
