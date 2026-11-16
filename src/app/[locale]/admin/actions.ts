"use server";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { z } from "zod";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { ACTION_SCOPES, LEVELS } from "@/lib/content/types";
import { validateImage } from "@/lib/image-validation";
import { rateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";

export interface AdminState { error?: string; ok?: boolean; message?: string }
const REVIEW_CODES = ["NE", "BN", "PH", "RT", "CCP", "NEPH", "NEURO", "IPC", "OTHER"] as const;
const SECTION_KINDS = ["overview","objectives","why_it_matters","physiology","pathophysiology","assessment","nursing_responsibilities","monitoring","findings","red_flags","interventions","escalation","complications","documentation","bedside_example","case","local_protocol","other"] as const;

const uuid = z.string().uuid();
const req = (max: number) => z.string().trim().min(1).max(max);
const opt = (max: number) => z.string().trim().max(max).optional().transform((v) => (v ? v : undefined));
const bool = z.preprocess((v) => v === "on" || v === "true" || v === "1", z.boolean());
const slug = z.string().trim().regex(/^[a-z0-9-]+$/).max(80);

function fd(form: FormData) {
  const o: Record<string, unknown> = {};
  for (const [k, v] of form.entries()) if (typeof v === "string") o[k] = k in o ? [].concat(o[k] as never, v as never) : v;
  return o;
}
const loc = (en: string, ar?: string) => (ar ? { en, ar } : { en });

/** Best-effort per-instance throttle for staff actions (the database enforces authorisation; this limits abuse and runaway clients). */
async function throttled(bucket: string, limit: number): Promise<boolean> {
  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "unknown").trim();
  return rateLimit(`${bucket}:${ip}`, limit, 60_000);
}

async function run<T extends z.ZodTypeAny>(form: FormData, schema: T, fn: (v: z.infer<T>, db: NonNullable<Awaited<ReturnType<typeof createClient>>>) => Promise<{ error: { message: string } | null }>, message?: string): Promise<AdminState> {
  const db = await createClient();
  if (!db) return { error: "Backend not configured (demonstration mode)." };
  if (!(await throttled("admin", 120))) return { error: "Too many actions in a short time. Please wait a moment." };
  const parsed = schema.safeParse(fd(form));
  if (!parsed.success) return { error: `Invalid input: ${parsed.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}` };
  const { error } = await fn(parsed.data, db);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { ok: true, message };
}

// ---- Topic working copy ---------------------------------------------------------------------
const topicFields = z.object({
  domainId: uuid, slug, titleEn: req(200), titleAr: opt(200), summaryEn: req(600), summaryAr: opt(600),
  level: z.enum(LEVELS as unknown as [string, ...string[]]), minutes: z.coerce.number().int().min(1).max(240),
  curriculumId: opt(40), guidelineNote: opt(500), jurisdiction: z.string().trim().min(1).max(80).default("international"),
  origin: z.enum(["human", "ai_assisted", "ai_generated"]),
});
const topicRow = (v: z.infer<typeof topicFields>) => ({
  domain_id: v.domainId, slug: v.slug, title: loc(v.titleEn, v.titleAr), summary: loc(v.summaryEn, v.summaryAr), level: v.level, est_minutes: v.minutes,
  curriculum_id: v.curriculumId ?? null, guideline_note: v.guidelineNote ?? null, jurisdiction_scope: v.jurisdiction, origin: v.origin,
});

export async function createTopicAction(_p: AdminState, form: FormData): Promise<AdminState> {
  const locale = await getLocale();
  const db = await createClient();
  if (!db) return { error: "Backend not configured (demonstration mode)." };
  const parsed = topicFields.safeParse(fd(form));
  if (!parsed.success) return { error: `Invalid input: ${parsed.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}` };
  const { data, error } = await db.from("topics").insert(topicRow(parsed.data)).select("id").single();
  if (error) return { error: error.message };
  redirect({ href: `/admin/topics/${data.id}`, locale });
  return { ok: true };
}

