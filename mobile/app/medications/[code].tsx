import { Stack, useLocalSearchParams } from "expo-router";
import React from "react";
import { findMedication } from "../../src/core/content";
import { localized, localizedList } from "../../src/core/i18n";
import { useApp } from "../../src/state/app";
import { BookmarkButton, BulletList, Callout, Card, H1, H2, P, Screen } from "../../src/ui/components";

// Institution-specific preparation and dosing sections are deliberately not rendered by this app.
const SHOWN = ["general_pharmacology", "nursing_responsibilities", "safety_alerts", "adverse_effects", "escalation"];

export default function MedicationDetail() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { t, locale } = useApp();
  const m = findMedication(String(code));
  if (!m) return <Screen><P>{t("common.notFound")}</P></Screen>;
  return (
    <Screen>
      <Stack.Screen options={{ title: localized(m.name, locale) }} />
      <H1>{localized(m.name, locale)}</H1>
      <P muted>{localized(m.drugClass, locale)}</P>
      {m.highAlert ? <Callout tone="warn">{t("medications.highAlert")}</Callout> : null}
      <P>{localized(m.summary, locale)}</P>
      <Callout>{t("medications.notice")}</Callout>
      <BookmarkButton itemKey={`medication:${m.code}`} />
      {SHOWN.filter((k) => m.sections[k]).map((k) => <React.Fragment key={k}><H2>{k.replace(/_/g, " ")}</H2><BulletList items={localizedList(m.sections[k], locale)} /></React.Fragment>)}
      <H2>{t("medications.monitoring")}</H2>
      {m.monitoring.map((x, i) => <Card key={i}><P>{localized(x.text, locale)}</P></Card>)}
    </Screen>
  );
}
