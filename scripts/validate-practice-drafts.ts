// Validates content/drafts/practice/PX-*.json. Exit 1 on any issue.
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { validatePracticeDraft, validatePracticeSet, type PracticeDraft } from "../src/lib/practice-draft-validator";
import { loadScenarioKnownSources } from "./validate-scenario-drafts";

export function loadPracticeDrafts(root = "."): PracticeDraft[] {
  const dir = path.join(root, "content/drafts/practice");
  return readdirSync(dir).filter((f) => /^PX-\d\d-.*\.json$/.test(f)).sort().map((f) => JSON.parse(readFileSync(path.join(dir, f), "utf8")) as PracticeDraft);
}
if (process.argv[1]?.endsWith("validate-practice-drafts.ts")) {
  const known = loadScenarioKnownSources();
  const drafts = loadPracticeDrafts();
  const issues = [...drafts.flatMap((d) => validatePracticeDraft(d, known)), ...validatePracticeSet(drafts)];
  for (const i of issues) console.error(`[${i.rule}] ${i.message}`);
  console.log(`${drafts.length} practice drafts checked, ${issues.length} issue(s).`);
  process.exit(issues.length ? 1 : 0);
}
