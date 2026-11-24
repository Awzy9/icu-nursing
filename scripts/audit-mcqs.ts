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
// Phase 8: the unpublished MCQ expansion drafts are audited together with the topic drafts so duplicates and balance are judged over the whole bank.
for (const f of readdirSync(join(root, "mcq-expansion")).filter((x) => /^XQ-\d\d-.*\.md$/.test(x))) files.push(join(root, "mcq-expansion", f));
const absolutes = /\b(always|never|only|all patients|every patient|any patient|no need|cannot|must never|completely|entirely)\b/i;
type Row = { topic: string; q: string; answer: string; issues: string[] };
const rows: Row[] = [];
const pos: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
const tags: Record<string, number> = {};
let total = 0, longest = 0, correctAbsolute = 0, distractorAbsolute = 0;
const perTopic: string[] = [];
const all: { key: string; stem: string; opts: string[]; answer: string }[] = [];
let shortest = 0, shorterThanMean = 0, ratioSum = 0;
const topicRatio: Record<string, number[]> = {};
for (const f of files.sort()) {
  const text = readFileSync(f, "utf8");
  const topic = /^(?:topic_id|set_id): (\S+)/m.exec(text)![1]!;
  const qs = parse(text);
  const topicPos: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  let topicLongest = 0;
  for (const q of qs) {
    total++; pos[q.answer]!++; topicPos[q.answer]!++;
    const issues: string[] = [];
    const lens = Object.entries(q.options).map(([k, v]) => [k, (v as string).length] as const);
    const max = Math.max(...lens.map((l) => l[1]));
    const ansLen = q.options[q.answer]!.length;
    all.push({ key: `${topic} ${q.id}`, stem: q.stem, opts: Object.values(q.options) as string[], answer: q.answer });
    const min = Math.min(...lens.map((l) => l[1]));
    const dMean = lens.filter((l) => l[0] !== q.answer).reduce((a, l) => a + l[1], 0) / (lens.length - 1);
    if (ansLen < dMean) shorterThanMean++;
    ratioSum += ansLen / dMean; (topicRatio[topic] ??= []).push(ansLen / dMean);
    if (ansLen === min && lens.filter((l) => l[1] === min).length === 1) shortest++;
    if (ansLen === max && lens.filter((l) => l[1] === max).length === 1) { longest++; topicLongest++; issues.push("correct option is the unique longest"); }
    const ansAbs = absolutes.test(q.options[q.answer]!);
    const dAbs = Object.entries(q.options).filter(([k, v]) => k !== q.answer && absolutes.test(v as string)).length;
    if (ansAbs) correctAbsolute++;
    distractorAbsolute += dAbs;
    if (!ansAbs && dAbs >= 2) issues.push(`${dAbs} distractors use absolute wording while the key does not (test-wiseness cue)`);
    if (!q.tag) issues.push("missing question-type tag");
    tags[q.tag] = (tags[q.tag] ?? 0) + 1;
    if (/\b(which of the following|all of the above|none of the above)\b/i.test(q.stem + Object.values(q.options).join(" "))) issues.push("generic or 'of the above' wording");
    if (!/\b(patients?|nurses?|beds?|man|woman|year-old|ventilated|infusion|staff|colleagues?|unit|team|shift|ward|round|handover|monitor|ventilator)\b/i.test(q.stem) && !["understanding","scope"].includes(q.tag.toLowerCase())) issues.push("no clinical context in an application-type stem");
    if (!q.whyCorrect || q.whyCorrect.length < 30) issues.push("short or missing 'why correct'");
    else if (/^(This is|It is the|Recommendations? \d|See |Per |Level )/.test(q.whyCorrect) || q.whyCorrect.length < 60) issues.push("circular or thin 'why correct' (names the source instead of explaining the reasoning)");
    const wrong = Object.keys(q.options).filter((k) => k !== q.answer);
    for (const w of wrong) if (!q.whyNot[w] || q.whyNot[w]!.length < 25) issues.push(`short 'why not ${w}'`);
    if (!/[?.]$/.test(q.stem.trim())) issues.push("stem does not end with a question or statement");
    if (q.stem.length < 60) issues.push("very short stem (possible recall-only question)");
    rows.push({ topic, q: q.id, answer: q.answer, issues });
  }
  perTopic.push(`| ${topic} | ${qs.length} | ${topicPos.A}/${topicPos.B}/${topicPos.C}/${topicPos.D} | ${topicLongest} | ${(topicRatio[topic]!.reduce((a, b) => a + b, 0) / topicRatio[topic]!.length).toFixed(2)} |`);
}
// Duplicate checks: identical options inside a question, and near-duplicate questions across the bank (stem plus options, word-set Jaccard >= 0.7).
const norm = (x: string) => x.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 2);
const dupOptions = all.filter((a) => new Set(a.opts.map((o) => norm(o).join(" "))).size < a.opts.length).map((a) => a.key);
const dupStems: string[] = [];
for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
  const A = new Set(norm(`${all[i]!.stem} ${all[i]!.opts.join(" ")}`)), B = new Set(norm(`${all[j]!.stem} ${all[j]!.opts.join(" ")}`));
  const inter = [...A].filter((w) => B.has(w)).length;
  if (A.size > 4 && inter / (A.size + B.size - inter) >= 0.7) dupStems.push(`${all[i]!.key} ~ ${all[j]!.key}`);
}
const flagged = rows.filter((r) => r.issues.length);
const byDomain: Record<string, number> = {}; for (const r of rows) { const d = /^(D\d\d)/.exec(r.topic)?.[1] ?? "XQ"; byDomain[d] = (byDomain[d] ?? 0) + 1; }
const stemCount: Record<string, number> = {}; for (const a of all) { const k = a.stem.toLowerCase().replace(/[^a-z ]/g, "").split(/\s+/).slice(0, 8).join(" "); stemCount[k] = (stemCount[k] ?? 0) + 1; }
const repeatedStems = Object.entries(stemCount).filter(([, n]) => n >= 4).sort((a, b) => b[1] - a[1]);
const out = [
  `# MCQ audit (automated; ${new Date().toISOString().slice(0, 10)})`,
  `Questions audited: **${total}** across ${files.length} drafts. Answer positions A/B/C/D: ${pos.A}/${pos.B}/${pos.C}/${pos.D}.`,
  `Correct option is the unique longest: **${longest}** (${((100 * longest) / total).toFixed(1)} %). Keys with absolute wording: ${correctAbsolute}; distractors with absolute wording: ${distractorAbsolute}.`,
  `Correct option is the unique shortest: **${shortest}** (${((100 * shortest) / total).toFixed(1)} %); a random key would be the unique longest or shortest in roughly 20-25 % of questions each.`,
  `Key length relative to the mean distractor length: mean ratio **${(ratioSum / total).toFixed(2)}** (1.00 = equal); keys shorter than the mean distractor in **${shorterThanMean}** questions (${((100 * shorterThanMean) / total).toFixed(1)} %). Ratios are reported, not targeted: no wording is padded to move them.`,
  `Questions with identical options inside the question: **${dupOptions.length}**. Near-duplicate questions across the bank (stem plus options, Jaccard >= 0.7; template stems such as the scope-of-practice question are expected to repeat, their options differ): **${dupStems.length}**${dupStems.length ? ` (${dupStems.join("; ")})` : ""}.`,
  `Questions with at least one automated flag: **${flagged.length}**.`,
  `Questions per domain: ${Object.entries(byDomain).sort().map(([k, v]) => `${k} ${v}`).join(", ")}.`,
  `Stems that open the same way in four or more questions (template stems are expected for scope-of-practice questions; others suggest repeated concepts): ${repeatedStems.map(([k, n]) => `"${k}..." x${n}`).join("; ") || "none"}.`,
  "", "## Flags", ...flagged.map((r) => `- ${r.topic} ${r.q} (key ${r.answer}): ${r.issues.join("; ")}`),
  "", `Question-type tags: ${Object.entries(tags).map(([k, v]) => `${k} ${v}`).join(", ")}.`, "", "## Per topic (positions A/B/C/D; unique-longest keys)", "| Topic | MCQs | A/B/C/D | Longest-key | Mean key/distractor length |", "|---|---|---|---|---|", ...perTopic,
].join("\n");
if (!process.argv.includes("--check")) writeFileSync(join(root, "MCQ_AUDIT.md"), out + "\n");
console.log(out.split("\n").slice(0, 6).join("\n"));
if (process.argv.includes("--check") && (dupOptions.length || dupStems.length)) process.exitCode = 1;
