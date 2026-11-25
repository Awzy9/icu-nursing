import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
const read = (path: string) => JSON.parse(readFileSync(path,"utf8"));
const cases = [
 ["SK-21-infection-prevention","required wet contact time","S-CDC-IC"],
 ["SK-22-infusion-pump-safety","absence of an alarm","S-FDA-PUMP-FAILURE-EXAMPLES"],
 ["SK-23-sedation-assessment","inadequate evidence","S-SCCM-PADIS-FOCUSED-2025"],
 ["SK-24-neurological-assessment","temperature, respiratory rate","S-NICE-NG232"],
 ["SK-25-pain-assessment","family observations","S-SCCM-PADIS"],
] as const;
describe("final five skill evidence follow-up", () => {
  it.each(cases)("preserves sourced safety, checklist and revision: %s", (name, phrase, source) => {
    const d = read("content/drafts/skills/"+name+".json");
    const items = Object.values(d.sections).flatMap((s:unknown) => (s as {items:{text:string;sources:string[]}[]}).items);
    expect(items.some(x=>x.text.includes(phrase)&&x.sources.includes(source))).toBe(true);
    expect(d.checklist.some((x:{text:string;sources:string[];critical:boolean})=>x.critical&&x.text.includes(phrase)&&x.sources.includes(source))).toBe(true);
    expect(d.sources.some((x:{id:string})=>x.id===source)).toBe(true);
    expect(d.references.some((x:{id:string})=>x.id===source)).toBe(true);
    expect(d.clinically_reviewed).toBe(false);
    expect(d.gaps.length).toBeGreaterThan(0);
    const hash = createHash("sha256").update(JSON.stringify(d)).digest("hex").slice(0,16);
    const idx = read("src/content/draft-index.json").entries.find((x:{key:string})=>x.key===d.skill_id);
    const hist = read("src/content/draft-history.json").entries[d.skill_id];
    expect(idx.hash).toBe(hash);
    expect(hist[hist.length-1].hash).toBe(hash);
  });
});
