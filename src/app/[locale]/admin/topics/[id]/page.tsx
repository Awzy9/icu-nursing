import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { AdminForm } from "@/components/admin/admin-form";
import { TopicFields } from "@/components/admin/topic-fields";
import { CODE_LABELS, REVIEW_CODES, StatusBadge } from "@/components/admin/ui";
import { Callout } from "@/components/ui/feedback";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { requireStaff } from "@/lib/auth";
import { ACTION_SCOPES } from "@/lib/content/types";
import { formatDateTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import * as A from "../../actions";

type Loc = Record<string, string>;
interface Topic { id: string; slug: string; domain_id: string; kind: string; origin: string; status: string; title: Loc; summary: Loc; level: string; est_minutes: number; curriculum_id: string | null; required_review_roles: string[]; jurisdiction_scope: string; guideline_note: string | null; author_id: string | null; published_version_id: string | null; last_reviewed_at: string | null; next_review_at: string | null }
interface Section { id: string; kind: string; sort: number; title: Loc; body: Loc }
interface ScopeAction { id: string; scope: string; text: Loc; institutional_protocol_required: boolean; jurisdiction_note: Loc | null }
interface Ref { source_id: string; citation: string | null; pinpoint: string | null; independently_written_note: string | null; draft_acknowledged: boolean; sources: { organization: string; title: string; is_draft_guideline: boolean; licence_class: string } }
interface Img { id: string; storage_path: string; alt_text: Loc; licence: string; licence_class: string; is_original: boolean }
interface Version { id: string; version_no: number; status: string; submitted_at: string; published_at: string | null; required_review_roles: string[]; origin: string }
interface Review { version_id: string; specialty: string; decision: string; comments: string | null; reviewed_at: string }
interface Assignment { id: string; version_id: string; reviewer_id: string; specialty: string }
interface Reviewer { id: string; display_name: string | null; email: string | null }

const H2 = ({ id, children }: { id: string; children: React.ReactNode }) => <h2 id={id} className="text-xl font-semibold">{children}</h2>;

export default async function TopicEditor({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const { user, roles } = await requireStaff(locale);
  const db = (await createClient())!;
  const { data: t } = await db.from("topics").select("*").eq("id", id).maybeSingle();
  if (!t) notFound();
  const topic = t as unknown as Topic;

  const [sec, act, refs, imgs, vers, srcs, doms, probs] = await Promise.all([
    db.from("topic_sections").select("*").eq("topic_id", id).order("sort"),
    db.from("topic_actions").select("*").eq("topic_id", id).order("sort"),
    db.from("topic_references").select("source_id, citation, pinpoint, independently_written_note, draft_acknowledged, sources(organization, title, is_draft_guideline, licence_class)").eq("topic_id", id),
    db.from("topic_images").select("*").eq("topic_id", id).order("sort"),
    db.from("content_versions").select("id, version_no, status, submitted_at, published_at, required_review_roles, origin").eq("topic_id", id).order("version_no", { ascending: false }),
    db.from("sources").select("id, organization, title, is_draft_guideline, licence_class").order("organization"),
    db.from("public_domains").select("id, title").order("sort"),
    db.rpc("validate_topic_for_review", { p_topic: id }),
  ]);
  const sections = (sec.data ?? []) as unknown as Section[];
  const actions = (act.data ?? []) as unknown as ScopeAction[];
  const references = (refs.data ?? []) as unknown as Ref[];
  const images = (imgs.data ?? []) as unknown as Img[];
  const versions = (vers.data ?? []) as unknown as Version[];
  const sources = (srcs.data ?? []) as unknown as { id: string; organization: string; title: string; is_draft_guideline: boolean; licence_class: string }[];
  const domains = ((doms.data ?? []) as unknown as { id: string; title: Loc }[]).map((d) => ({ id: d.id, title: d.title.en ?? "" }));
  const problems = (probs.data ?? []) as string[];
  const vIds = versions.map((v) => v.id);
  const [{ data: revData }, { data: asgData }, { data: auditData }] = await Promise.all([
    vIds.length ? db.from("content_reviews").select("version_id, specialty, decision, comments, reviewed_at").in("version_id", vIds).order("reviewed_at") : Promise.resolve({ data: [] }),
    vIds.length ? db.from("review_assignments").select("id, version_id, reviewer_id, specialty").in("version_id", vIds) : Promise.resolve({ data: [] }),
    roles.includes("admin") ? db.from("audit_log").select("at, action, actor, details").eq("entity_type", "topic").eq("entity_id", id).order("id", { ascending: false }).limit(30) : Promise.resolve({ data: [] }),
  ]);
  const reviews = (revData ?? []) as unknown as Review[];
  const assignments = (asgData ?? []) as unknown as Assignment[];
  const audit = (auditData ?? []) as unknown as { at: string; action: string; actor: string | null; details: Record<string, unknown> }[];
  const canAssign = roles.includes("publisher") || roles.includes("admin");
  let reviewers: Reviewer[] = [];
  if (canAssign) {
    const { data } = await db.from("profiles").select("id, display_name, email");
    reviewers = (data ?? []) as unknown as Reviewer[];
  }

  const isAuthor = topic.author_id === user.id && roles.includes("author");
  const isOwnerOrAdmin = isAuthor || roles.includes("admin");
  const editable = (topic.status === "draft" || topic.status === "changes_requested") && topic.kind === "clinical" && isOwnerOrAdmin;
  const inReview = versions.find((v) => v.status === "in_review");
  const approved = versions.find((v) => v.status === "approved");
  const myAssignments = assignments.filter((a) => a.reviewer_id === user.id && versions.find((v) => v.id === a.version_id)?.status === "in_review");
  const superseded = versions.filter((v) => v.status === "superseded");
  const nameOf = (uid: string) => reviewers.find((r) => r.id === uid)?.display_name ?? reviewers.find((r) => r.id === uid)?.email ?? uid.slice(0, 8);

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2"><StatusBadge status={topic.status} />{topic.kind === "demo_synthetic" ? <span className="text-sm text-muted-foreground">Synthetic demo (not editable, not reviewable)</span> : null}{topic.origin !== "human" ? <span className="text-sm font-medium text-warning-foreground">Origin: {topic.origin.replace("_", "-")}</span> : null}</div>
        <h1 className="text-3xl font-bold">{topic.title.en}</h1>
        <p className="text-sm text-muted-foreground">Last reviewed: {topic.last_reviewed_at ? formatDateTime(topic.last_reviewed_at, locale) : "—"} · Next review due: {topic.next_review_at ? formatDateTime(topic.next_review_at, locale) : "—"}</p>
      </header>

      <section aria-labelledby="wf" className="space-y-4 rounded-lg border border-border bg-card p-4">
        <H2 id="wf">Publication workflow</H2>
        <p className="text-sm text-muted-foreground">Draft → clinical review → approved → published. These rules are enforced by the database, not just this page. Approval can only be recorded by assigned human clinical reviewers.</p>
        {editable ? (problems.length ? <Callout tone="warning" title="Not ready for review yet"><ul className="list-disc ps-5">{problems.map((p) => <li key={p}>{p}</li>)}</ul></Callout> : <Callout tone="success" role="status">All submission checks pass.</Callout>) : null}
        <div className="space-y-2">
          <p className="text-sm"><b>Required reviewer roles:</b> {topic.required_review_roles.map((c) => `${c} (${CODE_LABELS[c] ?? c})`).join("; ")} — <span className="text-muted-foreground">set only by a publisher or administrator, so authors cannot choose who reviews their own work.</span></p>
          {(roles.includes("publisher") || roles.includes("admin")) && (topic.status === "draft" || topic.status === "changes_requested") && topic.kind === "clinical" ? (
            <AdminForm action={A.setRequiredRolesAction} submit="Save reviewer roles" variant="outline">
              <input type="hidden" name="topicId" value={id} />
              <fieldset className="grid gap-1 sm:grid-cols-2">
                <legend className="mb-1 text-sm font-medium">Required reviewer roles before publication</legend>
                {REVIEW_CODES.map((c) => <label key={c} className="flex min-h-11 items-center gap-2"><input type="checkbox" name="roles" value={c} defaultChecked={topic.required_review_roles.includes(c)} className="size-5" /> <span>{c} — {CODE_LABELS[c]}</span></label>)}
              </fieldset>
            </AdminForm>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-4">
          {editable ? <AdminForm action={A.submitAction} submit="Submit for clinical review"><input type="hidden" name="topicId" value={id} /></AdminForm> : null}
          {topic.status === "in_review" && isOwnerOrAdmin ? <AdminForm action={A.withdrawAction} submit="Withdraw submission" variant="outline"><input type="hidden" name="topicId" value={id} /></AdminForm> : null}
          {topic.status === "published" && isOwnerOrAdmin ? <AdminForm action={A.startRevisionAction} submit="Start a new revision" variant="outline"><input type="hidden" name="topicId" value={id} /></AdminForm> : null}
        </div>

        {canAssign && inReview ? (
          <AdminForm action={A.assignReviewerAction} submit="Assign reviewer" className="grid gap-3 md:grid-cols-3">
            <input type="hidden" name="versionId" value={inReview.id} />
            <Field label="Reviewer" htmlFor="reviewerId"><Select id="reviewerId" name="reviewerId" required>{reviewers.map((r) => <option key={r.id} value={r.id}>{r.display_name ?? r.email}</option>)}</Select></Field>
            <Field label={`Role for version ${inReview.version_no}`} htmlFor="specialty"><Select id="specialty" name="specialty" required>{inReview.required_review_roles.map((c) => <option key={c} value={c}>{c} — {CODE_LABELS[c]}</option>)}</Select></Field>
          </AdminForm>
        ) : null}

        {myAssignments.map((a) => (
          <AdminForm key={a.id} action={A.recordReviewAction} submit="Record my review" className="space-y-3 rounded-md border border-border p-3">
            <p className="font-medium">Your review as {a.specialty} — version {versions.find((v) => v.id === a.version_id)?.version_no}</p>
            <input type="hidden" name="versionId" value={a.version_id} /><input type="hidden" name="specialty" value={a.specialty} />
            <Field label="Decision" htmlFor={`d-${a.id}`}><Select id={`d-${a.id}`} name="decision" required><option value="approve">Approve</option><option value="request_changes">Request changes</option><option value="reject">Reject</option></Select></Field>
            <Field label="Comments (required unless approving)" htmlFor={`c-${a.id}`}><Textarea id={`c-${a.id}`} name="comments" maxLength={4000} /></Field>
            <p className="text-sm text-muted-foreground">By submitting you attest that you personally reviewed this version.</p>
          </AdminForm>
        ))}

        {roles.includes("publisher") && approved && topic.status === "approved" ? (
          <AdminForm action={A.publishAction} submit={`Publish version ${approved.version_no}`} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="topicId" value={id} /><input type="hidden" name="versionId" value={approved.id} />
            <Field label="Next review due in (months)" htmlFor="months"><Input id="months" name="months" type="number" min={1} max={36} defaultValue={12} /></Field>
          </AdminForm>
        ) : null}

        {roles.includes("publisher") && superseded.length ? (
          <AdminForm action={A.rollbackAction} submit="Roll back to this version" variant="outline" confirm="Restore this earlier version for learners?" className="grid gap-3 md:grid-cols-2">
            <input type="hidden" name="topicId" value={id} />
            <Field label="Earlier published version" htmlFor="rb-v"><Select id="rb-v" name="versionId">{superseded.map((v) => <option key={v.id} value={v.id}>Version {v.version_no}</option>)}</Select></Field>
            <Field label="Reason (recorded in the audit log)" htmlFor="rb-r"><Input id="rb-r" name="reason" required minLength={10} maxLength={500} /></Field>
          </AdminForm>
        ) : null}

        {roles.includes("publisher") && topic.status !== "archived" ? (
          <AdminForm action={A.archiveAction} submit="Archive (unpublish)" variant="danger" confirm="Archive this topic and hide it from learners?" className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="topicId" value={id} />
            <Field label="Reason" htmlFor="ar-r"><Input id="ar-r" name="reason" required minLength={10} maxLength={500} /></Field>
          </AdminForm>
        ) : null}
        {roles.includes("admin") && topic.status === "archived" ? <AdminForm action={A.restoreAction} submit="Restore from archive" variant="outline"><input type="hidden" name="topicId" value={id} /></AdminForm> : null}
      </section>

      <section aria-labelledby="meta" className="space-y-3">
        <H2 id="meta">Topic details</H2>
        <AdminForm action={A.updateTopicAction} submit="Save details">
          <input type="hidden" name="id" value={id} />
          <TopicFields domains={domains} disabled={!editable} d={{ domainId: topic.domain_id, slug: topic.slug, titleEn: topic.title.en, titleAr: topic.title.ar, summaryEn: topic.summary.en, summaryAr: topic.summary.ar, level: topic.level, minutes: topic.est_minutes, curriculumId: topic.curriculum_id ?? undefined, guidelineNote: topic.guideline_note ?? undefined, jurisdiction: topic.jurisdiction_scope, origin: topic.origin }} />
        </AdminForm>
        {!editable ? <p className="text-sm text-muted-foreground">Editing is locked while the topic is {topic.status.replace("_", " ")} (or you are not its author). Start a revision to edit a published topic.</p> : null}
      </section>

      <section aria-labelledby="secs" className="space-y-4">
        <H2 id="secs">Sections</H2>
        {sections.map((s) => (
          <details key={s.id} className="rounded-md border border-border p-3"><summary className="min-h-11 cursor-pointer font-medium leading-[2.75rem]">{s.sort}. {s.title.en} <span className="text-sm text-muted-foreground">({s.kind})</span></summary>
            <SectionForm topicId={id} s={s} disabled={!editable} />
            {editable ? <AdminForm action={A.deleteSectionAction} submit="Delete section" variant="danger" confirm="Delete this section?" className="mt-2"><input type="hidden" name="id" value={s.id} /></AdminForm> : null}
          </details>
        ))}
        {editable ? <details className="rounded-md border border-dashed border-border p-3"><summary className="min-h-11 cursor-pointer font-medium leading-[2.75rem]">Add a section</summary><SectionForm topicId={id} /></details> : null}
      </section>

      <section aria-labelledby="acts" className="space-y-3">
        <H2 id="acts">Nursing actions and scope</H2>
        <ul className="space-y-2">{actions.map((a) => <li key={a.id} className="flex flex-wrap items-start justify-between gap-2 rounded-md border border-border p-2"><span><b>{a.scope.replaceAll("_", " ")}</b>: {a.text.en}{a.institutional_protocol_required ? " (institutional protocol required)" : ""}{a.jurisdiction_note ? ` — ${a.jurisdiction_note.en}` : ""}</span>{editable ? <AdminForm action={A.deleteScopeActionAction} submit="Remove" variant="ghost"><input type="hidden" name="id" value={a.id} /></AdminForm> : null}</li>)}</ul>
        {editable ? (
          <AdminForm action={A.addScopeActionAction} submit="Add action" className="grid gap-3 md:grid-cols-2">
            <input type="hidden" name="topicId" value={id} />
            <Field label="Scope" htmlFor="sc"><Select id="sc" name="scope">{ACTION_SCOPES.map((s) => <option key={s} value={s}>{s.replaceAll("_", " ")}</option>)}</Select></Field>
            <Field label="Text (English)" htmlFor="sc-en"><Input id="sc-en" name="textEn" required maxLength={500} /></Field>
            <Field label="Text (Arabic, optional)" htmlFor="sc-ar"><Input id="sc-ar" name="textAr" lang="ar" dir="rtl" maxLength={500} /></Field>
            <Field label="Jurisdiction note (optional)" htmlFor="sc-j"><Input id="sc-j" name="jurisdictionNote" maxLength={300} /></Field>
            <label className="flex min-h-11 items-center gap-2"><input type="checkbox" name="protocol" className="size-5" /> Institutional protocol required</label>
          </AdminForm>
        ) : null}
      </section>

      <section aria-labelledby="refs" className="space-y-3">
        <H2 id="refs">References</H2>
        <ul className="space-y-2">{references.map((r) => <li key={r.source_id} className="flex flex-wrap items-start justify-between gap-2 rounded-md border border-border p-2"><span><b>{r.sources.organization}</b>: {r.sources.title} <span className="text-xs">[{r.sources.licence_class}]</span>{r.sources.is_draft_guideline ? <b className="ms-2 text-danger-foreground">DRAFT guideline{r.draft_acknowledged ? " (acknowledged — will be labelled)" : " — acknowledgement required"}</b> : null}{r.independently_written_note ? <span className="block text-sm">Independently written: {r.independently_written_note}</span> : null}</span>{editable ? <AdminForm action={A.deleteReferenceAction} submit="Remove" variant="ghost"><input type="hidden" name="topicId" value={id} /><input type="hidden" name="sourceId" value={r.source_id} /></AdminForm> : null}</li>)}</ul>
        {editable ? (
          <AdminForm action={A.addReferenceAction} submit="Add / update reference" className="grid gap-3 md:grid-cols-2">
            <input type="hidden" name="topicId" value={id} />
            <Field label="Source" htmlFor="rf-s"><Select id="rf-s" name="sourceId" required>{sources.map((s) => <option key={s.id} value={s.id}>{s.organization} — {s.title.slice(0, 70)} [{s.licence_class}]{s.is_draft_guideline ? " DRAFT" : ""}</option>)}</Select></Field>
            <Field label="Citation" htmlFor="rf-c"><Input id="rf-c" name="citation" maxLength={500} /></Field>
            <Field label="Pinpoint (section/page)" htmlFor="rf-p"><Input id="rf-p" name="pinpoint" maxLength={200} /></Field>
            <Field label="What was independently written (required for RED sources)" htmlFor="rf-i"><Input id="rf-i" name="independent" maxLength={500} /></Field>
            <label className="flex min-h-11 items-center gap-2"><input type="checkbox" name="draftAck" className="size-5" /> I acknowledge this is a DRAFT guideline and it must be labelled as not final</label>
          </AdminForm>
        ) : null}
      </section>

      <section aria-labelledby="imgs" className="space-y-3">
        <H2 id="imgs">Images (metadata, alt text, licence)</H2>
        <p className="text-sm text-muted-foreground">Files are stored in the <code>topic-images</code> bucket under this topic&apos;s folder. Every image needs English alt text and a verified licence (or must be original) before the topic can be submitted for review.</p>
        <ul className="space-y-2">{images.map((i) => <li key={i.id} className="flex flex-wrap items-start justify-between gap-2 rounded-md border border-border p-2"><span><code>{i.storage_path}</code> — alt: {i.alt_text.en ?? <b className="text-danger-foreground">missing</b>} — {i.licence} [{i.licence_class}]{i.is_original ? " original" : ""}</span>{editable ? <AdminForm action={A.deleteImageAction} submit="Remove" variant="ghost"><input type="hidden" name="id" value={i.id} /></AdminForm> : null}</li>)}</ul>
        {editable ? (
          <AdminForm action={A.uploadImageAction} submit="Upload image" className="grid gap-3 md:grid-cols-2">
            <input type="hidden" name="topicId" value={id} />
            <Field label="Image file (PNG, JPEG or WebP, max 2 MB)" htmlFor="im-f"><Input id="im-f" name="file" type="file" accept="image/png,image/jpeg,image/webp" required /></Field>
            <Field label="Alt text (English)" htmlFor="im-a"><Input id="im-a" name="altEn" maxLength={300} /></Field>
            <Field label="Alt text (Arabic, optional)" htmlFor="im-ar"><Input id="im-ar" name="altAr" lang="ar" dir="rtl" maxLength={300} /></Field>
            <Field label="Caption (English)" htmlFor="im-c"><Input id="im-c" name="captionEn" maxLength={300} /></Field>
            <Field label="Licence" htmlFor="im-l"><Input id="im-l" name="licence" required defaultValue="unknown" maxLength={100} /></Field>
            <Field label="Licence class" htmlFor="im-lc"><Select id="im-lc" name="licenceClass" defaultValue="UNVERIFIED"><option>GREEN</option><option>YELLOW</option><option>RED</option><option>UNVERIFIED</option></Select></Field>
            <Field label="Attribution" htmlFor="im-at"><Input id="im-at" name="attribution" maxLength={300} /></Field>
            <Field label="Source URL" htmlFor="im-u"><Input id="im-u" name="sourceUrl" maxLength={500} /></Field>
            <label className="flex min-h-11 items-center gap-2"><input type="checkbox" name="original" className="size-5" /> Original illustration created for this platform</label>
          </AdminForm>
        ) : null}
      </section>

      <section aria-labelledby="hist" className="space-y-3">
        <H2 id="hist">Version history</H2>
        {versions.length ? versions.map((v) => (
          <div key={v.id} className="rounded-md border border-border p-3">
            <p className="flex flex-wrap items-center gap-2"><b>Version {v.version_no}</b> <StatusBadge status={v.status} /> <span className="text-sm text-muted-foreground">submitted {formatDateTime(v.submitted_at, locale)}{v.published_at ? ` · published ${formatDateTime(v.published_at, locale)}` : ""} · needs {v.required_review_roles.join(", ")} · origin {v.origin}</span></p>
            <ul className="mt-1 list-disc ps-6 text-sm">
              {assignments.filter((a) => a.version_id === v.id).map((a) => { const r = reviews.find((x) => x.version_id === v.id && x.specialty === a.specialty); return <li key={a.id}>{a.specialty}: {nameOf(a.reviewer_id)} — {r ? `${r.decision.replace("_", " ")}${r.comments ? ` — “${r.comments}”` : ""} (${formatDateTime(r.reviewed_at, locale)})` : "awaiting review"}</li>; })}
            </ul>
          </div>
        )) : <p className="text-muted-foreground">No versions yet.</p>}
      </section>

      {roles.includes("admin") ? (
        <section aria-labelledby="aud" className="space-y-2"><H2 id="aud">Audit trail (latest 30)</H2>
          <ul className="space-y-1 text-sm">{audit.map((a, i) => <li key={i}><time dateTime={a.at}>{formatDateTime(a.at, locale)}</time> — {a.action} by {a.actor ? a.actor.slice(0, 8) : "system"}</li>)}</ul>
        </section>
      ) : null}
    </div>
  );
}

const SECTION_KINDS = ["overview","objectives","why_it_matters","physiology","pathophysiology","assessment","nursing_responsibilities","monitoring","findings","red_flags","interventions","escalation","complications","documentation","bedside_example","case","local_protocol","other"];
function SectionForm({ topicId, s, disabled }: { topicId: string; s?: Section; disabled?: boolean }) {
  const k = s?.id ?? "new";
  return (
    <AdminForm action={A.saveSectionAction} submit="Save section" className="mt-3 grid gap-3 md:grid-cols-2">
      <input type="hidden" name="topicId" value={topicId} /><input type="hidden" name="id" value={s?.id ?? ""} />
      <fieldset disabled={disabled} className="contents">
        <Field label="Type" htmlFor={`k-${k}`}><Select id={`k-${k}`} name="kind" defaultValue={s?.kind ?? "overview"}>{SECTION_KINDS.map((x) => <option key={x} value={x}>{x.replaceAll("_", " ")}</option>)}</Select></Field>
        <Field label="Order" htmlFor={`o-${k}`}><Input id={`o-${k}`} name="sort" type="number" min={0} max={1000} defaultValue={s?.sort ?? 0} /></Field>
        <Field label="Title (English)" htmlFor={`te-${k}`}><Input id={`te-${k}`} name="titleEn" defaultValue={s?.title.en} required maxLength={200} /></Field>
        <Field label="Title (Arabic, optional)" htmlFor={`ta-${k}`}><Input id={`ta-${k}`} name="titleAr" lang="ar" dir="rtl" defaultValue={s?.title.ar} maxLength={200} /></Field>
        <Field label="Text (English). Blank line = new paragraph; lines starting with '- ' = bullets" htmlFor={`be-${k}`}><Textarea id={`be-${k}`} name="bodyEn" defaultValue={s?.body.en} required maxLength={20000} /></Field>
        <Field label="Text (Arabic, optional)" htmlFor={`ba-${k}`}><Textarea id={`ba-${k}`} name="bodyAr" lang="ar" dir="rtl" defaultValue={s?.body.ar} maxLength={20000} /></Field>
      </fieldset>
    </AdminForm>
  );
}
