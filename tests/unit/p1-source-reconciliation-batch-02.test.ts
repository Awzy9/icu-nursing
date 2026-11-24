import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
describe("transfusion source scope and correction", () => {
  it("retains stable-population context and the full-review requirement", () => {
    const topic = readFileSync("content/drafts/batch-06/D08-T03-blood-product-administration-reactions.md","utf8");
    expect(topic).toContain("haemodynamically stable populations");
    expect(topic).toContain("delay emergency assessment or resuscitation of active haemorrhage");
    expect(topic).toContain("sources_not_read: [S-AABB-2023");
    expect(topic).toContain("clinically_reviewed: false");
  });
  it("records the major-haemorrhage correction without clearing independent review", () => {
    const d = JSON.parse(readFileSync("content/drafts/scenarios/SC-09-postoperative-bleeding.json","utf8"));
    expect(d.sources.find((s:{id:string})=>s.id==="S-AOA-BLOOD-2025").use).toContain("10.1111/anae.70020");
    expect(d.required_sources[0]).toContain("10.1111/anae.70020");
    expect(d.clinically_reviewed).toBe(false);
  });
});
