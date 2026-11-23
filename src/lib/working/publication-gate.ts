// Build-time and runtime barrier for publication of AI-authored working-edition material.
// Production release requires reviews for EVERY catalog entry and linked interactive dataset.
// This is intentionally stricter than the staff preview: a disclaimer is not an approval.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import type { WorkingEntry } from "./model";
import { eligibleForProduction, type ApprovalRegister, type ReviewIndex } from "./publication-policy";

// Specialised interactive labs and clinical graphics are content too.
// Do not allow an approved text catalog to expose unreviewed lab datasets through APIs.
export const PUBLICATION_DATASETS = [
  "working-abg.json",
  "working-aline.json",
  "working-case-visuals.json",
  "working-crrt.json",
  "working-defib.json",
  "working-ecg.json",
  "working-gcs-cases.json",
  "working-infusion-cases.json",
  "working-news2-cases.json",
  "working-paths.json",
  "working-transfusion.json",
  "working-waveforms.json",
] as const;

export interface PublicationResult {
  ready: boolean;
  catalogBlocked: number;
  assetsBlocked: string[];
  examples: { key: string; reason: string }[];
}

export function checkProductionPublication(
  catalog: WorkingEntry[],
  root = process.cwd(),
): PublicationResult {
  const register = JSON.parse(readFileSync(path.join(root, "content/publication-approvals.json"), "utf8")) as ApprovalRegister & {
    lab_approvals?: { file: string; sha256: string; clinical_reviewer_id: string; licence_reviewer_id: string; rights_clearance_reference: string; publisher_id: string; commercial_use_cleared: boolean; reviewed_at: string }[];
  };
  const index = JSON.parse(readFileSync(path.join(root, "src/content/draft-index.json"), "utf8")) as ReviewIndex;
  const result = eligibleForProduction(catalog, register, index);
  const labApprovals = register.lab_approvals ?? [];
  const assetsBlocked: string[] = [];
  const isNamed = (s: unknown): s is string => typeof s === "string" && s.trim().length > 2 && !/^(pending|tbd|ai|unknown)$/i.test(s.trim());
  for (const file of PUBLICATION_DATASETS) {
    const matches = labApprovals.filter((e) => e.file === file);
    const a = matches[0];
    if (matches.length !== 1 || !a || !a.commercial_use_cleared ||
        !isNamed(a.clinical_reviewer_id) || !isNamed(a.licence_reviewer_id) ||
        !isNamed(a.rights_clearance_reference) || !isNamed(a.publisher_id) ||
        !/^\d{4}-\d\d-\d\d$/.test(a.reviewed_at) ||
        a.clinical_reviewer_id === a.publisher_id) {
      assetsBlocked.push(file);
      continue;
    }
    const sha = createHash("sha256").update(readFileSync(path.join(root, "content", file))).digest("hex");
    if (!/^[a-f0-9]{64}$/.test(a.sha256) || a.sha256 !== sha) assetsBlocked.push(file);
  }
  return {
    ready: catalog.length > 0 && result.blocked.length === 0 && assetsBlocked.length === 0,
    catalogBlocked: result.blocked.length,
    assetsBlocked,
    examples: result.blocked.slice(0, 8),
  };
}
