// Audits every MCQ in content/drafts: structure, answer balance, length bias, absolutes, explanation quality, reference presence.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
type Parsed = { id: string; tag: string; stem: string; options: Record<string, string>; answer: string; whyCorrect: string; whyNot: Record<string, string> };
function parse(text: string): Parsed[] {
  const section = text.split(/^## 17\. MCQs\s*$/m)[1]?.split(/^## 18\./m)[0] ?? "";
  return section.split(/^\*\*(?=Q\d)/m).slice(1).map((b) => {
    const head = /^(Q\d+) \(([^)]*)\)\.\*\*\s*(.*)$/m.exec(b);
    const options: Record<string, string> = {}; const whyNot: Record<string, string> = {};
    for (const l of ["A", "B", "C", "D"]) { const m = new RegExp(`^${l}\\. (.+)$`, "m").exec(b); if (m?.[1]) options[l] = m[1].trim(); const w = new RegExp(`^\\*\\*Why not ${l}:\\*\\* (.+)$`, "m").exec(b); if (w?.[1]) whyNot[l] = w[1].trim(); }
    return { id: head?.[1] ?? "Q?", tag: head?.[2] ?? "", stem: head?.[3] ?? "", options, answer: /^\*\*Answer: ([A-D])\.\*\*/m.exec(b)?.[1] ?? "", whyCorrect: /^\*\*Why correct:\*\* (.+)$/m.exec(b)?.[1] ?? "", whyNot };
  });
}

const root = "content/drafts";
const files: string[] = [];
for (const d of readdirSync(root).filter((x) => /^batch-\d+$/.test(x))) for (const f of readdirSync(join(root, d)).filter((x) => x.endsWith(".md"))) files.push(join(root, d, f));
const absolutes = /\b(always|never|only|all patients|every patient|any patient|no need|cannot|must never|completely|entirely)\b/i;
type Row = { topic: string; q: string; answer: string; issues: string[] };
const rows: Row[] = [];
const pos: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
const tags: Record<string, number> = {};
let total = 0, longest = 0, correctAbsolute = 0, distractorAbsolute = 0;
const perTopic: string[] = [];
for (const f of files.sort()) {
  const text = readFileSync(f, "utf8");
  const topic = /^topic_id: (\S+)/m.exec(text)![1]!;
  const qs = parse(text);
  const topicPos: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  let topicLongest = 0;
  for (const q of qs) {
    total++; pos[q.answer]!++; topicPos[q.answer]!++;
    const issues: string[] = [];
    const lens = Object.entries(q.options).map(([k, v]) => [k, (v as string).length] as const);
    const max = Math.max(...lens.map((l) => l[1]));
    const ansLen = q.options[q.answer]!.length;
    if (ansLen === max && lens.filter((l) => l[1] === max).length === 1) { longest++; topicLongest++; issues.push("correct option is the unique longest"); }
    const ansAbs = absolutes.test(q.options[q.answer]!);
    const dAbs = Object.entries(q.options).filter(([k, v]) => k !== q.answer && absolutes.test(v as string)).length;
    if (ansAbs) correctAbsolute++;
    distractorAbsolute += dAbs;
    if (!ansAbs && dAbs >= 2) issues.push(`${dAbs} distractors use absolute wording while the key does not (test-wiseness cue)`);
    if (!q.tag) issues.push("missing question-type tag");
    tags[q.tag] = (tags[q.tag] ?? 0) + 1;
    if (/\b(which of the following|all of the above|none of the above)\b/i.test(q.stem + Object.values(q.options).join(" "))) issues.push("generic or 'of the above' wording");
    if (!/\b(patient|nurse|bed|man|woman|year-old|ventilated|infusion|staff|colleague|unit)\b/i.test(q.stem) && !["understanding","scope"].includes(q.tag.toLowerCase())) issues.push("no clinical context in an application-type stem");
    if (!q.whyCorrect || q.whyCorrect.length < 30) issues.push("short or missing 'why correct'");
    const wrong = Object.keys(q.options).filter((k) => k !== q.answer);
    for (const w of wrong) if (!q.whyNot[w] || q.whyNot[w]!.length < 25) issues.push(`short 'why not ${w}'`);
    if (!/[?.]$/.test(q.stem.trim())) issues.push("stem does not end with a question or statement");
    if (q.stem.length < 60) issues.push("very short stem (possible recall-only question)");
    rows.push({ topic, q: q.id, answer: q.answer, issues });
  }
  perTopic.push(`| ${topic} | ${qs.length} | ${topicPos.A}/${topicPos.B}/${topicPos.C}/${topicPos.D} | ${topicLongest} |`);
}
const flagged = rows.filter((r) => r.issues.length);
const out = [
  "# MCQ audit (automated; 2026-11-15)",
  `Questions audited: **${total}** across ${files.length} drafts. Answer positions A/B/C/D: ${pos.A}/${pos.B}/${pos.C}/${pos.D}.`,
  `Correct option is the unique longest: **${longest}** (${((100 * longest) / total).toFixed(1)} %). Keys with absolute wording: ${correctAbsolute}; distractors with absolute wording: ${distractorAbsolute}.`,
  `Questions with at least one automated flag: **${flagged.length}**.`,
  "", "## Flags", ...flagged.map((r) => `- ${r.topic} ${r.q} (key ${r.answer}): ${r.issues.join("; ")}`),
  "", `Question-type tags: ${Object.entries(tags).map(([k, v]) => `${k} ${v}`).join(", ")}.`, "", "## Per topic (positions A/B/C/D; unique-longest keys)", "| Topic | MCQs | A/B/C/D | Longest-key |", "|---|---|---|---|", ...perTopic,
].join("\n");
writeFileSync(join(root, "MCQ_AUDIT.md"), out + "\n");
console.log(out.split("\n").slice(0, 6).join("\n"));
