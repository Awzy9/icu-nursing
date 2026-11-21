import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "../..");
const read = (p: string) => readFileSync(path.join(root, p), "utf8");

describe("2026 enoxaparin source-safety review", () => {
  const file = "content/drafts/medications/MD-44-enoxaparin.json";
  it("does not mistake non-interchangeability for a prohibition on any authorized transition", () => {
    const d = JSON.parse(read(file));
    expect(d.sections.safety_alerts.items.some((x: {text: string}) => x.text.includes("not interchangeable unit-for-unit"))).toBe(true);
    expect(d.sections.safety_alerts.items.some((x: {text: string}) => x.text.includes("authorized new order"))).toBe(true);
    expect(JSON.stringify(d.sections.safety_alerts.items)).not.toContain("It must not be exchanged with heparin or other low molecular weight heparins.");
  });

  it("warns about renal impairment, neuraxial bleeding and non-specific PT/aPTT", () => {
    const d = JSON.parse(read(file));
    expect(d.sections.safety_alerts.items.some((x: {text: string}) => x.text.includes("In severe renal impairment"))).toBe(true);
    expect(d.sections.safety_alerts.items.some((x: {text: string}) => x.text.includes("HIT antibodies"))).toBe(true);
    expect(d.sections.monitoring.items.some((x: {text: string}) => x.text.includes("PT and aPTT are not adequate"))).toBe(true);
    expect(d.monitoring.some((x: {text: string}) => x.text.includes("Anti-Xa testing"))).toBe(true);
    expect(JSON.stringify(d)).not.toContain("1 mg/kg");
  });

  it("keeps the draft unapproved and metadata synchronized", () => {
    const raw = read(file);
    const d = JSON.parse(raw);
    expect(d.status).toBe("DRAFT");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.pharmacist_reviewed).toBe(false);
    const hash = createHash("sha256").update(JSON.stringify(d)).digest("hex").slice(0, 16);
    const index = JSON.parse(read("src/content/draft-index.json")).entries as {
      key: string; type: string; hash: string; gaps: number; clinically_reviewed: boolean;
    }[];
    const history = JSON.parse(read("src/content/draft-history.json")).entries as Record<string, {hash: string}[]>;
    const e = index.find(x => x.key === "MD-44" && x.type === "medications");
    expect(e?.hash).toBe(hash);
    expect(e?.gaps).toBe(d.gaps.length);
    expect(e?.clinically_reviewed).toBe(false);
    expect(history["MD-44"]?.at(-1)?.hash).toBe(hash);
  });
});
