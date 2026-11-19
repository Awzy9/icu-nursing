import { useState } from "react";
import { Link } from "expo-router";
import { View } from "react-native";
import { computeRevisionQueue, type RevisionStatus } from "../src/core/revision";
import { ROUTE_FOR_TYPE } from "../src/core/search";
import { useProgressSync } from "../src/hooks/useProgressSync";
import { useCatalogList, useRevisionQuestions } from "../src/hooks/useRemoteContent";
import { useApp } from "../src/state/app";
import { Button, Callout, Card, H1, H2, P, RemoteGate, Screen } from "../src/ui/components";

const SESSION_SIZE = 20;

export default function Study() {
  const { t, locale, progress } = useApp();
  const questions = useRevisionQuestions();
  const catalog = useCatalogList();
  const typeByKey = catalog.status === "ready" ? new Map(catalog.data.map((e) => [e.key, e.type])) : new Map<string, string>();
  const [session, setSession] = useState<RevisionStatus[] | null>(null);

  if (session) return <RevisionSession items={session} typeByKey={typeByKey} onFinish={() => setSession(null)} />;

  return (
    <Screen>
      <H1>{t("study.title")}</H1>
      <P muted>{t("study.intro")}</P>
      <RemoteGate state={questions} onRetry={questions.refresh}>
        {(data) => {
          const queue = computeRevisionQueue(data, progress.attempts);
          const correctCount = Object.values(progress.attempts).filter((a) => a.correct).length;
          const moduleCount = new Set(queue.due.map((s) => s.question.moduleKey)).size;
          const sessionSize = Math.min(SESSION_SIZE, queue.due.length);

          return (
            <>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {([[t("study.answered"), queue.totalAttempted], [t("study.correct"), correctCount], [t("study.dueNow"), queue.due.length]] as const).map(([label, n]) => (
                  <Card key={label} style={{ flex: 1 }}><P small muted>{label}</P><P>{String(n)}</P></Card>
                ))}
              </View>

              {queue.due.length ? (
                <Card>
                  <H2>{t("study.dueCardTitle", { n: queue.due.length, modules: moduleCount })}</H2>
                  <P small muted>{sessionSize < queue.due.length ? t("study.dueCardCapped", { size: sessionSize }) : t("study.dueCardAll")}</P>
                  <Button label={t("study.startSession")} onPress={() => setSession(queue.due.slice(0, sessionSize))} />
                </Card>
              ) : (
                <Card>
                  <H2>{queue.totalAttempted ? t("study.upToDate") : t("study.startShort")}</H2>
                  <P muted>
                    {queue.totalAttempted
                      ? queue.nextDueAt
                        ? t("study.nextDue", { when: new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(queue.nextDueAt)) })
                        : t("study.allAnswered")
                      : t("study.noneAttempted")}
                  </P>
                  {queue.totalAttempted ? null : <Link href="/quiz" asChild><Button label={t("study.startPractising")} onPress={() => undefined} /></Link>}
                </Card>
              )}
            </>
          );
        }}
      </RemoteGate>
    </Screen>
  );
}

function RevisionSession({ items, typeByKey, onFinish }: { items: RevisionStatus[]; typeByKey: Map<string, string>; onFinish: () => void }) {
  const { t } = useApp();
  const { recordAnswer } = useProgressSync();
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  if (finished) {
    return (
      <Screen banner={false}>
        <P small muted>{t("study.sessionComplete")}</P>
        <H1>{`${score} / ${items.length}`}</H1>
        <P muted>{t("study.sessionNote")}</P>
        <Button label={t("study.backToStudy")} onPress={onFinish} />
      </Screen>
    );
  }

  const current = items[index]!;
  const q = current.question;
  const lessonRoute = ROUTE_FOR_TYPE[typeByKey.get(q.moduleKey) ?? ""];
  const submit = () => {
    if (choice === null) return;
    setChecked(true);
    const correct = choice === q.answer;
    if (correct) setScore((s) => s + 1);
    recordAnswer(q.id, q.moduleKey, choice, correct, Date.now());
  };
  const next = () => {
    if (index + 1 === items.length) { setFinished(true); return; }
    setIndex((i) => i + 1); setChoice(null); setChecked(false);
  };

  return (
    <Screen banner={false}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <P small>{t("quiz.question", { n: index + 1, total: items.length })}</P>
        {lessonRoute ? <Link href={`${lessonRoute}${q.moduleKey}`}>{`${t("study.relatedLesson")} ${q.moduleTitle}`}</Link> : <P small muted>{q.moduleTitle}</P>}
      </View>
      <H2>{q.prompt}</H2>
      {q.options.map((option, i) => {
        const isMine = checked && choice === i, isCorrectOption = checked && i === q.answer;
        return <Button key={i} variant={choice === i ? "primary" : "outline"} disabled={checked} label={`${String.fromCharCode(65 + i)}. ${option}${isCorrectOption ? ` ✓ ${t("quiz.correct")}` : isMine ? " ✗" : ""}`} onPress={() => setChoice(i)} />;
      })}
      {checked ? (
        <>
          <Callout tone={choice === q.answer ? "success" : "danger"}>{t("study.correctChoice", { letter: String.fromCharCode(65 + q.answer) })}</Callout>
          <Card><P>{q.explanation}</P></Card>
          <Button label={index + 1 >= items.length ? t("quiz.finish") : t("common.next")} onPress={next} />
        </>
      ) : (
        <>
          <P small muted>{t("study.checkPrompt")}</P>
          <Button label={t("quiz.check")} disabled={choice === null} onPress={submit} />
        </>
      )}
      <Button label={t("study.endSession")} variant="outline" onPress={onFinish} />
    </Screen>
  );
}
