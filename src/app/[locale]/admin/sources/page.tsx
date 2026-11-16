import { setRequestLocale } from "next-intl/server";
import { AdminForm } from "@/components/admin/admin-form";
import { Badge } from "@/components/ui/feedback";
import { Field, Input, Select } from "@/components/ui/form";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sourceFlags } from "@/lib/admin/source-health";
import { saveSourceAction } from "../actions";

interface Src { id: string; source_code: string | null; organization: string; title: string; url: string | null; version_label: string | null; licence_class: string; is_draft_guideline: boolean; last_checked: string | null }

export default async function SourcesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { roles } = await requireStaff(locale);
  const db = (await createClient())!;
  const { data } = await db.from("sources").select("*").order("organization");
  const sources = (data ?? []) as unknown as Src[];
  const canEdit = roles.some((r) => ["publisher", "admin"].includes(r)); // the source register is curated by publishers/administrators
  const canUpdate = canEdit;
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Source register</h1>
      <p className="text-muted-foreground">Licence classes: GREEN reusable with conditions · YELLOW review needed · RED cite only (original wording required) · UNVERIFIED treat as RED. Mark unpublished or draft guidelines as DRAFT so they are always labelled. Only publishers and administrators curate this register; authors cite existing sources.</p>
      <ul className="divide-y divide-border border-y border-border">
        {sources.map((s) => (
          <li key={s.id} className="py-3">
            <p className="flex flex-wrap items-center gap-2"><b>{s.organization}</b> <Badge tone={s.licence_class === "GREEN" ? "success" : s.licence_class === "YELLOW" ? "warning" : "danger"}>{s.licence_class}</Badge>{s.is_draft_guideline ? <Badge tone="danger">DRAFT guideline</Badge> : null}{sourceFlags(s).includes("never_checked") ? <Badge tone="warning">Never checked</Badge> : null}{sourceFlags(s).includes("stale") ? <Badge tone="warning">Not checked in 180 days</Badge> : null}</p>
            <p>{s.title}{s.version_label ? ` — ${s.version_label}` : ""}</p>
            {canUpdate ? <details className="mt-1"><summary className="min-h-11 cursor-pointer leading-[2.75rem]">Edit</summary><SourceForm s={s} /></details> : null}
          </li>
        ))}
        {!sources.length ? <li className="py-3 text-muted-foreground">No sources yet.</li> : null}
      </ul>
      {canEdit ? <details className="rounded-md border border-dashed border-border p-3"><summary className="min-h-11 cursor-pointer font-medium leading-[2.75rem]">Add a source</summary><SourceForm /></details> : null}
    </div>
  );
}

function SourceForm({ s }: { s?: Src }) {
  const k = s?.id ?? "new";
  return (
    <AdminForm action={saveSourceAction} submit="Save source" className="mt-3 grid gap-3 md:grid-cols-2">
      <input type="hidden" name="id" value={s?.id ?? ""} />
      <Field label="Organisation" htmlFor={`o-${k}`}><Input id={`o-${k}`} name="organization" defaultValue={s?.organization} required maxLength={120} /></Field>
      <Field label="Title" htmlFor={`t-${k}`}><Input id={`t-${k}`} name="title" defaultValue={s?.title} required maxLength={300} /></Field>
      <Field label="Source code (e.g. S-AARC-PVA)" htmlFor={`c-${k}`}><Input id={`c-${k}`} name="code" defaultValue={s?.source_code ?? ""} maxLength={60} /></Field>
      <Field label="Official URL (https)" htmlFor={`u-${k}`}><Input id={`u-${k}`} name="url" type="url" defaultValue={s?.url ?? ""} maxLength={500} /></Field>
      <Field label="Version / date label" htmlFor={`v-${k}`}><Input id={`v-${k}`} name="version" defaultValue={s?.version_label ?? ""} maxLength={200} /></Field>
      <Field label="Licence class" htmlFor={`l-${k}`}><Select id={`l-${k}`} name="licenceClass" defaultValue={s?.licence_class ?? "UNVERIFIED"}><option>GREEN</option><option>YELLOW</option><option>RED</option><option>UNVERIFIED</option></Select></Field>
      <Field label="Date last checked" htmlFor={`d-${k}`}><Input id={`d-${k}`} name="checked" type="date" defaultValue={s?.last_checked ?? ""} /></Field>
      <Field label="Commercial reuse note" htmlFor={`n-${k}`}><Input id={`n-${k}`} name="note" maxLength={500} /></Field>
      <label className="flex min-h-11 items-center gap-2"><input type="checkbox" name="draft" defaultChecked={s?.is_draft_guideline} className="size-5" /> This is a DRAFT guideline (not final)</label>
    </AdminForm>
  );
}