export async function updateTopicAction(_p: AdminState, form: FormData): Promise<AdminState> {
  return run(form, topicFields.extend({ id: uuid }), async (v, db) => db.from("topics").update(topicRow(v)).eq("id", v.id), "Saved.");
}

export async function deleteTopicAction(_p: AdminState, form: FormData): Promise<AdminState> {
  const locale = await getLocale();
  const r = await run(form, z.object({ id: uuid }), async (v, db) => db.from("topics").delete().eq("id", v.id));
  if (r.ok) redirect({ href: "/admin/topics", locale });
  return r;
}

export async function setRequiredRolesAction(_p: AdminState, form: FormData): Promise<AdminState> {
  return run(form, z.object({ topicId: uuid, roles: z.preprocess((v) => (Array.isArray(v) ? v : v ? [v] : []), z.array(z.enum(REVIEW_CODES)).min(1)) }),
    async (v, db) => db.rpc("set_required_roles", { p_topic: v.topicId, p_roles: v.roles }), "Reviewer roles saved.");
}

// ---- Sections / actions / references / images ----------------------------------------------
export async function saveSectionAction(_p: AdminState, form: FormData): Promise<AdminState> {
  return run(form, z.object({ id: uuid.optional().or(z.literal("").transform(() => undefined)), topicId: uuid, kind: z.enum(SECTION_KINDS), sort: z.coerce.number().int().min(0).max(1000), titleEn: req(200), titleAr: opt(200), bodyEn: req(20000), bodyAr: opt(20000) }),
    async (v, db) => {
      const row = { topic_id: v.topicId, kind: v.kind, sort: v.sort, title: loc(v.titleEn, v.titleAr), body: loc(v.bodyEn, v.bodyAr) };
      return v.id ? db.from("topic_sections").update(row).eq("id", v.id) : db.from("topic_sections").insert(row);
    }, "Section saved.");
}
export async function deleteSectionAction(_p: AdminState, form: FormData): Promise<AdminState> {
  return run(form, z.object({ id: uuid }), async (v, db) => db.from("topic_sections").delete().eq("id", v.id));
}

export async function addScopeActionAction(_p: AdminState, form: FormData): Promise<AdminState> {
  return run(form, z.object({ topicId: uuid, scope: z.enum(ACTION_SCOPES as unknown as [string, ...string[]]), textEn: req(500), textAr: opt(500), protocol: bool, jurisdictionNote: opt(300) }),
    async (v, db) => db.from("topic_actions").insert({ topic_id: v.topicId, scope: v.scope, text: loc(v.textEn, v.textAr), institutional_protocol_required: v.protocol, jurisdiction_note: v.jurisdictionNote ? { en: v.jurisdictionNote } : null }), "Action added.");
}
export async function deleteScopeActionAction(_p: AdminState, form: FormData): Promise<AdminState> {
  return run(form, z.object({ id: uuid }), async (v, db) => db.from("topic_actions").delete().eq("id", v.id));
}

export async function addReferenceAction(_p: AdminState, form: FormData): Promise<AdminState> {
  return run(form, z.object({ topicId: uuid, sourceId: uuid, citation: opt(500), pinpoint: opt(200), independent: opt(500), draftAck: bool }),
    async (v, db) => db.from("topic_references").upsert({ topic_id: v.topicId, source_id: v.sourceId, citation: v.citation ?? null, pinpoint: v.pinpoint ?? null, independently_written_note: v.independent ?? null, draft_acknowledged: v.draftAck }), "Reference saved.");
}
export async function deleteReferenceAction(_p: AdminState, form: FormData): Promise<AdminState> {
  return run(form, z.object({ topicId: uuid, sourceId: uuid }), async (v, db) => db.from("topic_references").delete().eq("topic_id", v.topicId).eq("source_id", v.sourceId));
}

const imageMeta = z.object({ topicId: uuid, altEn: opt(300), altAr: opt(300), captionEn: opt(300), licence: req(100), licenceClass: z.enum(["GREEN", "YELLOW", "RED", "UNVERIFIED"]), attribution: opt(300), sourceUrl: opt(500), original: bool });

