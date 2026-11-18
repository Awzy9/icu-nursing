import { describe, expect, it } from "vitest";
import { parseBlocks, parseInline, splitSections } from "../../mobile/src/core/markdown";

describe("splitSections", () => {
  it("splits a real lesson body into ## sections, dropping an MCQs section and the pre-heading preamble", () => {
    const body = "intro text before any heading\n\n## Overview\n\nfirst section\n\n## 17. MCQs\n\n**Q1.** ...\n\n## References\n\nsecond section";
    const sections = splitSections(body);
    expect(sections.map((s) => s.title)).toEqual(["Overview", "References"]);
    expect(sections[0]!.body.trim()).toBe("first section");
  });
  it("drops a section whose body is empty after the heading", () => {
    const sections = splitSections("## Empty\n\n## Real\n\ncontent");
    expect(sections.map((s) => s.title)).toEqual(["Real"]);
  });
});

describe("parseBlocks", () => {
  it("groups consecutive bullet lines, splits out ### subheadings, and joins wrapped paragraph lines", () => {
    const blocks = parseBlocks("### Sub one\n\nThis is a\nwrapped paragraph.\n\n- item one\n- item two\n\nAnother paragraph.");
    expect(blocks).toEqual([
      { kind: "heading", level: 3, text: "Sub one" },
      { kind: "paragraph", text: "This is a wrapped paragraph." },
      { kind: "bullets", items: ["item one", "item two"] },
      { kind: "paragraph", text: "Another paragraph." },
    ]);
  });
  it("returns an empty array for blank text", () => { expect(parseBlocks("   \n\n  ")).toEqual([]); });
});

describe("parseInline", () => {
  it("splits bold spans out of a plain line", () => {
    expect(parseInline("plain **bold** and **more bold** tail")).toEqual([
      { text: "plain ", bold: false }, { text: "bold", bold: true }, { text: " and ", bold: false }, { text: "more bold", bold: true }, { text: " tail", bold: false },
    ]);
  });
  it("returns the whole line as one plain span when there is no emphasis", () => {
    expect(parseInline("no emphasis here")).toEqual([{ text: "no emphasis here", bold: false }]);
  });
});
