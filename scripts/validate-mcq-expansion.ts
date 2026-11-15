// Validates content/drafts/mcq-expansion/XQ-*.md, the position balance across the expansion, and near-duplicates against the existing 240 questions.
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { batchPositionIssues } from "../src/lib/draft-validator";
import { nearDuplicates, parseMcqViews, validateMcqSet, type McqView } from "../src/lib/mcq-expansion-validator";

const ids = (file: string) => readFileSync(file, "utf8").split(/\r?\n/).slice(1).map((l) => /^"?([A-Z]-[A-Z0-9-]+)"?,/.exec(l)?.[1]).filter((x): x is string => Boolean(x));
export function loadKnown(root = "."): Set<string> {
  return new Set([...ids(path.join(root, "sources/source_register.csv")), ...ids(path.join(root, "content/drafts/skills/NEW_SOURCES.csv")), ...ids(path.join(root, "content/drafts/medications/LABEL_SOURCES.csv"))]);
}
export function loadExpansion(root = "."): { file: string; text: string }[] {
  const dir = path.join(root, "content/drafts/mcq-expansion");
  return readdirSync(dir).filter((f) => /^XQ-\d\d-.*\.md$/.test(f)).sort().map((f) => ({ file: f, text: readFileSync(path.join(dir, f), "utf8") }));
}
export function loadExistingViews(root = "."): McqView[] {
  const base = path.join(root, "content/drafts");
  const out: McqView[] = [];
  for (const d of readdirSync(base).filter((x) => /^batch-\d+$/.test(x))) for (const f of readdirSync(path.join(base, d)).filter((x) => x.endsWith(".md"))) out.push(...parseMcqViews(readFileSync(path.join(base, d, f), "utf8"), f.slice(0, 7)));
  return out;
}
if (process.argv[1]?.endsWith("validate-mcq-expansion.ts")) {
  const known = loadKnown(); const sets = loadExpansion();
  const issues: string[] = [];
  for (const s of sets) for (const i of validateMcqSet(s.text, known)) issues.push(`${s.file} [${i.rule}] ${i.message}`);
  for (const i of batchPositionIssues(sets.map((s) => s.text))) issues.push(`expansion [${i.rule}] ${i.message}`);
  const views = sets.flatMap((s) => parseMcqViews(s.text, s.file.slice(0, 5)));
  for (const d of nearDuplicates(views, [...loadExistingViews(), ...views])) issues.push(`near-duplicate: ${d}`);
  for (const i of issues) console.error(i);
  console.log(`${sets.length} sets, ${views.length} questions, ${issues.length} issue(s).`);
  process.exit(issues.length ? 1 : 0);
}
