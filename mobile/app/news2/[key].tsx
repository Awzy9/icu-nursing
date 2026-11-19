import { useState } from "react";
import { Stack, useLocalSearchParams } from "expo-router";
import { useNews2Cases } from "../../src/hooks/useRemoteContent";
import { useProgressSync } from "../../src/hooks/useProgressSync";
import { useApp } from "../../src/state/app";
import { Button, Callout, Card, H1, H2, P, RemoteGate, Screen } from "../../src/ui/components";

// Mirrors src/components/working/news2-exercise.tsx: a multiple-choice question over a vitals
// vignette, no custom visualization - the NEWS2 scoring table is applied by the learner, not
// drawn by the app. The module key used for sync ("NEWS2") is not a real catalog entry; see
// mobile/src/core/news2.ts for why that is fine for this write.
export default function News2Exercise() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const { t } = useApp();
  const { recordAnswer } = useProgressSync();
  const cases = useNews2Cases();
  const [choice, setChoice] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);

  return (
    <Screen>
      <RemoteGate state={cases} onRetry={cases.refresh}>
        {(data) => {
          const exercise = data.find((c) => c.key === key);
          if (!exercise) return <P>{t("common.notFound")}</P>;

          function submit() {
            if (choice === null) return;
            setChecked(true);
            recordAnswer(exercise!.key, "NEWS2", choice, choice === exercise!.answer, Date.now());
          }

          return (
            <>
              <Stack.Screen options={{ title: t("news2.exerciseTitle", { key: exercise.key }) }} />
              <H1>{t("news2.exerciseTitle", { key: exercise.key })}</H1>
              <Card><P>{exercise.vignette}</P><P small muted>{exercise.scale === "2" ? t("news2.scale2") : t("news2.scale1")}</P></Card>
              <H2>{t("news2.question")}</H2>
              {exercise.options.map((option, i) => {
                const isMine = checked && choice === i, isCorrectOption = checked && i === exercise.answer;
                return <Button key={i} variant={choice === i ? "primary" : "outline"} disabled={checked} label={`${option}${isCorrectOption ? ` ✓ ${t("quiz.correct")}` : isMine ? " ✗" : ""}`} onPress={() => setChoice(i)} />;
              })}
              {checked ? (
                <>
                  <Callout tone={choice === exercise.answer ? "success" : "danger"}>{choice === exercise.answer ? t("quiz.correct") : t("quiz.incorrect")}</Callout>
                  <Card><P>{exercise.explanation}</P></Card>
                </>
              ) : (
                <>
                  <P small muted>{t("study.checkPrompt")}</P>
                  <Button label={t("quiz.check")} disabled={choice === null} onPress={submit} />
                </>
              )}
            </>
          );
        }}
      </RemoteGate>
    </Screen>
  );
}
