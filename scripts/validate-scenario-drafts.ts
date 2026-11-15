// Validates content/drafts/scenarios/SC-*.json (DRAFT specifications of the original 20 scenarios). Exit 1 on any issue.
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { validateScenarioDraft, validateScenarioSet, type ScenarioDraft } from "../src/lib/scenario-draft-validator";

const ids = (file: string, re: RegExp): string[] => readFileSync(file, "utf8").split(/\r?\n/).slice(1).map((l) => re.exec(l)?.[1]).filter((x): x is string => Boolean(x));
export function loadScenarioKnownSources(root = "."): Set<string> {
  return new Set([
    ...ids(path.join(root, "sources/source_register.csv"), /^"?([SN]-[A-Z0-9-]+)"?,/),
    ...ids(path.join(root, "content/drafts/skills/NEW_SOURCES.csv"), /^"?([SN]-[A-Z0-9-]+)"?,/),
    ...ids(path.join(root, "content/drafts/medications/LABEL_SOURCES.csv"), /^(L-[A-Z0-9-]+),/),
  ]);
}
export function loadScenarioDrafts(root = "."): ScenarioDraft[] {
  const dir = path.join(root, "content/drafts/scenarios");
  return readdirSync(dir).filter((f) => /^SC-\d\d-.*\.json$/.test(f)).sort().map((f) => JSON.parse(readFileSync(path.join(dir, f), "utf8")) as ScenarioDraft);
}
if (process.argv[1]?.endsWith("validate-scenario-drafts.ts")) {
  const known = loadScenarioKnownSources();
  const drafts = loadScenarioDrafts();
  const issues = [...drafts.flatMap((d) => validateScenarioDraft(d, known)), ...validateScenarioSet(drafts)];
  for (const i of issues) console.error(`[${i.rule}] ${i.message}`);
  console.log(`${drafts.length} scenario drafts checked, ${issues.length} issue(s).`);
  process.exit(issues.length ? 1 : 0);
}
