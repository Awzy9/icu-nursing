import { useState } from "react";
import { Stack, useLocalSearchParams } from "expo-router";
import { useInfusionCases } from "../../src/hooks/useRemoteContent";
import { useProgressSync } from "../../src/hooks/useProgressSync";
import { useApp } from "../../src/state/app";
import { Button, Callout, Card, H1, H2, NavCard, P, RemoteGate, Screen } from "../../src/ui/components";

// Mirrors src/components/working/infusion-exercise.tsx. drugRef is already a real medication
// catalog key, so the "read about this medication" link routes directly to /medications/${drugRef}
// with no catalog-type lookup needed. moduleKey "INFUSION" is not a real catalog entry.
export default function InfusionCaseScreen() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const { t } = useApp();
  const { recordAnswer } = useProgressSync();
  const cases = useInfusionCases();
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
            recordAnswer(exercise!.key, "INFUSION", choice, choice === exercise!.answerIndex, Date.now());
          }

          return (
            <>
              <Stack.Screen options={{ title: t("infusion.question") }} />
              <H1>{t("infusion.question")}</H1>
              <Card><P>{exercise.vignette}</P></Card>

              {exercise.options.map((option, i) => {
                const isMine = checked && choice === i, isCorrectOption = checked && i === exercise.answerIndex;
                const label = t("infusion.optionLabel", { rate: option });
                return <Button key={i} variant={choice === i ? "primary" : "outline"} disabled={checked} label={`${label}${isCorrectOption ? ` ✓ ${t("quiz.correct")}` : isMine ? " ✗" : ""}`} onPress={() => setChoice(i)} />;
              })}
              {checked ? (
                <>
                  <Callout tone={choice === exercise.answerIndex ? "success" : "danger"}>{choice === exercise.answerIndex ? t("quiz.correct") : t("quiz.incorrect")}</Callout>
                  <Card><P>{exercise.explanation}</P></Card>
                  <NavCard href={`/medications/${exercise.drugRef}`} title={t("infusion.readLesson")} />
                </>
              ) : (
                <>
                  <P small muted>{t("study.checkPrompt")}</P>
                  <Button label={t("quiz.check")} disabled={choice === null} onPress={submit} />
                </>
              )}

              <H2>{t("infusion.safetyTitle")}</H2>
              <Callout tone="info">{t("infusion.safetyNote")}</Callout>
            </>
          );
        }}
      </RemoteGate>
    </Screen>
  );
}
