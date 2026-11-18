import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import type { WorkingEntryShared } from "../core/remoteContent";
import { splitSections } from "../core/markdown";
import { markViewed, toggleTick } from "../core/progress";
import { useApp } from "../state/app";
import { BookmarkButton, Callout, H2, P } from "./components";
import { MarkdownBody } from "./markdown-body";
import { space } from "./theme";

/** Shared reader for any catalog entry that is just title + body sections (topics, skills, medications, equipment): mirrors the website's ModuleReader. Records the lesson as "viewed" once per visit. */
export function LessonReader({ entry, bookmarkKey, visual, children }: { entry: WorkingEntryShared; bookmarkKey: string; visual?: React.ReactNode; children?: React.ReactNode }) {
  const { t, progress, update, palette, rtl } = useApp();
  useEffect(() => { update((p) => markViewed(p, entry.key)); }, [entry.key, update]);
  const sections = splitSections(entry.body);

  return (
    <>
      <Callout tone="info">{t("app.englishOnly")}</Callout>
      <Text accessibilityRole="header" style={{ fontSize: 22, fontWeight: "700", color: palette.text, writingDirection: "ltr" }}>{entry.title}</Text>
      <BookmarkButton itemKey={bookmarkKey} />
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
                style={{ flexDirection: rtl ? "row-reverse" : "row", gap: space.sm, alignItems: "flex-start", padding: space.sm, borderWidth: 1, borderColor: palette.border, borderRadius: 8 }}>
                <View style={{ width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: ticked ? palette.primary : palette.border, backgroundColor: ticked ? palette.primary : "transparent", alignItems: "center", justifyContent: "center" }}>
                  {ticked ? <Text style={{ color: palette.onPrimary, fontWeight: "700" }}>✓</Text> : null}
                </View>
                <Text style={{ flex: 1, color: palette.text, writingDirection: "ltr" }}>{item}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
      {sections.map((section, i) => (
        <View key={i} style={{ gap: space.xs }}>
          <Text accessibilityRole="header" style={{ fontSize: 18, fontWeight: "700", color: palette.text, writingDirection: "ltr" }}>{section.title}</Text>
          <MarkdownBody body={section.body} />
        </View>
      ))}
    </>
  );
}
