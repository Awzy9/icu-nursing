// Validates content/drafts/medications/MD-*.json against PLAN.csv and LABEL_SOURCES.csv. Exit 1 on any issue.
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { validateMedicationDraft, validateMedicationSet, type MedicationDraft, type PlanRow } from "../src/lib/medication-draft-validator";

const dir = (root: string) => path.join(root, "content/drafts/medications");
const lines = (file: string) => readFileSync(file, "utf8").split(/\r?\n/).slice(1).filter(Boolean);
export function loadMedicationPlan(root = "."): Map<number, PlanRow> {
  return new Map(lines(path.join(dir(root), "PLAN.csv")).map((l) => {
    const c = l.match(/("([^"]|"")*"|[^,]*)(,|$)/g)!.map((x) => x.replace(/,$/, "").replace(/^"|"$/g, ""));
    return [Number(c[0]), { number: Number(c[0]), name: c[1]!, category: c[2]!, batch: Number(c[4]) }] as const;
  }));
}
export function loadMedicationLabels(root = "."): Set<string> {
  return new Set(lines(path.join(dir(root), "LABEL_SOURCES.csv")).map((l) => l.split(",")[0]!));
}
export function loadGuidelineSources(root = "."): string[] {
  const ids = (file: string, re: RegExp) => readFileSync(file, "utf8").split(/\r?\n/).slice(1).map((l) => re.exec(l)?.[1]).filter((x): x is string => Boolean(x));
  return [
    ...ids(path.join(root, "content/drafts/skills/NEW_SOURCES.csv"), /^"?(N-[A-Z0-9-]+)"?,/),
    // The master source register (also used by the scenario validator) carries vetted nursing-practice
    // guideline sources - e.g. S-RCP-NEWS2, an early-warning-score escalation framework - that medication
    // drafts can now cite for genuine nursing-practice escalation content, not just a regulator label.
    ...ids(path.join(root, "sources/source_register.csv"), /^"?([SN]-[A-Z0-9-]+)"?,/),
  ];
}
export function loadMedicationDrafts(root = "."): MedicationDraft[] {
  return readdirSync(dir(root)).filter((f) => /^MD-\d\d-.*\.json$/.test(f)).sort().map((f) => JSON.parse(readFileSync(path.join(dir(root), f), "utf8")) as MedicationDraft);
}
if (process.argv[1]?.endsWith("validate-medication-drafts.ts")) {
  const plan = loadMedicationPlan(); const known = new Set([...loadMedicationLabels(), ...loadGuidelineSources(), "S-FDA-PUMP", "S-AHRQ-TS"]);
  const drafts = loadMedicationDrafts();
  const issues = [...drafts.flatMap((d) => validateMedicationDraft(d, known, plan)), ...validateMedicationSet(drafts, plan)];
  for (const i of issues) console.error(`[${i.rule}] ${i.message}`);
  console.log(`${drafts.length} medication drafts checked, ${issues.length} issue(s).`);
  process.exit(issues.length ? 1 : 0);
}
