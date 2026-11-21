import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { parseBlocks, parseInline, readingMinutes, splitSections } from "../../mobile/src/core/markdown";

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

describe("parseBlocks: constructs the real lessons use", () => {
  it("parses a pipe table into header + rows, dropping the separator row and padding short rows", () => {
    expect(parseBlocks("| Item | Meaning |\n|---|:---:|\n| Suspicion | Think sepsis |\n| Screening |")).toEqual([
      { kind: "table", header: ["Item", "Meaning"], rows: [["Suspicion", "Think sepsis"], ["Screening", ""]] },
    ]);
  });
  it("keeps an escaped pipe inside a cell and ends the table at the first non-table line", () => {
    const blocks = parseBlocks("| A | B |\n|---|---|\n| x \\| y | z |\n\nAfter the table.");
    expect(blocks[0]).toEqual({ kind: "table", header: ["A", "B"], rows: [["x | y", "z"]] });
    expect(blocks[1]).toEqual({ kind: "paragraph", text: "After the table." });
  });
  it("does not treat pipes without a separator row as a table", () => {
    expect(parseBlocks("| not | a table |")[0]!.kind).toBe("paragraph");
  });
  it("parses numbered lists with their own numbering, separate from the paragraph before them", () => {
    expect(parseBlocks("Objectives:\n1. First\n2. Second\n3) Third")).toEqual([
      { kind: "paragraph", text: "Objectives:" },
      { kind: "numbered", items: ["First", "Second", "Third"], start: 1 },
    ]);
    expect(parseBlocks("4. Resume here\n5. And on")[0]).toEqual({ kind: "numbered", items: ["Resume here", "And on"], start: 4 });
  });
  it("joins wrapped quote lines into one quote and strips the markers", () => {
    expect(parseBlocks("> DRAFT - not reviewed.\n> Check local policy.")).toEqual([{ kind: "quote", text: "DRAFT - not reviewed. Check local policy." }]);
  });
  it("parses #### as a level-4 heading and keeps ### at level 3", () => {
    expect(parseBlocks("### Three\n\n#### Four")).toEqual([{ kind: "heading", level: 3, text: "Three" }, { kind: "heading", level: 4, text: "Four" }]);
  });
  it("continues a list item onto an indented following line", () => {
    expect(parseBlocks("- first item\n  carries on\n- second")).toEqual([{ kind: "bullets", items: ["first item carries on", "second"] }]);
  });
  it("does not mistake **bold** at the start of a line for a bullet", () => {
    expect(parseBlocks("**Bold lead** then text")[0]).toEqual({ kind: "paragraph", text: "**Bold lead** then text" });
  });
});

describe("parseInline: italics", () => {
  it("marks *italic* spans and leaves multiplication-style asterisks alone", () => {
    expect(parseInline("a *slanted* word")).toEqual([{ text: "a ", bold: false }, { text: "slanted", bold: false, italic: true }, { text: " word", bold: false }]);
    expect(parseInline("5 * 3 * 2")).toEqual([{ text: "5 * 3 * 2", bold: false }]);
  });
  it("still handles bold and italic in the same line", () => {
    expect(parseInline("**b** and *i*")).toEqual([{ text: "b", bold: true }, { text: " and ", bold: false }, { text: "i", bold: false, italic: true }]);
  });
});

describe("readingMinutes", () => {
  it("is never below one minute and scales with length", () => {
    expect(readingMinutes("short")).toBe(1);
    expect(readingMinutes("word ".repeat(1000))).toBe(5);
  });
});

describe("every real lesson in the catalog renders without leaking raw markdown", () => {
  const catalog = JSON.parse(readFileSync("content/working-catalog.json", "utf8")) as { key: string; body?: string }[];
  const lessons = catalog.filter((e) => typeof e.body === "string" && e.body.length > 0);
  it("has real lessons to check", () => { expect(lessons.length).toBeGreaterThan(100); });
  it("never leaves a table, numbered item, quote or #### heading behind as visible paragraph text", () => {
    const leaks: string[] = [];
    for (const e of lessons) for (const s of splitSections(e.body!)) for (const b of parseBlocks(s.body)) {
      if (b.kind !== "paragraph" && b.kind !== "quote") continue;
      if (/^\s*\|/.test(b.text) || /\|\s*:?-{2,}/.test(b.text)) leaks.push(`${e.key} table: ${b.text.slice(0, 50)}`);
      else if (/^#{3,}\s/.test(b.text)) leaks.push(`${e.key} heading: ${b.text.slice(0, 50)}`);
      else if (/(^|\s)\d+[.)]\s+\S.*\s\d+[.)]\s+\S/.test(b.text) && /^\d+[.)]\s/.test(b.text)) leaks.push(`${e.key} numbered: ${b.text.slice(0, 50)}`);
      else if (/^>\s/.test(b.text)) leaks.push(`${e.key} quote: ${b.text.slice(0, 50)}`);
    }
    expect(leaks).toEqual([]);
  });
  it("renders every table with a header and regular rows", () => {
    let tables = 0;
    for (const e of lessons) for (const s of splitSections(e.body!)) for (const b of parseBlocks(s.body)) if (b.kind === "table") {
      tables++;
      expect(b.header.length, e.key).toBeGreaterThan(1);
      for (const r of b.rows) expect(r.length, e.key).toBe(b.header.length);
    }
    expect(tables).toBeGreaterThan(50);
  });
});
