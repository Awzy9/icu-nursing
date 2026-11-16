import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { demoRepository } from "@/lib/content/demo-repository";
import { RichText } from "@/components/content/rich-text";
import { ACTION_SCOPES } from "@/lib/content/types";

describe("demo content repository", () => {
  it("serves exactly ten domains, each with a topic", async () => {
    const domains = await demoRepository.listDomains("en");
    expect(domains).toHaveLength(10);
    expect(domains.every((d) => d.topicCount >= 1)).toBe(true);
  });
  it("localises domain titles and falls back to English summaries", async () => {
    const [d] = await demoRepository.listDomains("ar");
    expect(d!.title).toMatch(/[؀-ۿ]/);
    expect(d!.summary).toMatch(/[A-Za-z]/);
  });
  it("labels every topic as synthetic demonstration content", async () => {
    const topics = await demoRepository.listTopics({ locale: "en" });
    expect(topics.every((t) => t.kind === "demo_synthetic")).toBe(true);
  });
  it("filters by text, domain and level", async () => {
    expect(await demoRepository.listTopics({ locale: "en", q: "renal" })).toHaveLength(1);
    expect(await demoRepository.listTopics({ locale: "en", domainSlug: "neurocritical-care" })).toHaveLength(1);
    expect(await demoRepository.listTopics({ locale: "en", q: "zzzz-nothing" })).toHaveLength(0);
    const adv = await demoRepository.listTopics({ locale: "en", level: "advanced" });
    expect(adv.every((t) => t.level === "advanced")).toBe(true);
  });
  it("returns null for unknown topics", async () => {
    expect(await demoRepository.getTopic("nope", "en")).toBeNull();
  });
  it("exposes every nursing-scope category on a topic", async () => {
    const t = await demoRepository.getTopic("demo-respiratory-airway", "en");
    expect(new Set(t!.actions.map((a) => a.scope))).toEqual(new Set(ACTION_SCOPES));
    expect(t!.review.versionNo).toBeNull();
  });
  it("labels the KDIGO 2026 update as a draft in the renal demo topic", async () => {
    const t = await demoRepository.getTopic("demo-renal-metabolic", "en");
    const kdigo = t!.references.find((r) => r.organization === "KDIGO");
    expect(kdigo?.isDraftGuideline).toBe(true);
    expect(kdigo?.versionLabel).toMatch(/DRAFT/);
  });
});

describe("RichText", () => {
  it("renders paragraphs and bullet lists without injecting HTML", () => {
    render(<RichText text={"Hello <script>alert(1)</script>\n\n- one\n- two"} />);
    expect(screen.getByText(/Hello/)).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(document.querySelector("script")).toBeNull();
  });
});
