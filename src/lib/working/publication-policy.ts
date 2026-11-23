// Fail-closed, per-revision eligibility for learner-facing production working content.
// The owner/staff draft index and the independent release approval record must BOTH agree.
// A Vercel "deployment succeeded" status is not clinical approval.
import { createHash } from "node:crypto";
import type { WorkingEntry } from "./model";

export interface ClinicalApproval {
  key: string;
  entry_sha256: string;
  source_draft_hash: string;
  clinical_reviewer_id: string;
  clinical_reviewed_at: string;
  licence_reviewer_id: string;
  rights_clearance_reference: string;
  licence_reviewed_at: string;
  publisher_id: string;
  published_approved_at: string;
  commercial_use_cleared: boolean;
}

export interface ApprovalRegister {
  schema_version: number;
  approvals: ClinicalApproval[];
}
export interface ReviewIndexEntry {
  key: string;
  hash: string;
  clinically_reviewed: boolean;
  issues: unknown[];
  sources: { id: string; licence_class: string }[];
}
export interface ReviewIndex { entries: ReviewIndexEntry[] }

export const isProductionWorkingRelease = (env: {
  CONTENT_EDITION?: string;
  NEXT_PUBLIC_APP_ENV?: string;
  VERCEL_ENV?: string;
}): boolean => env.CONTENT_EDITION === "working" && (
  env.VERCEL_ENV === "production" ||
  !["staging", "development"].includes(env.NEXT_PUBLIC_APP_ENV ?? "")
);

export const contentRevisionHash = (entry: WorkingEntry): string =>
  createHash("sha256").update(JSON.stringify(entry)).digest("hex");

// An approval is not a keyword, a boolean on a PR, or an unchanged PDF.
// Each content entry needs individually traceable human clinical, licence and publisher sign-off.
export function eligibleForProduction(
  entries: WorkingEntry[], register: ApprovalRegister, index: ReviewIndex,
): { allowed: WorkingEntry[]; blocked: { key: string; reason: string }[] } {
  const approvedByKey = new Map<string, ClinicalApproval>();
  const duplicateApprovals = new Set<string>();
  for (const item of register.approvals ?? []) {
    if (approvedByKey.has(item.key)) duplicateApprovals.add(item.key);
    approvedByKey.set(item.key, item);
  }
  const indexByKey = new Map(index.entries.map((e) => [e.key, e]));
  const allowed: WorkingEntry[] = [], blocked: { key: string; reason: string }[] = [];
  if (register.schema_version !== 1 || !Array.isArray(register.approvals) || !Array.isArray(index.entries)) {
    return { allowed, blocked: entries.map((e) => ({ key: e.key, reason: "invalid release register or draft index" })) };
  }
  const dated = (value: unknown) => typeof value === "string" && /^\d{4}-\d\d-\d\d$/.test(value);
  const named = (value: unknown) => typeof value === "string" && value.trim().length > 2 && !/^(pending|tbd|ai|unknown)$/i.test(value.trim());
  for (const e of entries) {
    // Generated topic-question derivatives are not separately listed in the draft index.
    // Both the parent and the generated question entry require review; an approval of one
    // can never silently approve the other.
    const evidenceKey = e.key.startsWith("QB-D") ? e.key.slice(3) : e.key;
    const indexed = indexByKey.get(evidenceKey);
    const a = approvedByKey.get(e.key);
    let reason: string | undefined;
    if (!indexed) reason = "draft not present in audited index";
    else if (!indexed.clinically_reviewed) reason = "human clinical review not recorded on draft";
    else if (indexed.issues.length) reason = "draft validation has open issues";
    else if (!indexed.sources.length || indexed.sources.some((s) => !s.id || s.licence_class === "UNREGISTERED")) reason = "unregistered or missing evidence sources";
    else if (duplicateApprovals.has(e.key)) reason = "duplicate approval records";
    else if (!a) reason = "no individual clinical/licence/publisher approval";
    else if (!/^[0-9a-f]{64}$/i.test(a.entry_sha256) || a.entry_sha256 !== contentRevisionHash(e)) reason = "approval does not match current lesson revision";
    else if (!/^[0-9a-f]{16}$/i.test(a.source_draft_hash) || a.source_draft_hash !== indexed.hash) reason = "evidence or source draft changed since approval";
    else if (!named(a.clinical_reviewer_id) || !named(a.licence_reviewer_id) || !named(a.rights_clearance_reference) || !named(a.publisher_id)) reason = "missing named release reviewers or rights evidence";
    else if (!dated(a.clinical_reviewed_at) || !dated(a.licence_reviewed_at) || !dated(a.published_approved_at)) reason = "missing review dates";
    else if (!a.commercial_use_cleared) reason = "commercial source rights not cleared";
    else if (a.clinical_reviewer_id === a.publisher_id) reason = "publisher approval must be independent of clinical review";
    if (reason) blocked.push({ key: e.key, reason });
    else allowed.push(e);
  }
  return { allowed, blocked };
}
