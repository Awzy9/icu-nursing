import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { buildWorkingContent } from "../../scripts/build-working-content";
import { workingContent, workingEntry } from "@/lib/working";
import { WorkingBody } from "@/components/working/body";
describe("working edition", () => {
  it("includes every prepared module and question set with substantive content", () => {
    const entries = buildWorkingContent();
    expect(Object.fromEntries(["topics","skills","medications","cases","equipment","practice","questions"].map(t => [t, entries.filter(e => e.type === t).length]))).toEqual({topics:40,skills:25,medications:50,cases:20,equipment:8,practice:12,questions:51});
    expect(entries.filter(e => e.type === "questions").reduce((n,e)=>n+e.questionCount,0)).toBe(306);
    expect(entries.every(e => e.key && e.title && e.body.length > 100)).toBe(true);
    expect(new Set(entries.map(e=>e.key)).size).toBe(entries.length);
  });
  it("does not expose content by default or allow path traversal", () => {
    vi.stubEnv("CONTENT_EDITION", "");
    expect(workingContent()).toEqual([]);
    expect(workingEntry("../../secret")).toBeUndefined();
    vi.unstubAllEnvs();
  });
  it("retains the safety conditions in the learner-facing arrest and anaphylaxis cases", () => {
    const entries = buildWorkingContent();
    const arrest = entries.find((entry) => entry.key === "SC-13")!.scenario!;
    expect(arrest.steps[1]!.options[0]!.text).toMatch(/identifies a shockable rhythm/i);
    expect(arrest.steps[2]!.info).toMatch(/confirmed ventricular fibrillation/i);

    const anaphylaxis = entries.find((entry) => entry.key === "SC-19")!.scenario!;
    expect(anaphylaxis.steps[0]!.options[0]!.text).toMatch(/give IM adrenaline immediately/i);
    expect(anaphylaxis.steps[1]!.info).toMatch(/under the emergency protocol/i);
  });
  it("preserves high-alert medication safety and post-treatment monitoring in the working edition", () => {
    const entries = buildWorkingContent();
    const body = (key: string) => entries.find((entry) => entry.key === key)!.body;
    expect(body("MD-19")).toContain("Never administer potassium chloride by IV push");
    expect(body("MD-20")).toContain("cannot be substituted volume for volume");
    expect(body("MD-15")).toContain("every 30 minutes for two hours and hourly through hour six");
    expect(body("SC-11")).toContain("every 30 minutes for the first two hours");
    expect(body("SK-18")).toContain("start CPR when indicated while the team verifies the ECG signal");
  });
  it("retains immediate escalation and ventilatory support in the airway cases", () => {
    const entries = buildWorkingContent();
    const scenario = (key: string) => entries.find((entry) => entry.key === key)!.scenario!;
    expect(scenario("SC-04").steps[1]!.options[0]!.text).toMatch(/emergency help immediately.*alternative ventilation/);
    expect(scenario("SC-05").steps[0]!.options[1]!.points).toBe(0);
    expect(scenario("SC-05").steps[1]!.options[0]!.text).toContain("oral suction");
    expect(scenario("SC-06").steps[1]!.options[0]!.text).toContain("bag-mask ventilation");
  });
  it("retains immediate escalation and early glucose checks in neurological emergencies", () => {
    const entries = buildWorkingContent();
    const scenario = (key: string) => entries.find((entry) => entry.key === key)!.scenario!;
    expect(scenario("SC-07").steps[0]!.options[1]!.points).toBe(0);
    expect(scenario("SC-07").steps[1]!.options[0]!.text).toContain("suction only when clinically indicated");
    expect(scenario("SC-08").steps[0]!.options[0]!.text).toMatch(/bedside glucose.*Do not delay seizure treatment/);
    expect(scenario("SC-20").steps[0]!.options[0]!.text).toContain("Escalate without waiting");
  });
  it("renders text safely and keeps answers behind a disclosure", () => {
    const {container} = render(<WorkingBody body={'# Example\n<script>alert(1)</script>\n**Q1 (test)**\n- A\n**Answer: A**\nRationale'} />);
    expect(container.querySelector("script")).toBeNull();
    expect(screen.getByText("Show answer and explanation").closest("details")).not.toHaveAttribute("open");
  });
});
