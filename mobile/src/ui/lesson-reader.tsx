import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import type { WorkingEntryShared } from "../core/remoteContent";
import { readingMinutes, splitSections, type MarkdownSection } from "../core/markdown";
import { markViewed, toggleTick } from "../core/progress";
import { useApp } from "../state/app";
import { BookmarkButton, Callout, cardStyle, CompleteButton, H2, NavCard, P } from "./components";
import { Icon } from "./icons";
import { MarkdownBody } from "./markdown-body";
import { accentForType, MIN_TARGET, radii, space, type } from "./theme";

// Lessons with more sections than this fold into an accordion; shorter ones are read straight through.
const ACCORDION_FROM = 4;

const prettyCategory = (c: string): string => c.replace(/[-_]+/g, " ").replace(/^./, (m) => m.toUpperCase());

/** Collapsible lesson sections: a 20-section lesson opens as a scannable table of contents (first section open) instead of one 19,000-character scroll. Only open sections are parsed and rendered. */
function SectionAccordion({ sections, sectionVisual }: { sections: MarkdownSection[]; sectionVisual?: (title: string) => React.ReactNode }) {
  const { t, palette } = useApp();
  const [open, setOpen] = useState<ReadonlySet<number>>(() => new Set([0]));
  const allOpen = open.size === sections.length;
  const toggle = (i: number) => setOpen((prev) => { const next = new Set(prev); if (next.has(i)) next.delete(i); else next.add(i); return next; });
  return (
    <View style={{ gap: space.md }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={[type.small, { color: palette.muted }]}>{t("reader.sections", { count: sections.length })}</Text>
        <Pressable accessibilityRole="button" onPress={() => setOpen(allOpen ? new Set() : new Set(sections.map((_, i) => i)))} style={{ minHeight: MIN_TARGET, justifyContent: "center", paddingHorizontal: space.sm }}>
          <Text style={[type.small, { color: palette.primary, fontWeight: "700" }]}>{allOpen ? t("reader.collapseAll") : t("reader.expandAll")}</Text>
        </Pressable>
      </View>
      {sections.map((section, i) => {
        const isOpen = open.has(i);
        return (
          <View key={i} style={[cardStyle(palette), { overflow: "hidden" }]}>
            <Pressable accessibilityRole="button" accessibilityState={{ expanded: isOpen }} accessibilityLabel={section.title} onPress={() => toggle(i)}
              style={({ pressed }) => ({ minHeight: 56, flexDirection: "row", alignItems: "center", gap: space.md, paddingHorizontal: space.md, paddingVertical: space.sm, backgroundColor: pressed ? palette.tint : "transparent" })}>
              <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: isOpen ? palette.primary : palette.tint, alignItems: "center", justifyContent: "center" }}>
                <Text style={[type.small, { color: isOpen ? palette.onPrimary : palette.primary, fontWeight: "700", fontVariant: ["tabular-nums"] }]}>{i + 1}</Text>
              </View>
              <Text style={[type.h3, { flex: 1, color: palette.text, writingDirection: "ltr" }]}>{section.title}</Text>
              <View style={{ transform: [{ rotate: isOpen ? "90deg" : "0deg" }] }}><Icon name="chevron" color={palette.muted} size={20} /></View>
            </Pressable>
            {isOpen ? <View style={{ padding: space.lg, paddingTop: space.md, borderTopWidth: 1, borderTopColor: palette.hairline }}>{sectionVisual?.(section.title)}<MarkdownBody body={section.body} /></View> : null}
          </View>
        );
      })}
    </View>
  );
}

