// Pure parsing of the website's lesson body markdown (plain "## Heading" / "### Subheading"
// sections, "- " bullet lines, "**bold**" spans) into a structure the native reader can render
// without a markdown-rendering dependency. Mirrors the splitting approach already used by the
// website's own ModuleReader (src/components/working/reader.tsx: body.split(/^## /m)).

export interface MarkdownSection { title: string; body: string }
export function splitSections(body: string): MarkdownSection[] {
  const pieces = body.split(/^## /m);
  return pieces.slice(1)
    .map((text) => ({ title: text.split("\n")[0]!.replace(/^\d+[.]\s*/, "").trim(), body: text.slice(text.indexOf("\n") + 1) }))
    .filter((s) => s.body.trim() && !/^17[.]?\s*MCQs|^MCQs/i.test(s.title));
}

export type Block = { kind: "heading"; level: 3; text: string } | { kind: "bullets"; items: string[] } | { kind: "paragraph"; text: string };

/** Splits one section's body into renderable blocks: "### " subheadings, "- " bullet groups, and plain paragraphs. */
export function parseBlocks(text: string): Block[] {
  const lines = text.split("\n");
  const blocks: Block[] = [];
  let bullets: string[] = [];
  let paragraph: string[] = [];
  const flushBullets = () => { if (bullets.length) { blocks.push({ kind: "bullets", items: bullets }); bullets = []; } };
  const flushParagraph = () => { const t = paragraph.join(" ").trim(); if (t) blocks.push({ kind: "paragraph", text: t }); paragraph = []; };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { flushBullets(); flushParagraph(); continue; }
    const heading = line.match(/^###\s+(.*)/);
    if (heading) { flushBullets(); flushParagraph(); blocks.push({ kind: "heading", level: 3, text: heading[1]! }); continue; }
    const bullet = line.match(/^[-*]\s+(.*)/);
    if (bullet) { flushParagraph(); bullets.push(bullet[1]!); continue; }
    flushBullets();
    paragraph.push(line);
  }
  flushBullets(); flushParagraph();
  return blocks;
}

export type InlineSpan = { text: string; bold: boolean };
/** Splits "**bold**" markers out of a line into plain/bold spans, for simple inline emphasis. */
export function parseInline(text: string): InlineSpan[] {
  const spans: InlineSpan[] = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) spans.push({ text: text.slice(last, m.index), bold: false });
    spans.push({ text: m[1]!, bold: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) spans.push({ text: text.slice(last), bold: false });
  return spans.length ? spans : [{ text, bold: false }];
}