/** Validates the file's real type/size, stores it under "<topic_id>/<uuid>.<ext>", then records its metadata. */
export async function uploadImageAction(_p: AdminState, form: FormData): Promise<AdminState> {
  const db = await createClient();
  if (!db) return { error: "Backend not configured (demonstration mode)." };
  if (!(await throttled("upload", 20))) return { error: "Too many uploads in a short time. Please wait a moment." };
  const parsed = imageMeta.safeParse(fd(form));
  if (!parsed.success) return { error: `Invalid input: ${parsed.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}` };
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose an image file." };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const check = validateImage(bytes, file.type);
  if (!check.ok) return { error: check.error };
  const v = parsed.data;
  const path = `${v.topicId}/${crypto.randomUUID()}.${check.ext}`;
  const up = await db.storage.from("topic-images").upload(path, bytes, { contentType: check.mime, upsert: false, cacheControl: "3600" });
  if (up.error) return { error: up.error.message };
  const ins = await db.from("topic_images").insert({
    topic_id: v.topicId, storage_path: path, alt_text: v.altEn ? loc(v.altEn, v.altAr) : {}, caption: v.captionEn ? { en: v.captionEn } : null,
    licence: v.licence, licence_class: v.licenceClass, attribution: v.attribution ?? null, source_url: v.sourceUrl ?? null, is_original: v.original,
  });
  if (ins.error) {
    await db.storage.from("topic-images").remove([path]); // do not leave an orphaned file
    return { error: ins.error.message };
  }
  revalidatePath("/", "layout");
  return { ok: true, message: "Image uploaded." };
}

export async function deleteImageAction(_p: AdminState, form: FormData): Promise<AdminState> {
  const db = await createClient();
  if (!db) return { error: "Backend not configured (demonstration mode)." };
  const parsed = z.object({ id: uuid }).safeParse(fd(form));
  if (!parsed.success) return { error: "Invalid input." };
  const { data } = await db.from("topic_images").select("storage_path").eq("id", parsed.data.id).maybeSingle();
  const del = await db.from("topic_images").delete().eq("id", parsed.data.id);
  if (del.error) return { error: del.error.message };
  if (data?.storage_path) await db.storage.from("topic-images").remove([data.storage_path as string]);
  revalidatePath("/", "layout");
  return { ok: true, message: "Image removed." };
}

// ---- Workflow (all authorization is enforced by the database functions) -----------------------
export async function submitAction(_p: AdminState, form: FormData): Promise<AdminState> {
  return run(form, z.object({ topicId: uuid }), async (v, db) => db.rpc("submit_for_review", { p_topic: v.topicId }), "Submitted for clinical review.");
}
export async function withdrawAction(_p: AdminState, form: FormData): Promise<AdminState> {
  return run(form, z.object({ topicId: uuid }), async (v, db) => db.rpc("withdraw_submission", { p_topic: v.topicId }), "Submission withdrawn.");
}
export async function startRevisionAction(_p: AdminState, form: FormData): Promise<AdminState> {
  return run(form, z.object({ topicId: uuid }), async (v, db) => db.rpc("start_revision", { p_topic: v.topicId }), "New revision started. The published version stays live.");
}
export async function assignReviewerAction(_p: AdminState, form: FormData): Promise<AdminState> {
  return run(form, z.object({ versionId: uuid, reviewerId: uuid, specialty: z.enum(REVIEW_CODES) }), async (v, db) => db.rpc("assign_reviewer", { p_version: v.versionId, p_reviewer: v.reviewerId, p_specialty: v.specialty }), "Reviewer assigned.");
}
export async function recordReviewAction(_p: AdminState, form: FormData): Promise<AdminState> {
  return run(form, z.object({ versionId: uuid, specialty: z.enum(REVIEW_CODES), decision: z.enum(["approve", "request_changes", "reject"]), comments: opt(4000) }),
    async (v, db) => db.rpc("record_review", { p_version: v.versionId, p_specialty: v.specialty, p_decision: v.decision, p_comments: v.comments ?? null }), "Review recorded.");
}
export async function publishAction(_p: AdminState, form: FormData): Promise<AdminState> {
  return run(form, z.object({ topicId: uuid, versionId: uuid, months: z.coerce.number().int().min(1).max(36).default(12) }), async (v, db) => db.rpc("publish_topic", { p_topic: v.topicId, p_version: v.versionId, p_review_months: v.months }), "Published.");
}
export async function rollbackAction(_p: AdminState, form: FormData): Promise<AdminState> {
  return run(form, z.object({ topicId: uuid, versionId: uuid, reason: req(500) }), async (v, db) => db.rpc("rollback_topic", { p_topic: v.topicId, p_version: v.versionId, p_reason: v.reason }), "Rolled back.");
}
export async function archiveAction(_p: AdminState, form: FormData): Promise<AdminState> {
  return run(form, z.object({ topicId: uuid, reason: req(500) }), async (v, db) => db.rpc("archive_topic", { p_topic: v.topicId, p_reason: v.reason }), "Archived.");
}
export async function restoreAction(_p: AdminState, form: FormData): Promise<AdminState> {
  return run(form, z.object({ topicId: uuid }), async (v, db) => db.rpc("restore_topic", { p_topic: v.topicId }), "Restored.");
}

