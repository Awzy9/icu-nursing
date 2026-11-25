import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { AdminForm } from "@/components/admin/admin-form";
import { Badge, Callout } from "@/components/ui/feedback";
import { Field, Select, Textarea } from "@/components/ui/form";
import { Link } from "@/i18n/navigation";
import { requireStaff } from "@/lib/auth";
import { DRAFTS, HISTORY, REVIEW_LANES, ageDays, compareLatest, draftFreshness, reviewLane, sourceFreshness, worstLicence } from "@/lib/admin/drafts";
import { NOTE_FIELDS, notesFor } from "@/lib/admin/draft-notes";
import { aiEvidenceFor } from "@/lib/admin/ai-evidence";
import { createClient } from "@/lib/supabase/server";
import { saveAiEvidenceAction, saveDraftNoteAction } from "../../actions";

const RECOMMENDATION_LABEL: Record<string, string> = { no_action: "No action needed", minor_update_suggested: "Minor update suggested", major_gap_flagged: "Major gap flagged" };
const RECOMMENDATION_TONE: Record<string, "success" | "warning" | "danger"> = { no_action: "success", minor_update_suggested: "warning", major_gap_flagged: "danger" };
const CURRENCY_LABEL: Record<string, string> = { current: "Appears current", superseded: "Appears superseded", unclear: "Unclear" };

export const dynamic = "force-dynamic";
export const metadata = { title: "Draft", robots: { index: false, follow: false } };
const tone = (l: string) => (l === "GREEN" ? "success" : l === "YELLOW" ? "warning" : "danger");

