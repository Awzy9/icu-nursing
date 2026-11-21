import { useState } from "react";
import { Stack, useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { ROUTE_FOR_TYPE } from "../../src/core/search";
import { useCatalogList, useWaveformExercises } from "../../src/hooks/useRemoteContent";
import { useProgressSync } from "../../src/hooks/useProgressSync";
import { useApp } from "../../src/state/app";
import { observationSummary, practiceHeading } from "../../src/core/quiz-presentation";
import { Button, Callout, Card, H1, H2, NavCard, P, RemoteGate, Screen } from "../../src/ui/components";
import { WaveformChart } from "../../src/ui/waveform-chart";

// Mirrors src/components/working/waveform-exercise.tsx: multiple WaveformChart traces (pressure,
// flow, volume) plus a multiple-choice interpretation question - the multi-trace sibling of
// app/ecg/[key].tsx. moduleKey "WAVEFORMS" is not a real catalog entry, same convention as
// NEWS2/GCS/ECG.
export default function WaveformExerciseScreen() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const { t, rtl: ar } = useApp();
  const { recordAnswer } = useProgressSync();
  const exercises = useWaveformExercises();
  const catalog = useCatalogList();
  const [choice, setChoice] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);

  return (
    <Screen>
      <RemoteGate state={exercises} onRetry={exercises.refresh}>
        {(data) => {
          const exercise = data.find((e) => e.key === key);
          if (!exercise) return <P>{t("common.notFound")}</P>;
          const q = exercise.question;
          const heading = checked ? exercise.title[ar ? 1 : 0] : practiceHeading("waveforms", exercise.key, ar);
          const observations = observationSummary(exercise.accessibleDescription);
          const lessonKey = exercise.lessonHref.split("/").pop() ?? "";
          const typeByKey = catalog.status === "ready" ? new Map(catalog.data.map((c) => [c.key, c.type])) : new Map<string, string>();
          const lessonRoute = ROUTE_FOR_TYPE[typeByKey.get(lessonKey) ?? ""];

          function submit() {
            if (choice === null) return;
            setChecked(true);
            recordAnswer(exercise!.key, "WAVEFORMS", choice, choice === q.answer, Date.now());
          }

          return (
            <>
              <Stack.Screen options={{ title: heading }} />
              <H1>{heading}</H1>
              <P muted>{checked ? exercise.objective[ar ? 1 : 0] : (ar ? "اقرأ الموجة وحدّد النمط قبل إظهار التشخيص." : "Interpret the trace before the diagnosis is revealed.")}</P>

              <Card>{exercise.traces.map((trace) => <WaveformChart key={trace.label} trace={trace} description={observations[exercise.traces.indexOf(trace)]} />)}</Card>

              <H2>{t("waveforms.descriptionTitle")}</H2>
              <View style={{ gap: 4 }}>{(checked ? exercise.accessibleDescription : observations).map((line, i) => <P key={i} small>{`• ${line}`}</P>)}</View>

              <H2>{q.prompt}</H2>
              {q.options.map((option, i) => {
                const isMine = checked && choice === i, isCorrectOption = checked && i === q.answer;
                return <Button key={i} variant={choice === i ? "primary" : "outline"} disabled={checked} label={`${option}${isCorrectOption ? ` ✓ ${t("quiz.correct")}` : isMine ? " ✗" : ""}`} onPress={() => setChoice(i)} />;
              })}
              {checked ? (
                <>
                  <Callout tone={choice === q.answer ? "success" : "danger"}>{choice === q.answer ? t("quiz.correct") : t("quiz.incorrect")}</Callout>
                  <Card><P>{q.explanation}</P></Card>
                  {lessonRoute ? <NavCard href={`${lessonRoute}${lessonKey}`} title={t("waveforms.readLesson")} /> : null}
                </>
              ) : (
                <>
                  <P small muted>{t("study.checkPrompt")}</P>
                  <Button label={t("quiz.check")} disabled={choice === null} onPress={submit} />
                </>
              )}

              <H2>{t("waveforms.sourcesTitle")}</H2>
              <P small muted>{t("waveforms.sourcesNote")}</P>
              <View style={{ gap: 2 }}>{exercise.evidenceSources.map((s, i) => <P key={i} small muted>{`• ${s}`}</P>)}</View>
            </>
          );
        }}
      </RemoteGate>
    </Screen>
  );
}
