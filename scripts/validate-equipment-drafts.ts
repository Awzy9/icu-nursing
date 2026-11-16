// Validates content/drafts/equipment/EQ-*.json. Exit 1 on any issue.
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { validateEquipmentDraft, validateEquipmentSet, type EquipmentDraft } from "../src/lib/equipment-draft-validator";
import { loadScenarioKnownSources } from "./validate-scenario-drafts";

export function loadEquipmentDrafts(root = "."): EquipmentDraft[] {
  const dir = path.join(root, "content/drafts/equipment");
  return readdirSync(dir).filter((f) => /^EQ-\d\d-.*\.json$/.test(f)).sort().map((f) => JSON.parse(readFileSync(path.join(dir, f), "utf8")) as EquipmentDraft);
}
if (process.argv[1]?.endsWith("validate-equipment-drafts.ts")) {
  const known = loadScenarioKnownSources();
  const drafts = loadEquipmentDrafts();
  const issues = [...drafts.flatMap((d) => validateEquipmentDraft(d, known)), ...validateEquipmentSet(drafts)];
  for (const i of issues) console.error(`[${i.rule}] ${i.message}`);
  console.log(`${drafts.length} equipment drafts checked, ${issues.length} issue(s).`);
  process.exit(issues.length ? 1 : 0);
}