export default async function DraftDetail({ params }: { params: Promise<{ locale: string; key: string }> }) {
  const { locale, key } = await params;
  setRequestLocale(locale);
  const { roles } = await requireStaff(locale);
  const e = DRAFTS.entries.find((x) => x.key === key);
  if (!e) notFound();
  const db = (await createClient())!;
  const today = new Date();
  const { notes, revisions } = await notesFor(db, key);
  const aiChecks = await aiEvidenceFor(db, key);
  const canEdit = roles.some((r) => ["author", "publisher", "admin"].includes(r));
  const diff = compareLatest(HISTORY, key);
  const snaps = HISTORY.entries[key] ?? [];
  return (
    <div className="space-y-8">
      <nav aria-label="Breadcrumb"><Link href="/admin/content/register">← Draft register</Link></nav>
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">{e.key}: {e.title}</h1>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge>{e.type}{e.spec_level ? ` · ${e.spec_level.replace("_", " ")}` : ""}</Badge>
          <Badge tone="warning">Evidence: {e.evidence_status.replace(/_/g, " ")}</Badge>
          <Badge tone={tone(worstLicence(e))}>Licence: {worstLicence(e)}</Badge>
          <Badge tone="danger">Not reviewed · not approved · not published</Badge>
        </div>
      </header>
      <Callout tone="warning" role="note">This page shows metadata and workflow notes. The draft itself is a file outside the database; nothing here imports, reviews, approves or publishes it.</Callout>

      <section aria-labelledby="handoff" className="space-y-2 rounded-lg border border-border p-4">
        <h2 id="handoff" className="text-xl font-semibold">Independent review handoff</h2>
        <p className="text-sm text-muted-foreground">Suggested queue: <strong>{REVIEW_LANES.find((l) => l.key === reviewLane(e))?.label ?? "Review pending"}</strong>. This is a metadata-based ordering aid, not a judgment that content is safe, accurate, licensed or approved.</p>
        <ul className="list-disc space-y-1 ps-6 text-sm">
          <li>Assign a qualified clinical reviewer and relevant specialist(s). Have every question, decision branch and feedback statement checked against current primary evidence and applicable local protocols.</li>
          <li>Resolve {e.gaps} declared content gaps and {e.required_sources} missing-source requirements. The automated validator does not establish clinical safety.</li>
          <li>Clear commercial source and image permissions independently. Current source labels include {worstLicence(e)}; they are not proof of legal permission.</li>
          <li>Document real human clinical and publisher decisions for the exact source revision <code>{e.hash}</code>; any subsequent change requires a new review.</li>
        </ul>
        <p className="text-sm font-medium">Publication remains blocked until the clinical, rights and publisher approvals are independently verified.</p>
      </section>

      <section aria-labelledby="val" className="space-y-2">
        <h2 id="val" className="text-xl font-semibold">Validation feedback</h2>
        {e.issues.length === 0 ? <p><Badge tone="success">OK</Badge> The draft passes its validator.</p> : <ul className="list-disc space-y-1 ps-6">{e.issues.map((i, n) => <li key={n}><code>{i.rule}</code> {i.message}</li>)}</ul>}
        <p className="text-sm text-muted-foreground">Declared gaps: {e.gaps}. Sources still needed: {e.required_sources}. (The gap and source texts are in the draft file.)</p>
      </section>

      <section aria-labelledby="src" className="space-y-2">
        <h2 id="src" className="text-xl font-semibold">Sources, licensing and freshness</h2>
        <p className="text-sm">Overall freshness: <Badge tone={draftFreshness(e, today) === "fresh" ? "success" : "warning"}>{draftFreshness(e, today)}</Badge> (a source is stale after 180 days; no date means unknown).</p>
        {e.sources.length === 0 ? <p className="text-muted-foreground">No sources cited.</p> : (
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <caption className="sr-only">Sources cited by this draft</caption>
            <thead><tr className="border-b border-border"><th scope="col" className="py-2 pe-3 text-start">Source</th><th scope="col" className="py-2 pe-3 text-start">Licence class</th><th scope="col" className="py-2 pe-3 text-start">Verified</th><th scope="col" className="py-2 text-start">Freshness</th></tr></thead>
            <tbody>{e.sources.map((s) => { const a = ageDays(s.verified, today), f = sourceFreshness(s, today); return (
              <tr key={s.id} className="border-b border-border"><th scope="row" className="py-2 pe-3 text-start font-mono font-normal">{s.id}</th><td className="py-2 pe-3"><Badge tone={tone(s.licence_class)}>{s.licence_class}</Badge></td><td className="py-2 pe-3">{s.verified ?? "no date"}{a !== null ? ` (${a} days ago)` : ""}</td><td className="py-2"><Badge tone={f === "fresh" ? "success" : "warning"}>{f}</Badge></td></tr>); })}</tbody>
          </table></div>
        )}
      </section>

      <section aria-labelledby="ai-ev" className="space-y-3">
        <h2 id="ai-ev" className="text-xl font-semibold">AI-assisted evidence checks</h2>
        <Callout tone="danger" role="note">
          An AI evidence check is not a clinical review and does not approve, publish or change the review status of this draft. It records that a
          staff member asked an AI tool (for example ChatGPT, with web browsing) to compare this draft&rsquo;s claims against current guidelines,
          systematic reviews, trials or regulatory sources, and what it found. The draft remains &ldquo;not reviewed, not approved, not
          published&rdquo; regardless of what is recorded here. Independent professional clinical review (and, for medications, pharmacist review)
          is still required before anything can be published.
        </Callout>
        {canEdit ? (
          <AdminForm action={saveAiEvidenceAction} submit="Record AI evidence check" className="space-y-3 rounded-lg border border-border bg-card p-4">
            <input type="hidden" name="key" value={key} />
            <Field label="Tool used" htmlFor="ai-tool" hint="e.g. &quot;ChatGPT (GPT-5.1), web browsing enabled, 2026-11-16&quot;">
              <Textarea id="ai-tool" name="tool" maxLength={200} rows={1} required />
            </Field>
            <Field label="Sources checked (one per line)" htmlFor="ai-sources" hint="Guideline name and year, systematic review, trial registry entry, or regulator page - up to 20 lines.">
              <Textarea id="ai-sources" name="sources" maxLength={4000} rows={4} required />
            </Field>
            <Field label="Are these sources still the current version of the guideline?" htmlFor="ai-currency">
              <Select id="ai-currency" name="currency" defaultValue="unclear" required>
                {Object.entries(CURRENCY_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </Select>
            </Field>
            <Field label="Did the check find any discrepancy between the draft and the sources?" htmlFor="ai-discrepancies">
              <Select id="ai-discrepancies" name="discrepancies" defaultValue="no" required>
                <option value="no">No discrepancy found</option>
                <option value="yes">Discrepancy found (describe it in the summary)</option>
              </Select>
            </Field>
            <Field label="Summary of the check" htmlFor="ai-summary" hint="What was compared and what was found. No doses, rates or new clinical claims; the database refuses them.">
              <Textarea id="ai-summary" name="summary" maxLength={2000} rows={4} required />
            </Field>
            <Field label="Recommendation" htmlFor="ai-recommendation">
              <Select id="ai-recommendation" name="recommendation" defaultValue="no_action" required>
                {Object.entries(RECOMMENDATION_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </Select>
            </Field>
          </AdminForm>
        ) : <p className="text-sm text-muted-foreground">Your role can read AI evidence checks but not record one.</p>}
        <h3 className="text-lg font-semibold">History of checks</h3>
        {aiChecks.length === 0 ? <p className="text-sm text-muted-foreground">No AI evidence check has been recorded for this draft yet.</p> : (
          <ul className="space-y-3">
            {aiChecks.map((c) => (
              <li key={c.id} className="space-y-1 rounded-lg border border-border p-3 text-sm">
                <p className="flex flex-wrap items-center gap-2">
                  <Badge tone={RECOMMENDATION_TONE[c.recommendation]}>{RECOMMENDATION_LABEL[c.recommendation]}</Badge>
                  <Badge tone={c.guideline_currency === "current" ? "success" : "warning"}>{CURRENCY_LABEL[c.guideline_currency]}</Badge>
                  {c.discrepancies_found ? <Badge tone="danger">Discrepancy found</Badge> : null}
                  <span className="text-muted-foreground">{c.reviewed_at.slice(0, 16).replace("T", " ")} · {c.reviewed_by} · {c.tool}</span>
                </p>
                <p>{c.summary}</p>
                <p className="text-muted-foreground">Sources checked: {c.sources_checked.join("; ")}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="hist" className="space-y-2">
        <h2 id="hist" className="text-xl font-semibold">Version history and comparison</h2>
        <p className="text-sm text-muted-foreground">{HISTORY.note} Content hash now: <code>{e.hash}</code>.</p>
        <ol className="list-decimal space-y-1 ps-6 text-sm">{snaps.map((s, n) => <li key={s.hash + n}>{s.recorded}: evidence {s.evidence_status.replace(/_/g, " ")}, {s.sources.length} sources, {s.gaps} gaps, {s.issues} validator issues (<code>{s.hash}</code>)</li>)}</ol>
        {diff && diff.from ? <div><p className="font-medium">Latest change ({diff.from.recorded} → {diff.to.recorded})</p><ul className="list-disc ps-6 text-sm">{diff.changes.map((c) => <li key={c}>{c}</li>)}</ul></div> : <p className="text-sm text-muted-foreground">Only one snapshot so far; earlier history is in git.</p>}
      </section>

      <section aria-labelledby="notes" className="space-y-3">
        <h2 id="notes" className="text-xl font-semibold">Workflow notes</h2>
        <p className="text-sm text-muted-foreground">Notes are for staff only and are never shown to learners. {canEdit ? "Do not enter clinical content, doses or rates; the database refuses them." : "Your role can read notes but not change them."}</p>
        <div className="grid gap-4 md:grid-cols-2">
          {NOTE_FIELDS.map(([field, label]) => (
            <div key={field} className="rounded-lg border border-border bg-card p-4">
              {canEdit ? (
                <AdminForm action={saveDraftNoteAction} submit={`Save ${label.toLowerCase()}`}>
                  <input type="hidden" name="key" value={key} /><input type="hidden" name="field" value={field} />
                  <Field label={label} htmlFor={`n-${field}`} hint={notes[field] ? `Last changed ${notes[field]!.updated_at.slice(0, 10)} by ${notes[field]!.updated_by}. Leave empty and save to clear.` : "Not set."}>
                    <Textarea id={`n-${field}`} name="value" maxLength={1000} defaultValue={notes[field]?.value ?? ""} />
                  </Field>
                </AdminForm>
              ) : (<><p className="font-medium">{label}</p><p>{notes[field]?.value ?? "Not set."}</p></>)}
            </div>
          ))}
        </div>
        <h3 className="text-lg font-semibold">Note history</h3>
        {revisions.length === 0 ? <p className="text-sm text-muted-foreground">No changes yet.</p> : (
          <ul className="space-y-2 text-sm">{revisions.map((r, n) => (
            <li key={n} className="rounded-md border border-border p-2"><p>{r.at.slice(0, 16).replace("T", " ")} · {r.by} · {r.field.replace(/_/g, " ")}</p>
              <p><del className="text-muted-foreground">{r.old ?? "(empty)"}</del></p><p><ins className="no-underline font-medium">{r.new ?? "(cleared)"}</ins></p></li>))}</ul>
        )}
      </section>
    </div>
  );
}
