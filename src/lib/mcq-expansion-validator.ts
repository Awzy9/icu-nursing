// Validates the Phase 8 MCQ expansion drafts (content/drafts/mcq-expansion/XQ-*.md). They are unpublished drafts in the same MCQ format as the topic
// drafts and reuse the existing structure/quality rules (src/lib/draft-validator.ts). On top of those: every question carries a **Trace** line naming
// registered sources, no dose-like content, no review claims, and no near-duplicates of the 240 existing questions or of each other.
import { batchPositionIssues, mcqQuality, parseFrontMatter, parseMcqs, type DraftIssue } from "@/lib/draft-validator";

const dose = /\b\d+(\.\d+)?\s?(mcg|µg|mg|g|units?|mEq|mmol|mL)\s?(\/|per)\s?(kg|min|h|hr|hour|minute)\b/i;
const approval = /\b(approved by|reviewed by|signed off by|endorsed by)\b/i;
const FRONT = ["set_id", "title", "status", "origin", "clinically_reviewed", "sources", "independently_written_note"];

export interface McqView { key: string; stem: string; opts: string[] }
const norm = (x: string) => x.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 2);

export function parseMcqViews(text: string, key: string): McqView[] {
  const section = text.split(/^## 17\. MCQs\s*$/m)[1]?.split(/^## 18\./m)[0] ?? "";
  return section.split(/^\*\*(?=Q\d)/m).slice(1).map((b) => {
    const id = /^(Q\d+)/.exec(b)?.[1] ?? "Q?";
    const stem = /^Q\d+ \([^)]*\)\.\*\*\s*(.*)$/m.exec(b)?.[1] ?? "";
    const opts = ["A", "B", "C", "D"].map((l) => new RegExp(`^${l}\\. (.+)$`, "m").exec(b)?.[1]?.trim() ?? "");
    return { key: `${key} ${id}`, stem, opts };
  });
}

export function nearDuplicates(views: McqView[], against: McqView[]): string[] {
  const out: string[] = [];
  const set = (v: McqView) => new Set(norm(`${v.stem} ${v.opts.join(" ")}`));
  const A = views.map(set), B = against.map(set);
  for (let i = 0; i < views.length; i++) for (let j = 0; j < against.length; j++) {
    if (views[i]!.key === against[j]!.key) continue;
    const a = A[i]!, b = B[j]!;
    const inter = [...a].filter((w) => b.has(w)).length;
    if (a.size > 4 && inter / (a.size + b.size - inter) >= 0.5) out.push(`${views[i]!.key} ~ ${against[j]!.key}`);
  }
  return out;
}

export function validateMcqSet(text: string, known: Set<string>): DraftIssue[] {
  const out: DraftIssue[] = [];
  const add = (rule: string, message: string) => out.push({ rule, message });
  const meta = parseFrontMatter(text);
  for (const k of FRONT) if (!(k in meta)) add("meta", `missing front-matter field: ${k}`);
  if ((meta.status ?? "").replace(/["']/g, "") !== "DRAFT") add("status", "status must be DRAFT");
  if (meta.origin !== "ai_generated") add("origin", "origin must be ai_generated");
  if (meta.clinically_reviewed !== "false") add("review", "clinically_reviewed must be false");
  if (/^clinical_reviewers:\s*\[\s*[^\]\s]/m.test(text)) add("review", "clinical_reviewers must be empty");
  if (!/NOT clinically reviewed/i.test(text)) add("banner", "missing 'NOT clinically reviewed' banner");
  if (approval.test(text)) add("review", "must not claim approval or review");
  const qs = parseMcqs(text);
  if (qs.length < 6) add("mcq", `a set needs at least 6 MCQs (found ${qs.length})`);
  out.push(...mcqQuality(qs));
  const section = text.split(/^## 17\. MCQs\s*$/m)[1]?.split(/^## 18\./m)[0] ?? "";
  const blocks = section.split(/^\*\*(?=Q\d)/m).slice(1);
  for (const b of blocks) {
    const id = /^(Q\d+)/.exec(b)?.[1] ?? "Q?";
    const trace = /^\*\*Trace:\*\* (.+)$/m.exec(b)?.[1];
    if (!trace) { add("trace", `${id}: missing '**Trace:**' line`); continue; }
    const ids = trace.split(" — ")[0]!.split(",").map((x) => x.trim()).filter(Boolean);
    if (ids.length === 0 || !/ — .{15,}/.test(trace)) add("trace", `${id}: a trace needs source ids and the statement it rests on`);
    for (const i of ids) if (!known.has(i)) add("trace", `${id}: trace cites ${i} which is not a registered source`);
    if (dose.test(b)) add("dosing", `${id}: contains a dose/rate pattern; not allowed`);
  }
  if (!/https?:\/\//.test(text) || !/accessed \d{4}-\d{2}-\d{2}/.test(text)) add("refs", "references need URLs and access dates");
  return out;
}
