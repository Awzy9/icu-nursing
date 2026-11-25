// Validates Phase 2 content drafts. Drafts must never claim clinical review.
export type DraftIssue = { rule: string; message: string };

const REQUIRED_META = ["topic_id", "title", "status", "origin", "clinically_reviewed", "sources", "independently_written_note"];
const FORBIDDEN_STATUS = /^(approved|published|reviewed|clinically[_ ]reviewed|in_review)$/i;

export function parseFrontMatter(text: string): Record<string, string> {
  const m = /^(?:\uFEFF)?---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text);
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
  for (const h of ["## 1. Overview", "## 2. Learning objectives", "## 6. Clinical assessment", "## 7. Nursing responsibilities", "## 10. Warning signs", "## 11. Nursing interventions within scope", "## 12. Escalation", "## 14. Documentation", "## 15. Practical bedside example", "## 17. MCQs", "## 18. References", "## 19. Local protocol note", "## 20. Evidence, applicability and open questions"]) {
    if (!text.includes(h)) add("section", `missing section: ${h}`);
  }
  if (!/Independent nursing/.test(text) || !/prescriber/i.test(text)) add("scope", "must label independent nursing vs prescriber decisions");
  const parsed = parseMcqs(text);
  if (parsed.length < 6) add("mcq", `needs at least 6 MCQs (found ${parsed.length})`);
  for (const i of mcqQuality(parsed)) issues.push(i);
  if (!/https?:\/\//.test(text) || !/accessed \d{4}-\d{2}-\d{2}|accessed 20/.test(text)) add("refs", "references need URLs and access dates");
  // No unreviewed dosing: numeric dose/rate patterns are blocked until a pharmacist signs off.
  const doseLike = /\b\d+(\.\d+)?\s?(mcg|µg|mg|g|units?|mEq|mmol|mL)\s?(\/|per)\s?(kg|min|h|hr|hour|minute)\b(?!\s?PBW)/i;
  // urine-output thresholds (mL/kg/h) are monitoring targets, not drug doses
  if (text.split("\n").some((l) => doseLike.test(l) && !/urine|diuresis|oligur/i.test(l))) add("dosing", "contains dose/rate pattern; not allowed without pharmacist review");
  if (/\b(approved by|reviewed by|signed off by|endorsed by)\b/i.test(text)) add("review", "must not claim approval/review");
  return issues;
}

// ---------- MCQ structure and quality ----------
export type Mcq = { id: string; options: Record<string, string>; answer: string; why: Record<string, string>; hasWhyCorrect: boolean; structureIssues?: string[] };
const LETTERS = ["A", "B", "C", "D"] as const;
const NONSENSE = /\b(ignore the (patient|problem)|hide (it|the)|no one needs|porter|tear out|lie to|falsify|do nothing at all)\b/i;

