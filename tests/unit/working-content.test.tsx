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
  it("renders text safely and keeps answers behind a disclosure", () => {
    const {container} = render(<WorkingBody body={'# Example\n<script>alert(1)</script>\n**Q1 (test)**\n- A\n**Answer: A**\nRationale'} />);
    expect(container.querySelector("script")).toBeNull();
    expect(screen.getByText("Show answer and explanation").closest("details")).not.toHaveAttribute("open");
  });
});
