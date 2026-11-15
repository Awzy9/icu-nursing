import { Stack, useLocalSearchParams } from "expo-router";
import React from "react";
import { Pressable, Text } from "react-native";
import { findSkill } from "../../src/core/content";
import { localized, localizedList } from "../../src/core/i18n";
import { toggleTick } from "../../src/core/progress";
import { useApp } from "../../src/state/app";
import { BookmarkButton, BulletList, Callout, H1, H2, P, Screen } from "../../src/ui/components";
import { MIN_TARGET, radius, space, type } from "../../src/ui/theme";

export default function SkillDetail() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { t, locale, progress, update, palette, rtl } = useApp();
  const s = findSkill(String(code));
  if (!s) return <Screen><P>{t("common.notFound")}</P></Screen>;
  const ticks = new Set(progress.ticks[s.code] ?? []);
  const sections = ["indications", "safety", "responsibilities", "escalation"].filter((k) => s.sections[k]);
  return (
    <Screen>
      <Stack.Screen options={{ title: localized(s.title, locale) }} />
      <H1>{localized(s.title, locale)}</H1>
      <P muted>{localized(s.summary, locale)}</P>
      <Callout>{t("skills.notice")}</Callout>
      <BookmarkButton itemKey={`skill:${s.code}`} />
      {sections.map((k) => <React.Fragment key={k}><H2>{k.replace(/_/g, " ")}</H2><BulletList items={localizedList(s.sections[k], locale)} /></React.Fragment>)}
      <H2>{t("skills.checklist")}</H2>
      <P small muted>{t("skills.ticked", { done: ticks.size, total: s.checklist.length })}</P>
      {s.checklist.map((c, i) => (
        <Pressable key={i} accessibilityRole="checkbox" accessibilityState={{ checked: ticks.has(i) }} accessibilityLabel={`${localized(c.text, locale)}${c.critical ? `, ${t("skills.critical")}` : ""}`} onPress={() => update((p) => toggleTick(p, s.code, i))}
          style={{ minHeight: MIN_TARGET, flexDirection: "row", alignItems: "center", gap: space.md, padding: space.md, borderRadius: radius, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface }}>
          <Text style={[type.h3, { color: palette.primary, width: 28 }]}>{ticks.has(i) ? "☑" : "☐"}</Text>
          <Text style={[type.body, { color: palette.text, flex: 1, writingDirection: rtl ? "rtl" : "ltr" }]}>{localized(c.text, locale)}{c.critical ? `  (${t("skills.critical")})` : ""}</Text>
        </Pressable>
      ))}
    </Screen>
  );
}
