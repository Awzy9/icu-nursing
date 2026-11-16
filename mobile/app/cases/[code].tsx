import { Stack, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { View } from "react-native";
import { findCase } from "../../src/core/content";
import { caseSummary, choose, currentStep, startCase, type CaseRun, type Reveal } from "../../src/core/engines";
import { localized, localizedList } from "../../src/core/i18n";
import { recordCase } from "../../src/core/progress";
import { useApp } from "../../src/state/app";
import { BookmarkButton, BulletList, Button, Callout, Card, H1, H2, P, Screen } from "../../src/ui/components";

export default function CaseRunner() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { t, locale, update } = useApp();
  const c = findCase(String(code));
  const [run, setRun] = useState<CaseRun | null>(() => (c ? startCase(c, Date.now() % 100000) : null));
  const [reveal, setReveal] = useState<Reveal | null>(null);
  if (!c || !run) return <Screen><P>{t("common.notFound")}</P></Screen>;

  const decide = (index: number) => { const r = choose(c, run, index); setRun(r.run); setReveal(r.reveal); if (r.run.done) update((p) => recordCase(p, c.code, caseSummary(c, r.run).scoreTenths, new Date().toISOString())); };
  const next = () => setReveal(null);
  const again = () => { setRun(startCase(c, (Date.now() + 7) % 100000)); setReveal(null); };
  const summary = run.done && !reveal ? caseSummary(c, run) : null;

  return (
    <Screen>
      <Stack.Screen options={{ title: localized(c.title, locale) }} />
      <H1>{localized(c.title, locale)}</H1>
      <BookmarkButton itemKey={`case:${c.code}`} />
      {reveal ? (
        <>
          <H2>{t("cases.consequence")}</H2>
          <Card><P>{reveal.option.consequence ? localized(reveal.option.consequence, locale) : ""}</P></Card>
          <H2>{t("cases.feedback")}</H2>
          <Card><P>{localized(reveal.option.feedback, locale)}</P><P small muted>{t("cases.scopes")}: {t(`scope.${reveal.option.scope}`)}</P></Card>
          <Button label={reveal.finished ? t("cases.summary") : t("cases.continue")} onPress={next} />
        </>
      ) : summary ? (
        <>
          <H2>{t("cases.summary")}</H2>
          <Card><P>{t("cases.score", { score: Math.round(summary.scoreTenths / 10) })}</P><P small muted>{t("cases.scoreNote")}</P>{summary.revisit.length ? <P>{t("cases.revisit", { steps: summary.revisit.join(", ") })}</P> : null}</Card>
          {summary.debrief ? <><H2>{t("cases.debrief")}</H2><BulletList items={localizedList(summary.debrief, locale)} /></> : null}
          <View style={{ gap: 8 }}>{Object.entries(summary.scopeCounts).map(([s, n]) => <P key={s} small muted>{`${t(`scope.${s}`)}: ${n}`}</P>)}</View>
          <Button label={t("cases.again")} variant="outline" onPress={again} />
        </>
      ) : (
        (() => {
          const step = currentStep(c, run);
          return (
            <>
              <P small muted>{t("cases.step", { n: step.position, total: step.total })}</P>
              <Card><P>{localized(step.info, locale)}</P>{step.observations.map((o) => <P key={o.key} small muted>{`${localized(o.label, locale)}: ${o.value}${o.unit ? ` ${o.unit}` : ""}`}</P>)}</Card>
              <H2>{localized(step.prompt, locale)}</H2>
              {step.options.map((o) => <Button key={o.index} label={localized(o.text, locale)} variant="outline" onPress={() => decide(o.index)} />)}
            </>
          );
        })()
      )}
      <Callout>{t("cases.scoreNote")}</Callout>
    </Screen>
  );
}
