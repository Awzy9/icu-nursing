import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
const read = (n: string) => JSON.parse(readFileSync("content/drafts/medications/" + n + ".json", "utf8"));
describe("exact-label targeted safety reconciliation — batch 5", () => {
  it("MD-41-flumazenil retains targeted safety and review gates", () => {
    const d = read("MD-41-flumazenil");
    expect(d.sections.monitoring.items.some((m: { text: string; support: string; sources: string[] }) => m.text.includes("life-threatening condition") && m.support === "partial" && m.sources.includes(d.label_ref))).toBe(true);
    expect(d.monitoring.some((m: { text: string; critical: boolean }) => m.text.includes("life-threatening condition") && m.critical)).toBe(true);
    expect(d.status).toBe("DRAFT");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.pharmacist_reviewed).toBe(false);
  });
  it("MD-42-atropine retains targeted safety and review gates", () => {
    const d = read("MD-42-atropine");
    expect(d.sections.monitoring.items.some((m: { text: string; support: string; sources: string[] }) => m.text.includes("no formal contraindications") && m.support === "partial" && m.sources.includes(d.label_ref))).toBe(true);
    expect(d.monitoring.some((m: { text: string; critical: boolean }) => m.text.includes("no formal contraindications") && m.critical)).toBe(true);
    expect(d.status).toBe("DRAFT");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.pharmacist_reviewed).toBe(false);
  });
  it("MD-43-succinylcholine retains targeted safety and review gates", () => {
    const d = read("MD-43-succinylcholine");
    expect(d.sections.monitoring.items.some((m: { text: string; support: string; sources: string[] }) => m.text.includes("Reduced plasma cholinesterase") && m.support === "partial" && m.sources.includes(d.label_ref))).toBe(true);
    expect(d.monitoring.some((m: { text: string; critical: boolean }) => m.text.includes("Reduced plasma cholinesterase") && m.critical)).toBe(true);
    expect(d.status).toBe("DRAFT");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.pharmacist_reviewed).toBe(false);
  });
  it("MD-44-enoxaparin retains targeted safety and review gates", () => {
    const d = read("MD-44-enoxaparin");
    expect(d.sections.monitoring.items.some((m: { text: string; support: string; sources: string[] }) => m.text.includes("hyperkalaemia risk factors") && m.support === "partial" && m.sources.includes(d.label_ref))).toBe(true);
    expect(d.monitoring.some((m: { text: string; critical: boolean }) => m.text.includes("hyperkalaemia risk factors") && m.critical)).toBe(true);
    expect(d.status).toBe("DRAFT");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.pharmacist_reviewed).toBe(false);
  });
  it("MD-45-alteplase retains targeted safety and review gates", () => {
    const d = read("MD-45-alteplase");
    expect(d.sections.monitoring.items.some((m: { text: string; support: string; sources: string[] }) => m.text.includes("cholesterol embolism is a rare") && m.support === "partial" && m.sources.includes(d.label_ref))).toBe(true);
    expect(d.monitoring.some((m: { text: string; critical: boolean }) => m.text.includes("cholesterol embolism is a rare") && m.critical)).toBe(true);
    expect(d.status).toBe("DRAFT");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.pharmacist_reviewed).toBe(false);
  });
  it("MD-46-tranexamic-acid retains targeted safety and review gates", () => {
    const d = read("MD-46-tranexamic-acid");
    expect(d.sections.monitoring.items.some((m: { text: string; support: string; sources: string[] }) => m.text.includes("twitching or myoclonus") && m.support === "partial" && m.sources.includes(d.label_ref))).toBe(true);
    expect(d.monitoring.some((m: { text: string; critical: boolean }) => m.text.includes("twitching or myoclonus") && m.critical)).toBe(true);
    expect(d.status).toBe("DRAFT");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.pharmacist_reviewed).toBe(false);
  });
  it("MD-47-levetiracetam retains targeted safety and review gates", () => {
    const d = read("MD-47-levetiracetam");
    expect(d.sections.monitoring.items.some((m: { text: string; support: string; sources: string[] }) => m.text.includes("unexpected cytopenias") && m.support === "partial" && m.sources.includes(d.label_ref))).toBe(true);
    expect(d.monitoring.some((m: { text: string; critical: boolean }) => m.text.includes("unexpected cytopenias") && m.critical)).toBe(true);
    expect(d.status).toBe("DRAFT");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.pharmacist_reviewed).toBe(false);
  });
  it("MD-48-mannitol retains targeted safety and review gates", () => {
    const d = read("MD-48-mannitol");
    expect(d.sections.monitoring.items.some((m: { text: string; support: string; sources: string[] }) => m.text.includes("compartment syndrome") && m.support === "partial" && m.sources.includes(d.label_ref))).toBe(true);
    expect(d.monitoring.some((m: { text: string; critical: boolean }) => m.text.includes("compartment syndrome") && m.critical)).toBe(true);
    expect(d.status).toBe("DRAFT");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.pharmacist_reviewed).toBe(false);
  });
  it("MD-49-pantoprazole retains targeted safety and review gates", () => {
    const d = read("MD-49-pantoprazole");
    expect(d.sections.monitoring.items.some((m: { text: string; support: string; sources: string[] }) => m.text.includes("mucosal lesions") && m.support === "partial" && m.sources.includes(d.label_ref))).toBe(true);
    expect(d.monitoring.some((m: { text: string; critical: boolean }) => m.text.includes("mucosal lesions") && m.critical)).toBe(true);
    expect(d.status).toBe("DRAFT");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.pharmacist_reviewed).toBe(false);
  });
  it("MD-50-hydrocortisone retains targeted safety and review gates", () => {
    const d = read("MD-50-hydrocortisone");
    expect(d.sections.monitoring.items.some((m: { text: string; support: string; sources: string[] }) => m.text.includes("relying on fever alone") && m.support === "partial" && m.sources.includes(d.label_ref))).toBe(true);
    expect(d.monitoring.some((m: { text: string; critical: boolean }) => m.text.includes("relying on fever alone") && m.critical)).toBe(true);
    expect(d.status).toBe("DRAFT");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.pharmacist_reviewed).toBe(false);
  });
});
