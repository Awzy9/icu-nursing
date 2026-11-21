// Pure parsing of the website's lesson body markdown into a structure the native reader can render
// without a markdown-rendering dependency. Handles what the real lessons actually contain:
// "## " sections, "###"/"####" sub-headings, "- " bullets, "1. " numbered lists, "> " quotes,
// pipe tables, and **bold** / *italic* spans. Mirrors the splitting approach already used by the
// website's own ModuleReader (src/components/working/reader.tsx: body.split(/^## /m)).

export interface MarkdownSection { title: string; body: string }
export function splitSections(body: string): MarkdownSection[] {
  const pieces = body.split(/^## /m);
  return pieces.slice(1)
    .map((text) => ({ title: text.split("\n")[0]!.replace(/^\d+[.]\s*/, "").trim(), body: text.slice(text.indexOf("\n") + 1) }))
    .filter((s) => s.body.trim() && !/^17[.]?\s*MCQs|^MCQs/i.test(s.title));
}

export type Block =
  | { kind: "heading"; level: 3 | 4; text: string }
  | { kind: "bullets"; items: string[] }
  | { kind: "numbered"; items: string[]; start: number }
  | { kind: "quote"; text: string }
  | { kind: "table"; header: string[]; rows: string[][] }
  | { kind: "paragraph"; text: string };

/** Splits a pipe-table row into trimmed cells, honouring "\|" as a literal pipe (manual scan: no regex lookbehind, which older JS engines lack). */
function splitCells(line: string): string[] {
  const inner = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  const cells: string[] = [];
  let cell = "";
  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i]!;
    if (ch === "\\" && inner[i + 1] === "|") { cell += "|"; i++; }
    else if (ch === "|") { cells.push(cell.trim()); cell = ""; }
    else cell += ch;
  }
  cells.push(cell.trim());
  return cells;
}
const isSeparatorRow = (cells: string[]): boolean => cells.length > 0 && cells.every((c) => /^:?-+:?$/.test(c));

/** A pipe table: header row, a "|---|---|" separator row, then body rows (padded/trimmed to the header width). Null when the lines are not a table. */
function parseTable(lines: string[]): Extract<Block, { kind: "table" }> | null {
  if (lines.length < 2) return null;
  const header = splitCells(lines[0]!);
  if (!isSeparatorRow(splitCells(lines[1]!))) return null;
  const rows = lines.slice(2).map((l) => {
    const cells = splitCells(l);
    return header.map((_, i) => cells[i] ?? "");
  });
  return { kind: "table", header, rows };
}

/** Splits one section's body into renderable blocks. Wrapped lines of a paragraph/quote are joined; each block keeps its own kind. */
export function parseBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  type Mode = "none" | "bullets" | "numbered" | "quote" | "paragraph";
  let mode = "none" as Mode; // the cast keeps TS from narrowing to the literal: flush()/enter() reassign it from closures
  let items: string[] = [];
  let start = 1;
  const flush = () => {
    if (mode === "bullets" && items.length) blocks.push({ kind: "bullets", items });
    else if (mode === "numbered" && items.length) blocks.push({ kind: "numbered", items, start });
    else if (mode === "quote" || mode === "paragraph") {
      const t = items.join(" ").trim();
      if (t) blocks.push({ kind: mode, text: t });
    }
    mode = "none"; items = []; start = 1;
  };
  const enter = (next: Mode) => { if (mode !== next) { flush(); mode = next; } };

  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]!;
    const line = raw.trim();
    if (!line) { flush(); continue; }

    const heading = line.match(/^(#{3,})\s+(.*)/);
    if (heading) { flush(); blocks.push({ kind: "heading", level: heading[1]!.length >= 4 ? 4 : 3, text: heading[2]! }); continue; }

    if (line.startsWith("|")) {
      let end = i;
      while (end + 1 < lines.length && lines[end + 1]!.trim().startsWith("|")) end++;
      const table = parseTable(lines.slice(i, end + 1));
      if (table) { flush(); blocks.push(table); i = end; continue; }
    }

    const quote = line.match(/^>\s?(.*)/);
    if (quote) { enter("quote"); if (quote[1]!.trim()) items.push(quote[1]!.trim()); continue; }

    const numbered = line.match(/^(\d+)[.)]\s+(.*)/);
    if (numbered) { enter("numbered"); if (!items.length) start = Number(numbered[1]); items.push(numbered[2]!); continue; }

    const bullet = line.match(/^[-*]\s+(.*)/);
    if (bullet) { enter("bullets"); items.push(bullet[1]!); continue; }

    // An indented line directly under a list item continues that item.
    if ((mode === "bullets" || mode === "numbered") && /^\s{2,}\S/.test(raw) && items.length) { items[items.length - 1] += ` ${line}`; continue; }

    enter("paragraph");
    items.push(line);
  }
  flush();
  return blocks;
}

export type InlineSpan = { text: string; bold: boolean; italic?: true };
/** Splits "**bold**" and "*italic*" markers out of a line into styled spans. */
export function parseInline(text: string): InlineSpan[] {
  const spans: InlineSpan[] = [];
  const re = /\*\*(.+?)\*\*|\*(?![\s*])([^*\n]+?)\*(?!\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) spans.push({ text: text.slice(last, m.index), bold: false });
    spans.push(m[1] !== undefined ? { text: m[1], bold: true } : { text: m[2]!, bold: false, italic: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) spans.push({ text: text.slice(last), bold: false });
  return spans.length ? spans : [{ text, bold: false }];
}

/** Whole minutes to read a body at a typical study pace (never below 1). */
export function readingMinutes(body: string): number {
  const words = body.replace(/[|#>*_`-]+/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
