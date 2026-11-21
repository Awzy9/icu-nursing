import { StyleSheet, Text, View } from "react-native";
import { parseBlocks, parseInline, type Block } from "../core/markdown";
import { useApp } from "../state/app";
import { radius, space, type } from "./theme";

// Lesson content is English-only (see app.englishOnly), so it is always laid out left-to-right regardless of the UI language.
const LTR = { writingDirection: "ltr" } as const;

function InlineText({ text, style }: { text: string; style: object | object[] }) {
  return (
    <Text style={style}>
      {parseInline(text).map((s, i) => <Text key={i} style={[s.bold ? { fontWeight: "700" } : null, s.italic ? { fontStyle: "italic" } : null]}>{s.text}</Text>)}
    </Text>
  );
}

/** One list item with a fixed-width marker column, so wrapped lines hang under the text rather than under the marker. */
function ListRow({ marker, markerWidth, text }: { marker: string; markerWidth: number; text: string }) {
  const { palette } = useApp();
  return (
    <View style={{ flexDirection: "row", gap: space.sm, alignItems: "flex-start" }}>
      <Text style={[type.body, LTR, { width: markerWidth, textAlign: "right", color: palette.primary, fontWeight: "700", fontVariant: ["tabular-nums"] }]}>{marker}</Text>
      <InlineText text={text} style={[type.body, LTR, { flex: 1, color: palette.text }]} />
    </View>
  );
}

/** A table as stacked row cards: phone widths cannot hold 2-4 columns of sentence-length cells, and sideways scrolling hides data. The first column is the row's title; every other column is a labelled field. */
function TableBlock({ header, rows }: { header: string[]; rows: string[][] }) {
  const { palette } = useApp();
  return (
    <View style={{ gap: space.sm }}>
      {rows.map((row, i) => (
        <View key={i} style={{ backgroundColor: palette.surface, borderColor: palette.border, borderWidth: StyleSheet.hairlineWidth * 2, borderRadius: radius, padding: space.md, gap: space.sm }}>
          {row[0] ? <InlineText text={row[0]} style={[type.h3, LTR, { color: palette.text }]} /> : null}
          {row.slice(1).map((cell, j) => (cell ? (
            <View key={j} style={{ gap: 2 }}>
              {header[j + 1] ? <Text style={[type.small, LTR, { color: palette.muted, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4 }]}>{header[j + 1]}</Text> : null}
              <InlineText text={cell} style={[type.body, LTR, { color: palette.text }]} />
            </View>
          ) : null))}
        </View>
      ))}
    </View>
  );
}

function BlockView({ block }: { block: Block }) {
  const { palette } = useApp();
  switch (block.kind) {
    case "heading":
      return <Text accessibilityRole="header" style={[block.level === 3 ? type.h3 : { fontSize: 15, lineHeight: 21, fontWeight: "700" as const }, LTR, { color: palette.text, marginTop: space.sm }]}>{block.text}</Text>;
    case "bullets":
      return <View style={{ gap: space.xs }}>{block.items.map((item, i) => <ListRow key={i} marker="•" markerWidth={16} text={item} />)}</View>;
    case "numbered":
      return <View style={{ gap: space.xs }}>{block.items.map((item, i) => <ListRow key={i} marker={`${block.start + i}.`} markerWidth={26} text={item} />)}</View>;
    case "quote":
      return (
        <View style={{ borderLeftWidth: 4, borderLeftColor: palette.primary, backgroundColor: palette.surface, borderRadius: radius, padding: space.md }}>
          <InlineText text={block.text} style={[type.small, LTR, { color: palette.text }]} />
        </View>
      );
    case "table":
      return <TableBlock header={block.header} rows={block.rows} />;
    default:
      return <InlineText text={block.text} style={[type.body, LTR, { color: palette.text }]} />;
  }
}

/** Renders one lesson section's body as native blocks: sub-headings, bullet and numbered lists, quote callouts, tables and paragraphs, with **bold** and *italic* emphasis. */
export function MarkdownBody({ body }: { body: string }) {
  const blocks = parseBlocks(body);
  return <View style={{ gap: space.md }}>{blocks.map((b, i) => <BlockView key={i} block={b} />)}</View>;
}