/** Shared reader for any catalog entry that is just title + body sections (topics, skills, medications, equipment): mirrors the website's ModuleReader. Records the lesson as "viewed" once per visit. */
export function LessonReader({ entry, bookmarkKey, visual, sectionVisual, children }: { entry: WorkingEntryShared; bookmarkKey: string; visual?: React.ReactNode; sectionVisual?: (title: string) => React.ReactNode; children?: React.ReactNode }) {
  const { t, progress, update, palette, rtl, locale } = useApp();
  useEffect(() => { update((p) => markViewed(p, entry.key)); }, [entry.key, update]);
  const sections = splitSections(entry.body);
  const minutes = readingMinutes(entry.body);
  const accent = palette.accents[accentForType(entry.type)];

  return (
    <>
      {locale !== "en" ? <Callout tone="info">{t("app.englishOnly")}</Callout> : null}
      <View style={{ gap: space.sm }}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: space.sm }}>
          <View style={{ backgroundColor: accent.bg, borderRadius: radii.pill, paddingHorizontal: space.md, paddingVertical: 4 }}>
            <Text style={[type.caption, { color: accent.fg, textTransform: "uppercase", writingDirection: "ltr" }]}>{prettyCategory(entry.category)}</Text>
          </View>
          <Text style={[type.small, { color: palette.muted, writingDirection: rtl ? "rtl" : "ltr" }]}>{t("reader.readMinutes", { min: minutes })}</Text>
        </View>
        <Text accessibilityRole="header" style={[{ fontSize: 26, lineHeight: 32, fontWeight: "700", letterSpacing: -0.3 }, { color: palette.text, writingDirection: "ltr" }]}>{entry.title}</Text>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
        <View style={{ flexGrow: 1, flexBasis: 140 }}><BookmarkButton itemKey={bookmarkKey} /></View>
        <View style={{ flexGrow: 1, flexBasis: 200 }}><CompleteButton moduleKey={entry.key} /></View>
      </View>
      {visual}
      {children}
      {entry.questions?.length ? <NavCard href={`/quiz/${entry.key}`} title={t("quiz.title")} body={`${entry.questions.length} questions · Answer explanations included`} icon="help" accent="practice" /> : null}
      {(entry.checklist?.length ?? 0) >= 2 ? <NavCard href={`/step-order/${entry.key}`} title="Practise step ordering" body="Put the clinical skill steps in their correct sequence" icon="checklist" accent="skills" /> : null}
      {entry.checklist?.length ? (
        <View style={{ gap: space.sm }}>
          <H2>{t("skills.checklist")}</H2>
          <P muted small>{t("skills.notice")}</P>
          <P small>{t("skills.ticked", { done: (progress.ticks[entry.key] ?? []).length, total: entry.checklist.length })}</P>
          {entry.checklist.map((item, i) => {
            const ticked = (progress.ticks[entry.key] ?? []).includes(i);
            return (
              <Pressable key={i} accessibilityRole="checkbox" accessibilityState={{ checked: ticked }} onPress={() => update((p) => toggleTick(p, entry.key, i))}
                style={{ ...cardStyle(palette), flexDirection: "row", gap: space.md, alignItems: "flex-start", padding: space.md, borderColor: ticked ? palette.primary : palette.hairline }}>
                <View style={{ width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: ticked ? palette.primary : palette.border, backgroundColor: ticked ? palette.primary : "transparent", alignItems: "center", justifyContent: "center" }}>
                  {ticked ? <Icon name="check" color={palette.onPrimary} size={16} strokeWidth={3} /> : null}
                </View>
                <Text style={[type.body, { flex: 1, color: palette.text, writingDirection: "ltr" }]}>{item}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
      {sections.length >= ACCORDION_FROM ? <SectionAccordion sections={sections} sectionVisual={sectionVisual} /> : sections.map((section, i) => (
        <View key={i} style={[cardStyle(palette), { padding: space.lg, gap: space.md }]}>
          <Text accessibilityRole="header" style={[type.h2, { color: palette.text, writingDirection: "ltr" }]}>{section.title}</Text>
          {sectionVisual?.(section.title)}
          <MarkdownBody body={section.body} />
        </View>
      ))}
    </>
  );
}