// ---- Sources and users -------------------------------------------------------------------------
export async function saveSourceAction(_p: AdminState, form: FormData): Promise<AdminState> {
  return run(form, z.object({ id: uuid.optional().or(z.literal("").transform(() => undefined)), code: opt(60), organization: req(120), title: req(300), url: opt(500).refine((u) => !u || u.startsWith("https://"), "must be https"), version: opt(200), licenceClass: z.enum(["GREEN", "YELLOW", "RED", "UNVERIFIED"]), draft: bool, checked: opt(10), note: opt(500) }),
    async (v, db) => {
      const row = { source_code: v.code ?? null, organization: v.organization, title: v.title, url: v.url ?? null, version_label: v.version ?? null, licence_class: v.licenceClass, is_draft_guideline: v.draft, last_checked: v.checked ?? null, commercial_reuse_note: v.note ?? null };
      return v.id ? db.from("sources").update(row).eq("id", v.id) : db.from("sources").insert(row);
    }, "Source saved.");
}
export async function grantRoleAction(_p: AdminState, form: FormData): Promise<AdminState> {
  return run(form, z.object({ userId: uuid, role: z.enum(["author", "clinical_reviewer", "publisher", "admin"]) }), async (v, db) => db.rpc("admin_grant_role", { p_user: v.userId, p_role: v.role }), "Role granted.");
}
export async function revokeRoleAction(_p: AdminState, form: FormData): Promise<AdminState> {
  return run(form, z.object({ userId: uuid, role: z.enum(["author", "clinical_reviewer", "publisher", "admin"]) }), async (v, db) => db.rpc("admin_revoke_role", { p_user: v.userId, p_role: v.role }), "Role revoked.");
}
export async function setSubscriptionAction(_p: AdminState, form: FormData): Promise<AdminState> {
  return run(form, z.object({ userId: uuid, plan: z.enum(["free", "premium"]), status: z.enum(["trialing", "active", "past_due", "canceled", "expired"]), days: z.coerce.number().int().min(1).max(400), reason: z.string().trim().min(5).max(300) }),
    async (v, db) => db.rpc("adm_sub_set", { p_user: v.userId, p_plan: v.plan, p_status: v.status, p_days: v.days, p_reason: v.reason }), "Subscription updated (test record).");
}
export async function setSpecialtyAction(_p: AdminState, form: FormData): Promise<AdminState> {
  return run(form, z.object({ userId: uuid, specialty: z.enum(REVIEW_CODES), enabled: bool }), async (v, db) => db.rpc("admin_set_specialty", { p_user: v.userId, p_specialty: v.specialty, p_enabled: v.enabled }), "Specialty updated.");
}