export function parseMcqs(text: string): Mcq[] {
  const section = text.split(/^## 17\. MCQs\s*$/m)[1]?.split(/^## 18\./m)[0] ?? "";
  const blocks = section.split(/^\*\*(?=Q\d)/m).slice(1);
  return blocks.map((b) => {
    const id = /^(Q\d+)/.exec(b)?.[1] ?? "Q?";
    const options: Record<string, string> = {};
    const structureIssues: string[] = [];
    for (const l of LETTERS) {
      const matches = [...b.matchAll(new RegExp("^" + l + "\\. (.+)$", "gm"))];
      if (matches.length > 1) structureIssues.push("repeated option " + l);
      if (matches[0]?.[1]) options[l] = matches[0][1].trim();
    }
    const answers = [...b.matchAll(/^\*\*Answer: ([A-D])\.\*\*/gm)];
    if (answers.length > 1) structureIssues.push("multiple answer-key lines");
    const answer = answers[0]?.[1] ?? "";
    const why: Record<string, string> = {};
    for (const l of LETTERS) {
      const matches = [...b.matchAll(new RegExp("^\\*\\*Why not " + l + ":\\*\\* (.+)$", "gm"))];
      if (matches.length > 1) structureIssues.push("repeated explanation for option " + l);
      if (matches[0]?.[1]) why[l] = matches[0][1].trim();
    }
    const correctReasons = [...b.matchAll(/^\*\*Why correct:\*\* \S.*$/gm)];
    if (correctReasons.length > 1) structureIssues.push("multiple correct-answer explanations");
    return { id, options, answer, why, hasWhyCorrect: correctReasons.length > 0, structureIssues };
  });
}

export function mcqQuality(qs: Mcq[]): DraftIssue[] {
  const out: DraftIssue[] = [];
  const add = (rule: string, message: string) => out.push({ rule, message });
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  let longest = 0;
  const seenIds = new Set<string>();
  for (const q of qs) {
    if (seenIds.has(q.id)) add("mcq", `${q.id}: duplicate question ID`);
    seenIds.add(q.id);
    for (const issue of q.structureIssues ?? []) add("mcq", `${q.id}: ${issue}`);
    if (Object.keys(q.options).length !== 4) { add("mcq", `${q.id}: needs exactly four options A–D`); continue; }
    const normalizedOptions = Object.values(q.options).map(text => text.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim());
    if (new Set(normalizedOptions).size !== normalizedOptions.length) add("mcq", `${q.id}: repeated answer option text`);
    if (!LETTERS.some(l => l === q.answer)) { add("mcq", `${q.id}: missing or invalid answer key`); continue; }
    counts[q.answer] = (counts[q.answer] ?? 0) + 1;
    if (!q.hasWhyCorrect) add("mcq", `${q.id}: missing 'Why correct'`);
    const correct = q.options[q.answer] ?? "";
    for (const l of LETTERS) {
      const text = q.options[l] ?? "";
      if (l === q.answer) continue;
      if (!q.why[l]) add("mcq", `${q.id}: missing 'Why not ${l}' explanation`);
      else if (q.why[l].length < 15) add("mcq", `${q.id}: 'Why not ${l}' explanation is too short`);
      if (text.length < 25 || text.split(/\s+/).length < 5) add("mcq-distractor", `${q.id}: distractor ${l} is implausibly short`);
      if (text.length < 0.4 * correct.length) add("mcq-distractor", `${q.id}: distractor ${l} is much shorter than the correct option`);
      if (NONSENSE.test(text)) add("mcq-distractor", `${q.id}: distractor ${l} looks like an implausible/nonsense option`);
    }
    if (q.why[q.answer]) add("mcq", `${q.id}: the correct option must not have a 'Why not' line`);
    const others = LETTERS.filter((l) => l !== q.answer).map((l) => (q.options[l] ?? "").length);
    if (correct.length > Math.max(...others)) longest++;
  }
  const n = qs.length;
  if (n >= 4) {
    const max = Math.ceil(n * 0.4);
    for (const l of LETTERS) if ((counts[l] ?? 0) > max) add("mcq-position", `answer ${l} is correct ${counts[l]} of ${n} times (max ${max})`);
    if (Object.values(counts).filter((c) => c > 0).length < 3) add("mcq-position", "correct answers use fewer than three different positions");
    if (longest > Math.ceil(n / 2)) add("mcq-length", `the correct option is the longest in ${longest} of ${n} questions (max ${Math.ceil(n / 2)})`);
  }
  return out;
}

/** Whole-batch balance of correct-answer positions (each letter should hold 15–35%). */
export function batchPositionIssues(texts: string[]): DraftIssue[] {
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  let total = 0;
  for (const t of texts) for (const q of parseMcqs(t)) if (q.answer) { counts[q.answer] = (counts[q.answer] ?? 0) + 1; total++; }
  if (total < 20) return [];
  return LETTERS.filter((l) => (counts[l] ?? 0) / total < 0.15 || (counts[l] ?? 0) / total > 0.35).map((l) => ({
    rule: "mcq-position",
    message: `across the batch answer ${l} is correct ${counts[l]} of ${total} times (${Math.round(((counts[l] ?? 0) / total) * 100)}%; allowed 15–35%)`,
  }));
}
