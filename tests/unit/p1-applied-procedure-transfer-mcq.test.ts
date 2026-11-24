import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { validateMcqSet } from "@/lib/mcq-expansion-validator";
const paths = ["content/drafts/mcq-expansion/XQ-01-urinary-catheter.md","content/drafts/mcq-expansion/XQ-02-peripheral-iv.md","content/drafts/mcq-expansion/XQ-03-central-line-care.md","content/drafts/mcq-expansion/XQ-04-patient-transport.md","content/drafts/mcq-expansion/XQ-05-chest-drain.md"];
const keys = ["ADCBAD","DCBADC","CBADCB","BADCBA","ADCBAD"];
const known = new Set(readFileSync("sources/source_register.csv","utf8").split(/\r?\n/).map(l => l.split(",")[0]!.replace(/^"|"$/g,"")));
const needles = ["designated needleless port","safe transition of essential therapy","within 48 hours","both invasive and non-invasive ventilation","Do not force-flush or routinely clamp"];
describe("Applied procedure reasoning", () => {
 paths.forEach((path,i) => it(path, () => {
  const text = readFileSync(path,"utf8");
  expect(validateMcqSet(text,known)).toEqual([]);
  expect([...text.matchAll(/^\*\*Answer: ([A-D])\.\*\*/gm)].map(m=>m[1]).join("")).toBe(keys[i]);
  expect([...text.matchAll(/^\*\*Trace:\*\*/gm)]).toHaveLength(6);
  expect(text).toContain(needles[i]);
 }));
});
