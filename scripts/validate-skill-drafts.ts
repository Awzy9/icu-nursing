// Validates content/drafts/skills/SK-*.json against the source registers. Exit 1 on any issue.
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { validateSkillDraft, validateSkillSet, type SkillDraft } from "../src/lib/skill-draft-validator";

const csvIds = (file: string): string[] => readFileSync(file, "utf8").split(/\r?\n/).slice(1).map((l) => /^"?([SN]-[A-Z0-9-]+)"?,/.exec(l)?.[1]).filter((x): x is string => Boolean(x));
export function loadKnownSources(root = "."): Map<string, "registered"> {
  return new Map([...csvIds(path.join(root, "sources/source_register.csv")), ...csvIds(path.join(root, "content/drafts/skills/NEW_SOURCES.csv"))].map((i) => [i, "registered" as const]));
}
export function loadSkillDrafts(root = "."): SkillDraft[] {
  const dir = path.join(root, "content/drafts/skills");
  return readdirSync(dir).filter((f) => /^SK-\d\d-.*\.json$/.test(f)).sort().map((f) => JSON.parse(readFileSync(path.join(dir, f), "utf8")) as SkillDraft);
}
if (process.argv[1]?.endsWith("validate-skill-drafts.ts")) {
  const known = loadKnownSources();
  const drafts = loadSkillDrafts();
  const issues = [...drafts.flatMap((d) => validateSkillDraft(d, known)), ...validateSkillSet(drafts)];
  for (const i of issues) console.error(`[${i.rule}] ${i.message}`);
  console.log(`${drafts.length} skill drafts checked, ${issues.length} issue(s).`);
  process.exit(issues.length ? 1 : 0);
}
