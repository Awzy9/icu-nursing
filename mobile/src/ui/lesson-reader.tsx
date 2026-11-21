import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { WorkingEntryShared } from "../core/remoteContent";
import { readingMinutes, splitSections, type MarkdownSection } from "../core/markdown";
import { markViewed, toggleTick } from "../core/progress";
import { useApp } from "../state/app";
import { BookmarkButton, Callout, CompleteButton, H2, P } from "./components";
import { MarkdownBody } from "./markdown-body";
import { MIN_TARGET, radius, space, type } from "./theme";

// Lessons with more sections than this fold into an accordion; shorter ones are read straight through.
const ACCORDION_FROM = 4;

const prettyCategory = (c: string): string => c.replace(/[-_]+/g, " ").replace(/^./, (m) => m.toUpperCase());

/** Collapsible lesson sections: a 20-section lesson opens as a scannable table of contents (first section open) instead of one 19,000-character scroll. Only open sections are parsed and rendered. */
function SectionAccordion({ sections }: { sections: MarkdownSection[] }) {
  const { t, palette } = useApp();
  const [open, setOpen] = useState<ReadonlySet<number>>(() => new Set([0]));
  const allOpen = open.size === sections.length;
  const toggle = (i: number) => setOpen((prev) => { const next = new Set(prev); if (next.has(i)) next.delete(i); else next.add(i); return next; });
  return (
    <View style={{ gap: space.sm }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={[type.small, { color: palette.muted }]}>{t("reader.sections", { count: sections.length })}</Text>
        <Pressable accessibilityRole="button" onPress={() => setOpen(allOpen ? new Set() : new Set(sections.map((_, i) => i)))} style={{ minHeight: MIN_TARGET, justifyContent: "center", paddingHorizontal: space.sm }}>
          <Text style={[type.small, { color: palette.primary, fontWeight: "700" }]}>{allOpen ? t("reader.collapseAll") : t("reader.expandAll")}</Text>
        </Pressable>
      </View>
      {sections.map((section, i) => {
        const isOpen = open.has(i);
        return (
          <View key={i} style={{ borderWidth: StyleSheet.hairlineWidth * 2, borderColor: palette.border, borderRadius: radius, overflow: "hidden" }}>
            <Pressable accessibilityRole="button" accessibilityState={{ expanded: isOpen }} accessibilityLabel={section.title} onPress={() => toggle(i)}
              style={({ pressed }) => ({ minHeight: MIN_TARGET, flexDirection: "row", alignItems: "center", gap: space.md, paddingHorizontal: space.md, paddingVertical: space.sm, backgroundColor: palette.surface, opacity: pressed ? 0.85 : 1 })}>
              <Text style={[type.small, { width: 22, textAlign: "center", color: palette.primary, fontWeight: "700", fontVariant: ["tabular-nums"] }]}>{i + 1}</Text>
              <Text style={[type.h3, { flex: 1, color: palette.text, writingDirection: "ltr" }]}>{section.title}</Text>
              <Text style={[type.body, { color: palette.muted }]}>{isOpen ? "▴" : "▾"}</Text>
            </Pressable>
            {isOpen ? <View style={{ padding: space.md, backgroundColor: palette.bg }}><MarkdownBody body={section.body} /></View> : null}
          </View>
        );
      })}
    </View>
  );
}

/** Shared reader for any catalog entry that is just title + body sections (topics, skills, medications, equipment): mirrors the website's ModuleReader. Records the lesson as "viewed" once per visit. */
export function LessonReader({ entry, bookmarkKey, visual, children }: { entry: WorkingEntryShared; bookmarkKey: string; visual?: React.ReactNode; children?: React.ReactNode }) {
  const { t, progress, update, palette, rtl, locale } = useApp();
  useEffect(() => { update((p) => markViewed(p, entry.key)); }, [entry.key, update]);
  const sections = splitSections(entry.body);
  const minutes = readingMinutes(entry.body);

  return (
    <>
      {locale !== "en" ? <Callout tone="info">{t("app.englishOnly")}</Callout> : null}
      <View style={{ gap: space.xs }}>
        <Text accessibilityRole="header" style={[{ fontSize: 24, lineHeight: 30, fontWeight: "700" }, { color: palette.text, writingDirection: "ltr" }]}>{entry.title}</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: space.sm }}>
          <Text style={[type.small, { color: palette.muted, writingDirection: "ltr" }]}>{prettyCategory(entry.category)}</Text>
          <Text style={[type.small, { color: palette.muted }]}>·</Text>
          <Text style={[type.small, { color: palette.muted, writingDirection: rtl ? "rtl" : "ltr" }]}>{t("reader.readMinutes", { min: minutes })}</Text>
        </View>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
        <View style={{ flexGrow: 1, flexBasis: 130 }}><BookmarkButton itemKey={bookmarkKey} /></View>
        <View style={{ flexGrow: 1, flexBasis: 200 }}><CompleteButton moduleKey={entry.key} /></View>
      </View>
      {visual}
      {children}
      {entry.checklist?.length ? (
        <View style={{ gap: space.sm }}>
          <H2>{t("skills.checklist")}</H2>
          <P muted small>{t("skills.notice")}</P>
          <P small>{t("skills.ticked", { done: (progress.ticks[entry.key] ?? []).length, total: entry.checklist.length })}</P>
          {entry.checklist.map((item, i) => {
            const ticked = (progress.ticks[entry.key] ?? []).includes(i);
            return (
              <Pressable key={i} accessibilityRole="checkbox" accessibilityState={{ checked: ticked }} onPress={() => update((p) => toggleTick(p, entry.key, i))}
                style={{ flexDirection: "row", gap: space.sm, alignItems: "flex-start", padding: space.sm, borderWidth: 1, borderColor: palette.border, borderRadius: 8 }}>
                <View style={{ width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: ticked ? palette.primary : palette.border, backgroundColor: ticked ? palette.primary : "transparent", alignItems: "center", justifyContent: "center" }}>
                  {ticked ? <Text style={{ color: palette.onPrimary, fontWeight: "700" }}>✓</Text> : null}
                </View>
                <Text style={{ flex: 1, color: palette.text, writingDirection: "ltr" }}>{item}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
      {sections.length >= ACCORDION_FROM ? <SectionAccordion sections={sections} /> : sections.map((section, i) => (
        <View key={i} style={{ gap: space.sm }}>
          <Text accessibilityRole="header" style={[type.h2, { color: palette.text, writingDirection: "ltr" }]}>{section.title}</Text>
          <MarkdownBody body={section.body} />
        </View>
      ))}
    </>
  );
}
