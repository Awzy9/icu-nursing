import { useState } from "react";
import { Stack, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import { scoreTenths } from "../../src/core/engines";
import { monitorReadings } from "../../src/core/monitorReadings";
import { discardSession, getSession, recordCase, saveSession } from "../../src/core/progress";
import { glucoseMeterVisual } from "../../src/content/visuals";
import { BookmarkButton, Button, Card, H2, P, RemoteGate, Screen } from "../../src/ui/components";
import { VisualPhoto } from "../../src/ui/visual-photo";
import { space, type } from "../../src/ui/theme";
import { useApp } from "../../src/state/app";
import { useCaseVisuals, useCatalogEntry } from "../../src/hooks/useRemoteContent";

function Monitor({ label, value, suffix }: { label: string; value: number; suffix: string }) {
  return (
    <View style={{ backgroundColor: "#0f172a", borderRadius: 12, padding: space.md, marginBottom: space.sm }}>
      <Text style={[type.small, { color: "#e2e8f0" }]}>{label}</Text>
      <Text style={{ color: "#67e8f9", fontSize: 28, fontWeight: "700", writingDirection: "ltr" }}>{value}{suffix}</Text>
    </View>
  );
}

export default function CaseScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { t, locale, progress, update } = useApp();
  const entry = useCatalogEntry(code);
  const caseVisuals = useCaseVisuals();
  const [position, setPosition] = useState<number | undefined>();
  const [points, setPoints] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(false);
  const [resumed, setResumed] = useState(false);

  const existingSession = code ? getSession(progress, code) : undefined;

  return (
    <Screen>
      <RemoteGate state={entry} onRetry={entry.refresh}>
        {(data) => {
          const scenario = data.scenario;
          if (!scenario) return <P>{t("common.notFound")}</P>;
          const showGlucoseMeter = code === "SC-10";
          const numericMonitorCases = caseVisuals.status === "ready" ? caseVisuals.data.numericMonitor : [];
          const showNumericMonitor = numericMonitorCases.includes(code ?? "");

          const pos = position ?? scenario.steps[0]!.position;
          const step = scenario.steps.find((s) => s.position === pos)!;
          const option = choice === null ? undefined : step.options[choice];
          const version = JSON.stringify(scenario.steps.map((s) => ({ p: s.position, n: s.options.length })));

          if (existingSession && !resumed && !done && position === undefined && existingSession.version === version && !existingSession.finished) {
            const stepIndex = scenario.steps.findIndex((s) => s.position === existingSession.position);
            return (
              <Card>
                <H2>{t("cases.resume")}</H2>
                <P muted>{t("cases.resumeBody")}</P>
                <P small muted>{t("cases.step", { n: stepIndex + 1, total: scenario.steps.length })}</P>
                <Button label={t("hub.continue")} onPress={() => { setResumed(true); setPosition(existingSession.position); setPoints(existingSession.score); }} />
                <Button label={t("cases.restart")} variant="outline" onPress={() => { setResumed(true); update((p) => discardSession(p, code!)); }} />
              </Card>
            );
          }

          if (done) {
            return (
              <Card>
                <H2>{t("cases.summary")}</H2>
                {scenario.takeaways.map((item, i) => <P key={i}>{`• ${item}`}</P>)}
                <Button label={t("cases.again")} variant="outline" onPress={() => { update((p) => discardSession(p, code!)); setPosition(scenario.steps[0]!.position); setPoints(0); setChoice(null); setRevealed(false); setDone(false); }} />
              </Card>
            );
          }

          const decide = () => { if (choice !== null) setRevealed(true); };
          const advance = () => {
            if (!option) return;
            const newPoints = points + option.points;
            setPoints(newPoints);
            if (option.next == null) {
              const tenths = scoreTenths(newPoints, scenario.steps.length * 2);
              update((p) => recordCase(discardSession(p, code!), code!, tenths, new Date().toISOString()));
              setDone(true);
            } else {
              update((p) => saveSession(p, code!, { kind: "scenario", version, position: option.next!, score: newPoints, finished: false, at: new Date().toISOString() }));
              setPosition(option.next);
            }
            setChoice(null);
            setRevealed(false);
          };

          return (
            <>
              <Stack.Screen options={{ title: data.title }} />
              <P muted small>{t("app.englishOnly")}</P>
              <Text accessibilityRole="header" style={{ fontSize: 20, fontWeight: "700", writingDirection: "ltr" }}>{data.title}</Text>
              <BookmarkButton itemKey={`cases:${data.key}`} />
              {showGlucoseMeter ? <VisualPhoto visual={glucoseMeterVisual} /> : null}
              {showNumericMonitor ? monitorReadings(step.observations).map((r) => <Monitor key={r.metric.key} label={r.metric.name[locale === "ar" ? 1 : 0]} value={r.value} suffix={r.metric.suffix} />) : null}
              <P small muted>{t("cases.step", { n: scenario.steps.findIndex((s) => s.position === pos) + 1, total: scenario.steps.length })}</P>
              <Card><P>{step.info}</P></Card>
              <H2>{step.prompt}</H2>
              {step.options.map((o, i) => (
                <Button key={i} label={o.text} variant={choice === i ? "primary" : "outline"} disabled={revealed} onPress={() => setChoice(i)} />
              ))}
              {revealed && option ? (
                <Card>
                  <P>{t("cases.feedback")}</P>
                  <P>{option.feedback}</P>
                  {option.consequence ? <P small muted>{option.consequence}</P> : null}
                </Card>
              ) : null}
              <Button label={revealed ? (option?.next == null ? t("cases.summary") : t("cases.continue")) : t("cases.choose")} disabled={choice === null && !revealed} onPress={revealed ? advance : decide} />
            </>
          );
        }}
      </RemoteGate>
    </Screen>
  );
}
