import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
describe("European shock and heart failure evidence reconciliation", () => {
  it("preserves limits of dynamic fluid assessment and clinical authority", () => {
    const topic = readFileSync("content/drafts/batch-02/D02-T08-shock-recognition.md", "utf8");
    const hypotension = JSON.parse(readFileSync("content/drafts/scenarios/SC-16-acute-hypotension.json", "utf8"));
    for (const content of [topic, JSON.stringify(hypotension)]) {
      expect(content).toContain("Fluid responsiveness is not itself an indication for fluid");
      expect(content).toContain("inferior vena cava size alone is insufficient");
    }
    expect(hypotension.clinically_reviewed).toBe(false);
  });
  it("tracks partial ESC sources and retains scenario safeguards", () => {
    const scenario = JSON.parse(readFileSync("content/drafts/scenarios/SC-02-cardiogenic-shock.json", "utf8"));
    expect(scenario.clinically_reviewed).toBe(false);
    expect(scenario.required_sources).toHaveLength(2);
    expect(scenario.sources.filter((s: { id: string; read: string }) => s.id.startsWith("S-ESC-") && s.read === "partial")).toHaveLength(3);
    expect(JSON.stringify(scenario)).toContain("presentations can overlap");
  });
});
