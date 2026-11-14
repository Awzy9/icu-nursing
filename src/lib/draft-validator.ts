// Validates Phase 2 content drafts. Drafts must never claim clinical review.
export type DraftIssue = { rule: string; message: string };

const REQUIRED_META = ["topic_id", "title", "status", "origin", "clinically_reviewed", "sources", "independently_written_note"];
const FORBIDDEN_STATUS = /^(approved|published|reviewed|clinically[_ ]reviewed|in_review)$/i;

export function parseFrontMatter(text: string): Record<string, string> {
  const m = /^---\n([\s\S]*?)\n---/.exec(text);
  const body = m?.[1];
  const meta: Record<string, string> = {};
  if (!body) return meta;
  for (const line of body.split("\n")) {
    const i = line.indexOf(":");
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return meta;
}

export function validateDraft(text: string): DraftIssue[] {
  const issues: DraftIssue[] = [];
  const add = (rule: string, message: string) => issues.push({ rule, message });
  const meta = parseFrontMatter(text);
  for (const k of REQUIRED_META) if (!(k in meta)) add("meta", `missing front-matter field: ${k}`);
  if (meta.status && FORBIDDEN_STATUS.test(meta.status.replace(/["']/g, ""))) add("status", "draft status must be DRAFT");
  if (meta.status && meta.status.replace(/["']/g, "") !== "DRAFT") add("status", "status must be DRAFT");
  if (meta.clinically_reviewed !== "false") add("review", "clinically_reviewed must be false");
  if (meta.origin !== "ai_generated") add("origin", "origin must be ai_generated for AI-assisted drafts");
  if (/^clinical_reviewers:\s*\[\s*[^\]\s]/m.test(text)) add("review", "clinical_reviewers must be empty");
  if (/^published_at:\s*\S/m.test(text)) add("review", "published_at must be empty");
  if (!/NOT clinically reviewed/i.test(text)) add("banner", "missing 'NOT clinically reviewed' banner");
  for (const h of ["## 1. Overview", "## 2. Learning objectives", "## 11. Nursing interventions within scope", "## 12. Escalation", "## 17. MCQs", "## 18. References", "## 19. Local protocol note"]) {
    if (!text.includes(h)) add("section", `missing section: ${h}`);
  }
  if (!/Independent nursing/.test(text) || !/prescriber/i.test(text)) add("scope", "must label independent nursing vs prescriber decisions");
  const mcqs = (text.match(/^\*\*Q\d/gm) ?? []).length;
  if (mcqs < 5) add("mcq", `needs at least 5 MCQs (found ${mcqs})`);
  if (!/https?:\/\//.test(text) || !/accessed \d{4}-\d{2}-\d{2}|accessed 20/.test(text)) add("refs", "references need URLs and access dates");
  // No unreviewed dosing: numeric dose/rate patterns are blocked until a pharmacist signs off.
  if (/\b\d+(\.\d+)?\s?(mcg|µg|mg|g|units?|mEq|mmol|mL)\s?(\/|per)\s?(kg|min|h|hr|hour|minute)\b/i.test(text)) add("dosing", "contains dose/rate pattern; not allowed without pharmacist review");
  if (/\b(approved by|reviewed by|signed off by|endorsed by)\b/i.test(text)) add("review", "must not claim approval/review");
  return issues;
}
