import { useState } from "react";
import { Stack, useLocalSearchParams } from "expo-router";
import { useDefibExercises, useEcgExercises } from "../../src/hooks/useRemoteContent";
import { useProgressSync } from "../../src/hooks/useProgressSync";
import { useApp } from "../../src/state/app";
import { observationSummary, practiceHeading } from "../../src/core/quiz-presentation";
import { Button, Callout, Card, H1, H2, P, RemoteGate, Screen } from "../../src/ui/components";
import { WaveformChart } from "../../src/ui/waveform-chart";

// Mirrors src/components/working/defib-exercise.tsx: a vignette plus a rhythm-strip trace and a
// shockable/non-shockable question. Unlike aline/ECG, the trace isn't authored here - traceKey
// references an existing ECG exercise, resolved via useEcgExercises (mobile/src/core/defib.ts),
// the same reuse src/lib/working/defib.ts's defibTrace() does.
export default function DefibExerciseScreen() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const { t, rtl: ar } = useApp();
  const { recordAnswer } = useProgressSync();
  const exercises = useDefibExercises();
  const ecgExercises = useEcgExercises();
  const [choice, setChoice] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);

  return (
    <Screen>
      <RemoteGate state={exercises} onRetry={exercises.refresh}>
        {(data) => {
          const exercise = data.find((e) => e.key === key);
          if (!exercise) return <P>{t("common.notFound")}</P>;
          const q = exercise.question;
          const heading = checked ? exercise.title[ar ? 1 : 0] : practiceHeading("defib", exercise.key, ar);

          return (
            <RemoteGate state={ecgExercises} onRetry={ecgExercises.refresh}>
              {(ecgs) => {
                const trace = ecgs.find((e) => e.key === exercise.traceKey)?.trace;
                if (!trace) return <P>{t("common.notFound")}</P>;
                const exerciseKey = exercise.key;

                const submit = () => {
                  if (choice === null) return;
                  setChecked(true);
                  recordAnswer(exerciseKey, "DEFIB", choice, choice === q.answer, Date.now());
                };

                return (
                  <>
                    <Stack.Screen options={{ title: heading }} />
                    <H1>{heading}</H1>
                    <Card>
                      <P>{exercise.vignette}</P>
                      <WaveformChart trace={{ ...trace, label: "ECG rhythm strip (schematic)" }} />
                    </Card>

                    <H2>{q.prompt}</H2>
                    {q.options.map((option, i) => {
                      const isMine = checked && choice === i, isCorrectOption = checked && i === q.answer;
                      return <Button key={i} variant={choice === i ? "primary" : "outline"} disabled={checked} label={`${option}${isCorrectOption ? ` ✓ ${t("quiz.correct")}` : isMine ? " ✗" : ""}`} onPress={() => setChoice(i)} />;
                    })}
                    {checked ? (
                      <>
                        <Callout tone={choice === q.answer ? "success" : "danger"}>{choice === q.answer ? t("quiz.correct") : t("quiz.incorrect")}</Callout>
                        <Card><P>{q.explanation}</P></Card>
                      </>
                    ) : (
                      <>
                        <P small muted>{t("study.checkPrompt")}</P>
                        <Button label={t("quiz.check")} disabled={choice === null} onPress={submit} />
                      </>
                    )}

                    <P small muted>{t("defib.sourcesNote")}</P>
                  </>
                );
              }}
            </RemoteGate>
          );
        }}
      </RemoteGate>
    </Screen>
  );
}
