import { setRequestLocale } from "next-intl/server";
import { Badge } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { Link } from "@/i18n/navigation";
import { requireStaff } from "@/lib/auth";
import { DRAFTS, DRAFT_TYPES, REVIEW_LANES, draftFreshness, filterDrafts, orderReviewQueue, reviewLane, worstLicence } from "@/lib/admin/drafts";
import { notesSummary } from "@/lib/admin/draft-notes";
import { aiEvidenceSummary } from "@/lib/admin/ai-evidence";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Draft register", robots: { index: false, follow: false } };

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;
const tone = (l: string) => (l === "GREEN" ? "success" : l === "YELLOW" ? "warning" : "danger");

export default async function DraftList({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  await requireStaff(locale);
  const db = (await createClient())!;
  const notes = await notesSummary(db);
  const aiSummary = await aiEvidenceSummary(db);
  const f = { type: one(sp.type), evidence: one(sp.evidence), validation: one(sp.validation), licence: one(sp.licence), freshness: one(sp.freshness), notes: one(sp.notes), review: one(sp.review), sort: one(sp.sort), q: one(sp.q) };
  const today = new Date();
  const selected = filterDrafts(DRAFTS.entries, f, today, new Set(Object.keys(notes)));
  const rows = f.sort === "review" ? orderReviewQueue(selected) : selected;
  const evidenceValues = [...new Set(DRAFTS.entries.map((e) => e.evidence_status))].sort();
  const sel = "min-h-11";
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Draft register</h1>
      <p className="text-muted-foreground">Metadata about unpublished clinical drafts. The review queue is a workflow suggestion, not a medical risk assessment or clinical approval. Notes you add are workflow notes only: never paste clinical content, doses or rates.</p>
      <form method="get" role="search" className="grid gap-3 rounded-lg border border-border bg-card p-4 md:grid-cols-4">
        <Field label="Search key or title" htmlFor="q"><Input id="q" name="q" type="search" maxLength={80} defaultValue={f.q ?? ""} /></Field>
        <Field label="Type" htmlFor="type"><Select id="type" name="type" defaultValue={f.type ?? ""} className={sel}><option value="">All</option>{DRAFT_TYPES.map((t) => <option key={t.type} value={t.type}>{t.label}</option>)}</Select></Field>
        <Field label="Evidence status" htmlFor="evidence"><Select id="evidence" name="evidence" defaultValue={f.evidence ?? ""}><option value="">All</option>{evidenceValues.map((v) => <option key={v} value={v}>{v.replace(/_/g, " ")}</option>)}</Select></Field>
        <Field label="Validation" htmlFor="validation"><Select id="validation" name="validation" defaultValue={f.validation ?? ""}><option value="">All</option><option value="ok">No issues</option><option value="issues">Has issues</option></Select></Field>
        <Field label="Worst licence class of its sources" htmlFor="licence"><Select id="licence" name="licence" defaultValue={f.licence ?? ""}><option value="">All</option>{["RED", "UNVERIFIED", "YELLOW", "GREEN", "NONE"].map((v) => <option key={v}>{v}</option>)}</Select></Field>
        <Field label="Source freshness" htmlFor="freshness"><Select id="freshness" name="freshness" defaultValue={f.freshness ?? ""}><option value="">All</option><option value="fresh">All sources verified within 180 days</option><option value="stale">Some source older than 180 days</option><option value="unknown">Some source has no verification date</option></Select></Field>
        <Field label="Staff notes" htmlFor="notes"><Select id="notes" name="notes" defaultValue={f.notes ?? ""}><option value="">All</option><option value="with">With notes</option><option value="without">Without notes</option></Select></Field>
        <Field label="Suggested review lane" htmlFor="review"><Select id="review" name="review" defaultValue={f.review ?? ""}><option value="">All drafts</option>{REVIEW_LANES.map((l) => <option key={l.key} value={l.key}>{l.label}</option>)}</Select></Field>
        <Field label="Sort" htmlFor="sort"><Select id="sort" name="sort" defaultValue={f.sort ?? ""}><option value="">Original order</option><option value="review">Review lane, then declared gaps</option></Select></Field>
        <div className="flex items-end gap-2"><Button type="submit">Apply</Button><Button asChild variant="outline"><Link href="/admin/content/register">Clear</Link></Button></div>
      </form>
      <p role="status" className="text-sm text-muted-foreground">{rows.length} of {DRAFTS.entries.length} drafts</p>
      <p className="text-sm text-muted-foreground">All clinical-priority items still require specialist review. A low queue position does not establish safety or permission. <Link href={{ pathname: "/admin/content/register", query: { sort: "review" } }} className="underline">View suggested review order</Link></p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">Unpublished drafts with evidence, licensing, freshness and validation status</caption>
          <thead><tr className="border-b border-border"><th scope="col" className="py-2 pe-3 text-start">Key</th><th scope="col" className="py-2 pe-3 text-start">Title</th><th scope="col" className="py-2 pe-3 text-start">Type</th><th scope="col" className="py-2 pe-3 text-start">Review lane</th><th scope="col" className="py-2 pe-3 text-start">Evidence</th><th scope="col" className="py-2 pe-3 text-start">Licence</th><th scope="col" className="py-2 pe-3 text-start">Sources</th><th scope="col" className="py-2 pe-3 text-start">Validation</th><th scope="col" className="py-2 pe-3 text-start">Notes</th><th scope="col" className="py-2 text-start">AI evidence check</th></tr></thead>
          <tbody>
            {rows.map((e) => {
              const lic = worstLicence(e), fr = draftFreshness(e, today);
              return (
                <tr key={`${e.type}-${e.key}`} className="border-b border-border align-top">
                  <th scope="row" className="py-2 pe-3 text-start font-medium"><Link href={`/admin/content/register/${e.key}`}>{e.key}</Link></th>
                  <td className="py-2 pe-3">{e.title}</td>
                  <td className="py-2 pe-3 capitalize">{e.type}{e.spec_level ? ` (${e.spec_level.replace("_", " ")})` : ""}</td>
                  <td className="py-2 pe-3">{REVIEW_LANES.find((l) => l.key === reviewLane(e))?.label ?? "Review pending"}</td>
                  <td className="py-2 pe-3">{e.evidence_status.replace(/_/g, " ")}</td>
                  <td className="py-2 pe-3"><Badge tone={tone(lic)}>{lic}</Badge></td>
                  <td className="py-2 pe-3">{e.sources.length}{fr !== "fresh" ? <> <Badge tone="warning">{fr === "stale" ? "stale" : "no date"}</Badge></> : null}</td>
                  <td className="py-2 pe-3">{e.issues.length === 0 ? <Badge tone="success">OK</Badge> : <Badge tone="danger">{e.issues.length} issue{e.issues.length > 1 ? "s" : ""}</Badge>}</td>
                  <td className="py-2 pe-3">{notes[e.key] ? notes[e.key]!.fields : "—"}</td>
                  <td className="py-2">{aiSummary[e.key] ? <Badge tone={aiSummary[e.key]!.ever_flagged ? "danger" : "success"}>{aiSummary[e.key]!.count} check{aiSummary[e.key]!.count > 1 ? "s" : ""}{aiSummary[e.key]!.ever_flagged ? ", gap flagged" : ""}</Badge> : "—"}</td>
                </tr>
              );
            })}
            {rows.length === 0 ? <tr><td colSpan={10} className="py-3 text-muted-foreground">No drafts match these filters.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
