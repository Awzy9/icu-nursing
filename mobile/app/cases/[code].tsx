import { useState } from "react";
import { scenarioVersion, canResumeScenario, sequentialHistory, restoreScenarioDecisions } from "@icu/schemas/scenario-session";
import { scenarioDebrief, type ScenarioDecision } from "@icu/schemas/scenario-debrief";
import { Stack, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import { scoreTenths } from "../../src/core/engines";
import { monitorReadings, remainingObservations } from "../../src/core/monitorReadings";
import { getSession, recordCase } from "../../src/core/progress";
import { BookmarkButton, Button, Card, H2, P, RemoteGate, Screen } from "../../src/ui/components";
import { ModuleVisuals } from "../../src/ui/module-visuals";
import { CaseComparison } from "../../src/ui/case-comparison";
import { WaveformChart } from "../../src/ui/waveform-chart";
import { space, type } from "../../src/ui/theme";
import { useApp } from "../../src/state/app";
import { useProgressSync } from "../../src/hooks/useProgressSync";
import { useCaseVisuals, useCatalogEntry, useEcgExercises } from "../../src/hooks/useRemoteContent";

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
  const { saveSession, discardSession } = useProgressSync();
  const entry = useCatalogEntry(code);
  const caseVisuals = useCaseVisuals();
  const ecgExercises = useEcgExercises();
  const [position, setPosition] = useState<number | undefined>();
  const [points, setPoints] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(false);
  const [resumed, setResumed] = useState(false);
  const [visited, setVisited] = useState<number[]>([]);
  const [decisions, setDecisions] = useState<ScenarioDecision[]>([]);
  const [resumedWithoutDecisions, setResumedWithoutDecisions] = useState(false);
  const [historyIncomplete, setHistoryIncomplete] = useState(false);

  const existingSession = code ? getSession(progress, code) : undefined;

  return (
    <Screen>
      <RemoteGate state={entry} onRetry={entry.refresh}>
        {(data) => {
          const scenario = data.scenario;
          if (!scenario) return <P>{t("common.notFound")}</P>;
          const visualMap = caseVisuals.status === "ready" ? caseVisuals.data : undefined;
          const equipmentVisualKey = visualMap?.equipment[code ?? ""] ?? (code === "SC-10" ? "MD-15" : undefined);
          const numericMonitorCases = caseVisuals.status === "ready" ? caseVisuals.data.numericMonitor : [];
          const showNumericMonitor = numericMonitorCases.includes(code ?? "");
          const showNeuro = visualMap?.neuroComparison === code;
          const showPerfusion = visualMap?.perfusionPanel.includes(code ?? "") ?? false;

          const pos = position ?? scenario.steps[0]!.position;
          const rhythm = visualMap?.rhythm;
          const showRhythm = rhythm?.caseKey === code && rhythm.positions.includes(pos);
          const rhythmTrace = showRhythm && ecgExercises.status === "ready" ? ecgExercises.data.find((exercise) => exercise.key === rhythm?.exerciseKey)?.trace : undefined;
          const step = scenario.steps.find((s) => s.position === pos)!;
          const previousSteps = visited.flatMap((n) => scenario.steps.filter((item) => item.position === n));
          const option = choice === null ? undefined : step.options[choice];
          const supplemental = remainingObservations(step.observations, { numeric: showNumericMonitor, neuro: showNeuro, perfusion: showPerfusion });
          const sharedCheckpoint = option?.next != null && step.options.every(o => o.next === option.next);
          const version = scenarioVersion(scenario);

          if (existingSession && !resumed && !done && position === undefined && canResumeScenario(scenario, existingSession)) {
            const stepIndex = scenario.steps.findIndex((s) => s.position === existingSession.position);
            return (
              <Card>
                <H2>{t("cases.resume")}</H2>
                <P muted>{t("cases.resumeBody")}</P>
                <P small muted>{t("cases.step", { n: stepIndex + 1, total: scenario.steps.length })}</P>
                <Button label={t("hub.continue")} onPress={() => { setResumed(true); setPosition(existingSession.position); setPoints(existingSession.score); const restored = restoreScenarioDecisions(scenario, existingSession); setDecisions(restored.decisions); setResumedWithoutDecisions(restored.incomplete); const prior = sequentialHistory(scenario, existingSession.position) ?? existingSession.visited; setVisited(prior ?? []); setHistoryIncomplete(existingSession.position !== scenario.steps[0]!.position && !prior?.length); }} />
                <Button label={t("cases.restart")} variant="outline" onPress={() => { setResumed(true); setVisited([]); setHistoryIncomplete(false); discardSession(code!); }} />
              </Card>
            );
          }

          if (existingSession && !resumed && !done && position === undefined && !existingSession.finished && !canResumeScenario(scenario, existingSession)) {
            return <Card>
              <H2>{locale === "ar" ? "تغير محتوى الحالة" : "Saved scenario cannot be resumed"}</H2>
              <P>{locale === "ar" ? "تغير المحتوى أو أن التقدم المحفوظ غير صالح. ابدأ الحالة من جديد." : "The scenario has changed or the saved progress is invalid. Start again to use the current content."}</P>
              <Button label={t("cases.restart")} onPress={() => { setResumed(true); setVisited([]); setHistoryIncomplete(false); discardSession(code!); }} />
            </Card>;
          }

          if (done) {
            const debrief = scenarioDebrief(scenario, decisions);
            return (
              <Card>
                <H2>{t("cases.summary")}</H2>
                <P>{locale === "ar" ? "مجموع النقاط" : "Total learning points"}: {points}</P>
                <P>{locale === "ar" ? "نقاط القرارات المسجلة" : "Recorded decisions"}: {debrief.observedPoints} / {debrief.observedMaximum}</P>
                {resumedWithoutDecisions ? <P small muted>{locale === "ar" ? "لا تتوفر تفاصيل القرارات السابقة للاستئناف. تعرض المراجعة القرارات المسجلة هنا فقط." : "Some earlier answer details are unavailable. This review covers only retained decisions."}</P> : null}
                <P small muted>{locale === "ar" ? "للتعلم فقط، وليس تقييماً للكفاءة السريرية." : "Educational feedback only; not a clinical competency assessment."}</P>
                {debrief.priorities.length ? <H2>{locale === "ar" ? "أولويات المراجعة" : "Review priorities"}</H2> : <P>{locale === "ar" ? "لا توجد قرارات مسجلة تحتاج إلى مراجعة." : "No recorded decisions require review."}</P>}
                {debrief.priorities.map(item => <Card key={item.position}><P>Step {item.position}: {item.points} / {item.maximum} points</P><P>{item.prompt}</P><P>Your choice: {item.selected}</P><P>{item.feedback}</P><P>Preferred response: {item.preferred}</P><P>{item.preferredFeedback}</P></Card>)}
                <H2>{locale === "ar" ? "ما تعلمته" : "Your takeaways"}</H2>
                {scenario.takeaways.map((item, i) => <P key={i}>{`• ${item}`}</P>)}
                <Button label={t("cases.again")} variant="outline" onPress={() => { discardSession(code!); setPosition(scenario.steps[0]!.position); setPoints(0); setChoice(null); setRevealed(false); setDone(false); setVisited([]); setDecisions([]); setResumedWithoutDecisions(false); setHistoryIncomplete(false); }} />
              </Card>
            );
          }

          const decide = () => { if (choice !== null) setRevealed(true); };
          const advance = () => {
            if (!option || choice === null) return;
            const recorded = [...decisions, { position: pos, choice }];
            setDecisions(recorded);
            const newPoints = points + option.points;
            setPoints(newPoints);
            if (option.next == null) {
              const tenths = scoreTenths(newPoints, scenario.steps.length * 2);
              const at = new Date().toISOString();
              update((p) => recordCase(p, code!, tenths, at));
              saveSession(code!, { kind: "scenario", version, position: pos, score: newPoints, finished: true, at, decisions: recorded }); // local auto-discards a finished session; the remote row is kept, matching the website
              setDone(true);
            } else {
              saveSession(code!, { kind: "scenario", version, position: option.next, score: newPoints, finished: false, at: new Date().toISOString(), visited: [...visited, pos].slice(-100), decisions: recorded });
              setVisited((old) => [...old, pos]);
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
              {equipmentVisualKey && pos === scenario.steps[0]?.position ? <ModuleVisuals moduleKey={equipmentVisualKey} hideTeaching={!revealed} /> : null}
              {showRhythm ? (rhythmTrace ? <Card><WaveformChart trace={rhythmTrace} /></Card> : <P small muted>{t("common.loading")}</P>) : null}
              {showNumericMonitor ? monitorReadings(step.observations).map((r) => <Monitor key={r.metric.key} label={r.metric.name[locale === "ar" ? 1 : 0]} value={r.value} suffix={r.metric.suffix} />) : null}
              {showNeuro ? <CaseComparison kind="neuro" observations={step.observations} earlier={previousSteps} historyIncomplete={historyIncomplete} ar={locale === "ar"} /> : null}
              {showPerfusion ? <CaseComparison kind="perfusion" observations={step.observations} earlier={previousSteps} historyIncomplete={historyIncomplete} ar={locale === "ar"} /> : null}
              <P small muted>{t("cases.step", { n: scenario.steps.findIndex((s) => s.position === pos) + 1, total: scenario.steps.length })}</P>
              <Card><P>{step.info}</P></Card>
              {supplemental.length > 0 ? <Card>
                <H2>{locale === "ar" ? "ملاحظات الحالة" : "Case observations"}</H2>
                {supplemental.map((o, i) => <P key={`${o.label}-${i}`}>{o.label}: {String(o.value)}{o.unit ? ` ${o.unit}` : ""}</P>)}
              </Card> : null}
              <H2>{step.prompt}</H2>
              {step.options.map((o, i) => (
                <Button key={i} label={o.text} variant={choice === i ? "primary" : "outline"} disabled={revealed} onPress={() => setChoice(i)} />
              ))}
              {revealed && option ? (
                <Card>
                  <P>{t("cases.feedback")}</P>
                  <P>{option.feedback}</P>
                  {option.consequence ? <P small muted>{locale === "ar" ? "النتيجة المحتملة: " : "Possible consequence: "}{option.consequence}</P> : null}
                  {sharedCheckpoint ? <P small muted>{locale === "ar" ? "الخطوة التالية نقطة تعليمية مشتركة وليست نتيجة فردية لاختيارك." : "The next step is a shared teaching checkpoint, not an individualized outcome of your choice."}</P> : null}
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
