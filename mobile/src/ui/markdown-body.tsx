import { Text, View } from "react-native";
import { parseBlocks, parseInline } from "../core/markdown";
import { useApp } from "../state/app";
import { space, type } from "./theme";

function InlineText({ text, style }: { text: string; style: object }) {
  return <Text style={style}>{parseInline(text).map((s, i) => s.bold ? <Text key={i} style={{ fontWeight: "700" }}>{s.text}</Text> : <Text key={i}>{s.text}</Text>)}</Text>;
}

/** Renders one lesson section's body (the website's "## Heading" sub-content) as native text: ### subheadings, bullet groups and paragraphs, with simple **bold** emphasis. Lesson content is English-only (see app.englishOnly), so it is always rendered left-to-right regardless of the UI language. */
export function MarkdownBody({ body }: { body: string }) {
  const { palette } = useApp();
  const blocks = parseBlocks(body);
  return (
    <View style={{ gap: space.sm }}>
      {blocks.map((b, i) => {
        if (b.kind === "heading") return <Text key={i} accessibilityRole="header" style={[type.h3, { color: palette.text, writingDirection: "ltr" }]}>{b.text}</Text>;
        if (b.kind === "bullets") return <View key={i} style={{ gap: space.xs / 2 }}>{b.items.map((item, j) => <InlineText key={j} text={`•  ${item}`} style={[type.body, { color: palette.text, writingDirection: "ltr" }]} />)}</View>;
        return <InlineText key={i} text={b.text} style={[type.body, { color: palette.text, writingDirection: "ltr" }]} />;
      })}
    </View>
  );
}
