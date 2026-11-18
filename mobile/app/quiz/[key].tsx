import { useState } from "react";
import { Stack, useLocalSearchParams } from "expo-router";
import { getSession, recordPractice } from "../../src/core/progress";
import { useApp } from "../../src/state/app";
import { useProgressSync } from "../../src/hooks/useProgressSync";
import { Button, Callout, Card, H1, H2, P, RemoteGate, Screen } from "../../src/ui/components";
import { useCatalogEntry } from "../../src/hooks/useRemoteContent";

// Sequential, full-module quiz - every question in the module, in its given order, matching the
// website's own quiz exactly (src/components/working/quiz.tsx: no shuffling, position=index+1,
// score=running correct count). This is what makes cross-device resume meaningful: the session
// row's (position, score) means the same thing on both platforms.
export default function QuizRunner() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const { t, progress, update } = useApp();
  const { saveSession, discardSession, recordAnswer, setComplete } = useProgressSync();
  const entry = useCatalogEntry(key);
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  return (
    <Screen>
      <RemoteGate state={entry} onRetry={entry.refresh}>
        {(data) => {
          const questions = data.questions ?? [];
          if (!questions.length) return <P>{t("common.notFound")}</P>;
          const version = questions.map((q) => q.id).join(",");
          const existing = key ? getSession(progress, key) : undefined;
          const validExisting = existing && existing.version === version && !existing.finished ? existing : undefined;

          if (!started) {
            return (
              <>
                <Stack.Screen options={{ title: data.title }} />
                <H1>{data.title}</H1>
                <P muted>{t("hub.questionsBody")}</P>
                {validExisting ? (
                  <Card>
                    <P>{t("cases.resume")}</P>
                    <P small muted>{t("quiz.question", { n: validExisting.position + 1, total: questions.length })}</P>
                    <Button label={t("hub.continue")} onPress={() => { setStarted(true); setIndex(Math.min(validExisting.position, questions.length - 1)); setScore(validExisting.score); }} />
                    <Button label={t("cases.restart")} variant="outline" onPress={() => { discardSession(key!); setStarted(true); setIndex(0); setScore(0); }} />
                  </Card>
                ) : (
                  <Button label={t("quiz.start")} onPress={() => { setStarted(true); setIndex(0); setScore(0); }} />
                )}
              </>
            );
          }

          if (finished) {
            return (
              <>
                <H1>{data.title}</H1>
                <Card><P>{t("quiz.result", { right: score, total: questions.length })}</P></Card>
                <Button label={t("quiz.restart")} onPress={() => { setStarted(false); setFinished(false); setIndex(0); setChoice(null); setChecked(false); setScore(0); }} />
              </>
            );
          }

          const q = questions[index]!;
          const submit = () => {
            if (choice === null) return;
            setChecked(true);
            const correct = choice === q.answer;
            const nextScore = correct ? score + 1 : score;
            setScore(nextScore);
            recordAnswer(q.id, key!, choice, correct, Date.now());
            saveSession(key!, { kind: "quiz", version, position: index + 1, score: nextScore, finished: index + 1 === questions.length, at: new Date().toISOString() });
          };
          const next = () => {
            if (index + 1 === questions.length) {
              update((p) => recordPractice(p, score, questions.length, new Date().toISOString()));
              setComplete(key!, true); // lets a guided path (core/paths.ts) treat "finished this quiz" the same as any other step
              setFinished(true);
              return;
            }
            setIndex((i) => i + 1); setChoice(null); setChecked(false);
          };

          return (
            <>
              <P small muted>{t("quiz.question", { n: index + 1, total: questions.length })}</P>
              <H2>{q.prompt}</H2>
              {q.options.map((option, i) => {
                const isMine = checked && choice === i, isCorrectOption = checked && i === q.answer;
                return <Button key={i} variant={choice === i ? "primary" : "outline"} disabled={checked} label={`${String.fromCharCode(65 + i)}. ${option}${isCorrectOption ? ` ✓ ${t("quiz.correct")}` : isMine ? ` ✗` : ""}`} onPress={() => setChoice(i)} />;
              })}
              {checked ? (
                <>
                  <Callout tone={choice === q.answer ? "success" : "danger"}>{choice === q.answer ? t("quiz.correct") : t("quiz.incorrect")}</Callout>
                  <Card><P>{q.explanation}</P></Card>
                  <Button label={index + 1 >= questions.length ? t("quiz.finish") : t("common.next")} onPress={next} />
                </>
              ) : <Button label={t("quiz.check")} disabled={choice === null} onPress={submit} />}
            </>
          );
        }}
      </RemoteGate>
    </Screen>
  );
}
