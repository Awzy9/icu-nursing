import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { AdminForm } from "@/components/admin/admin-form";
import { Badge, Callout } from "@/components/ui/feedback";
import { Field, Textarea } from "@/components/ui/form";
import { Link } from "@/i18n/navigation";
import { requireStaff } from "@/lib/auth";
import { DRAFTS, HISTORY, ageDays, compareLatest, draftFreshness, sourceFreshness, worstLicence } from "@/lib/admin/drafts";
import { NOTE_FIELDS, notesFor } from "@/lib/admin/draft-notes";
import { createClient } from "@/lib/supabase/server";
import { saveDraftNoteAction } from "../../actions";

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
