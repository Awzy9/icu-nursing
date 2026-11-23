import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildWorkingContent } from "../../scripts/build-working-content";

const dir = "content/proposals/p1-12/";
const variceal = readFileSync(dir + "VARICEAL_BLEEDING_NURSING.md", "utf8");
const lower = readFileSync(dir + "LOWER_GI_BLEEDING_NURSING.md", "utf8");
const gi = readFileSync("content/proposals/p1-11/GI_HAEMORRHAGE_NURSING.md", "utf8");

describe("P1 batch 12 variceal and lower-GI safety and version checks", () => {
  it("keeps both modules proposal-only and not clinically approved or published", () => {
    for (const s of [variceal, lower]) {
      expect(s).toMatch(/^proposal_id: P1-12-/m);
      expect(s).toMatch(/^content_stage: PROPOSAL_ONLY$/m);
      expect(s).toMatch(/^status: DRAFT$/m);
      expect(s).toMatch(/^clinically_reviewed: false$/m);
      expect(s).toMatch(/^published: false$/m);
      expect(s).toMatch(/UNPUBLISHED PROPOSAL/);
      expect(s).toMatch(/Three-phase fictional case/);
      expect(s).toMatch(/publication sign-off/i);
      expect(s).toMatch(/RED\/cite-only/);
    }
  });

  it("prevents unpublished GI proposals from appearing in working content", () => {
    const entries = buildWorkingContent();
    const keys = new Set(entries.map(e => e.key));
    expect(keys.has("P1-12-VARICEAL")).toBe(false);
    expect(keys.has("P1-12-LOWER-GI")).toBe(false);
    expect(entries.some(e => e.title.includes("Suspected acute variceal haemorrhage"))).toBe(false);
    expect(entries.some(e => e.title.includes("Acute lower gastrointestinal bleeding — critical care nursing"))).toBe(false);
  });

  it("references Baveno VIII 2026 rather than presenting Baveno VII as latest", () => {
    expect(variceal).toMatch(/Baveno VIII.*supersedes Baveno VII/);
    expect(variceal).toMatch(/complete publisher text was blocked/);
    expect(variceal).toMatch(/prompt specialist-directed/);
    expect(variceal).toMatch(/antimicrobial prophylaxis/);
    expect(variceal).toMatch(/one INR or platelet count/);
    expect(variceal).toMatch(/TIPS candidates/);
    expect(gi).toMatch(/Baveno VIII \(2026\)/);
  });

  it("keeps lower GI decisions clinician-directed and stability led, with upper-source differential", () => {
    expect(lower).toMatch(/ASGE 2026/);
    expect(lower).toMatch(/28 August 2026/);
    expect(lower).toMatch(/brisk upper GI haemorrhage/);
    expect(lower).toMatch(/CTA/);
    expect(lower).toMatch(/full bowel preparation/);
    expect(lower).toMatch(/never start rapid bowel prep autonomously/);
    expect(lower).toMatch(/RED\/cite-only/);
    expect(gi).toMatch(/ASGE's August 2026/);
  });

  it("preserves clinical scope, citation-only permissions and excludes medication dosing/procedures", () => {
    for (const s of [variceal, lower]) {
      expect(s).toMatch(/not (?:a|an) (?:bedside treatment pathway|clinician-independent resuscitation)/i);
      expect(s).toMatch(/not (?:independent|a clinician-independent|a nurse-independent)|clinician-directed|specialist-directed/i);
      expect(s).not.toMatch(/(?:octreotide|terlipressin|ceftriaxone)\s+\d+\s*(?:mg|mcg)/i);
      expect(s).not.toMatch(/(?:bolus|infusion)\s+\d+\s*(?:mg|mcg|mL|units)/i);
    }
  });
});
