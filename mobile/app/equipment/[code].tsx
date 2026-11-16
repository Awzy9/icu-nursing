import { Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { findEquipment } from "../../src/core/content";
import { localized, localizedList } from "../../src/core/i18n";
import { markViewed } from "../../src/core/progress";
import { useApp } from "../../src/state/app";
import { BookmarkButton, BulletList, Callout, Card, H1, H2, P, Screen } from "../../src/ui/components";
import { Diagram } from "../../src/ui/diagram";
import { MIN_TARGET, radius, space, type } from "../../src/ui/theme";

export default function EquipmentDetail() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { t, locale, progress, update, palette, rtl } = useApp();
  const [sel, setSel] = useState<number | null>(null);
  const m = findEquipment(String(code));
  if (!m) return <Screen><P>{t("common.notFound")}</P></Screen>;
  const viewed = new Set(progress.viewed[m.code] ?? []);
  const choose = (i: number) => { setSel(i); update((p) => markViewed(p, m.code, m.diagram.parts[i]!.id)); };
  return (
    <Screen>
      <Stack.Screen options={{ title: localized(m.title, locale) }} />
      <H1>{localized(m.title, locale)}</H1>
      <P muted>{localized(m.summary, locale)}</P>
      <Callout>{t("equipment.notice")}</Callout>
      <BookmarkButton itemKey={`equipment:${m.code}`} />
      <Card>
        <Diagram kind={m.diagram.kind} count={m.diagram.parts.length} selected={sel} alt={localized(m.diagram.alt, locale)} />
        <P small muted>{localized(m.diagram.alt, locale)}</P>
      </Card>
      <H2>{t("equipment.parts")}</H2>
      <P small muted>{t("common.partsViewed", { done: m.diagram.parts.filter((p) => viewed.has(p.id)).length, total: m.diagram.parts.length })}</P>
      {m.diagram.parts.map((p, i) => (
        <Pressable key={p.id} accessibilityRole="button" accessibilityState={{ selected: sel === i }} accessibilityLabel={`${i + 1}. ${localized(p.label, locale)}${viewed.has(p.id) ? `, ${t("common.viewed")}` : ""}`} onPress={() => choose(i)}
          style={{ minHeight: MIN_TARGET, borderRadius: radius, paddingHorizontal: space.lg, flexDirection: "row", alignItems: "center", gap: space.md, borderWidth: sel === i ? 2 : 1, borderColor: sel === i ? palette.primary : palette.border, backgroundColor: palette.surface }}>
          <Text style={[type.h3, { color: palette.text }]}>{i + 1}</Text>
          <Text style={[type.body, { color: palette.text, flex: 1, writingDirection: rtl ? "rtl" : "ltr" }]}>{localized(p.label, locale)}</Text>
          {viewed.has(p.id) ? <Text style={[type.small, { color: palette.muted }]}>{t("common.viewed")}</Text> : null}
        </Pressable>
      ))}
      <View accessibilityLiveRegion="polite"><Card><P>{sel === null ? t("common.selectPart") : `${localized(m.diagram.parts[sel]!.label, locale)}: ${localized(m.diagram.parts[sel]!.detail, locale)}`}</P></Card></View>
      <H2>{t("equipment.parameters")}</H2>
      {m.parameters.map((p) => <Card key={p.key}><P>{localized(p.name, locale)}</P><P small muted>{localized(p.meaning, locale)}</P></Card>)}
      <H2>{t("equipment.safety")}</H2><BulletList items={localizedList(m.safety, locale)} />
      <H2>{t("equipment.escalation")}</H2><BulletList items={localizedList(m.escalation, locale)} />
    </Screen>
  );
}
