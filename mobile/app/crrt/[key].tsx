import { useState } from "react";
import { Stack, useLocalSearchParams } from "expo-router";
import { ROUTE_FOR_TYPE } from "../../src/core/search";
import { useCatalogList, useCrrtData } from "../../src/hooks/useRemoteContent";
import { useProgressSync } from "../../src/hooks/useProgressSync";
import { useApp } from "../../src/state/app";
import { Button, Callout, Card, H1, H2, NavCard, P, RemoteGate, Screen } from "../../src/ui/components";

// Mirrors src/components/working/crrt-alarm-exercise.tsx. The related lesson is hardcoded to
// "EQ-06" for every alarm exercise, same as the website. moduleKey "CRRT" is not a real catalog entry.
const CRRT_LESSON_KEY = "EQ-06";

export default function CrrtAlarmScreen() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const { t, rtl: ar } = useApp();
  const { recordAnswer } = useProgressSync();
  const crrt = useCrrtData();
  const catalog = useCatalogList();
  const [choice, setChoice] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);

  return (
    <Screen>
      <RemoteGate state={crrt} onRetry={crrt.refresh}>
        {(data) => {
          const exercise = data.alarms.find((a) => a.key === key);
          if (!exercise) return <P>{t("common.notFound")}</P>;
          const q = exercise.question;
          const typeByKey = catalog.status === "ready" ? new Map(catalog.data.map((c) => [c.key, c.type])) : new Map<string, string>();
          const lessonRoute = ROUTE_FOR_TYPE[typeByKey.get(CRRT_LESSON_KEY) ?? ""];

          function submit() {
            if (choice === null) return;
            setChecked(true);
            recordAnswer(exercise!.key, "CRRT", choice, choice === q.answer, Date.now());
          }

          return (
            <>
              <Stack.Screen options={{ title: exercise.title[ar ? 1 : 0] }} />
              <H1>{exercise.title[ar ? 1 : 0]}</H1>
              <Card><P>{exercise.vignette}</P></Card>

              <H2>{q.prompt}</H2>
              {q.options.map((option, i) => {
                const isMine = checked && choice === i, isCorrectOption = checked && i === q.answer;
                return <Button key={i} variant={choice === i ? "primary" : "outline"} disabled={checked} label={`${option}${isCorrectOption ? ` ✓ ${t("quiz.correct")}` : isMine ? " ✗" : ""}`} onPress={() => setChoice(i)} />;
              })}
              {checked ? (
                <>
                  <Callout tone={choice === q.answer ? "success" : "danger"}>{choice === q.answer ? t("quiz.correct") : t("quiz.incorrect")}</Callout>
                  <Card><P>{q.explanation}</P></Card>
                  {lessonRoute ? <NavCard href={`${lessonRoute}${CRRT_LESSON_KEY}`} title={t("crrt.readLesson")} /> : null}
                </>
              ) : (
                <>
                  <P small muted>{t("study.checkPrompt")}</P>
                  <Button label={t("quiz.check")} disabled={choice === null} onPress={submit} />
                </>
              )}

              <H2>{t("crrt.sourcesTitle")}</H2>
              <P small muted>{t("crrt.sourcesNote")}</P>
            </>
          );
        }}
      </RemoteGate>
    </Screen>
  );
}
