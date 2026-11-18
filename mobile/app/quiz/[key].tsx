import { useState } from "react";
import { Stack, useLocalSearchParams } from "expo-router";
import { answer, isCorrect, practiceResult, startPractice, type Practice, type Question } from "../../src/core/engines";
import { discardSession, getSession, recordPractice, saveSession } from "../../src/core/progress";
import { useApp } from "../../src/state/app";
import { Button, Callout, Card, H1, H2, P, RemoteGate, Screen } from "../../src/ui/components";
import { useCatalogEntry } from "../../src/hooks/useRemoteContent";

const COUNT = 5;
const sessionKey = (moduleKey: string) => `QUIZ:${moduleKey}`;

export default function QuizRunner() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const { t, update, progress } = useApp();
  const entry = useCatalogEntry(key);
  const [p, setP] = useState<Practice | null>(null);
  const [n, setN] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  return (
    <Screen>
      <RemoteGate state={entry} onRetry={entry.refresh}>
        {(data) => {
          const bank: Question[] = (data.questions ?? []).map((q) => ({ code: q.id, stem: q.prompt, options: q.options, correct: q.answer, explanations: q.options.map(() => ""), rationale: q.explanation }));
          if (!bank.length) return <P>{t("common.notFound")}</P>;

          if (!p) {
            const existing = getSession(progress, sessionKey(key!));
            return (
              <>
                <Stack.Screen options={{ title: data.title }} />
                <H1>{data.title}</H1>
                <P muted>{t("hub.questionsBody")}</P>
                {existing && !existing.finished ? (
                  <Card>
                    <P>{t("cases.resume")}</P>
                    <Button label={t("hub.continue")} onPress={() => { setP(startPractice(bank, COUNT, existing.position)); setN(0); setPicked(null); setDone(false); }} />
                  </Card>
                ) : null}
                <Button label={t("quiz.start")} onPress={() => { setP(startPractice(bank, COUNT, Date.now() % 100000)); setN(0); setPicked(null); setDone(false); }} />
              </>
            );
          }
          if (done) {
            const r = practiceResult(bank, p);
            return (
              <>
                <H1>{data.title}</H1>
                <Card><P>{t("quiz.result", r)}</P></Card>
                <Button label={t("quiz.restart")} onPress={() => { update((pr) => discardSession(pr, sessionKey(key!))); setP(null); }} />
              </>
            );
          }

          const item = p.items[n]!; const q = bank.find((x) => x.code === item.code)!;
          const checked = p.answers[n] !== null;
          const check = () => { if (picked !== null) setP(answer(p, n, picked)); };
          const advance = () => {
            if (n + 1 >= p.items.length) {
              const r = practiceResult(bank, p);
              update((pr) => recordPractice(discardSession(pr, sessionKey(key!)), r.right, r.total, new Date().toISOString()));
              setDone(true);
            } else {
              update((pr) => saveSession(pr, sessionKey(key!), { kind: "quiz", version: "v1", position: p.seed, score: 0, finished: false, at: new Date().toISOString() }));
              setN(n + 1); setPicked(null);
            }
          };
          return (
            <>
              <P small muted>{t("quiz.question", { n: n + 1, total: p.items.length })}</P>
              <H2>{q.stem}</H2>
              {item.order.map((optIndex, shown) => {
                const sel = (checked ? p.answers[n] : picked) === shown;
                const ok = checked && optIndex === q.correct;
                return <Button key={shown} variant={sel ? "primary" : "outline"} disabled={checked} label={`${String.fromCharCode(65 + shown)}. ${q.options[optIndex]}${checked && ok ? ` ✓ ${t("quiz.correct")}` : ""}`} onPress={() => setPicked(shown)} />;
              })}
              {checked ? (
                <>
                  <Callout tone={isCorrect(q, p, n) ? "success" : "danger"}>{isCorrect(q, p, n) ? t("quiz.correct") : t("quiz.incorrect")}</Callout>
                  <Card><P>{q.rationale}</P></Card>
                  <Button label={n + 1 >= p.items.length ? t("quiz.finish") : t("common.next")} onPress={advance} />
                </>
              ) : <Button label={t("quiz.check")} disabled={picked === null} onPress={check} />}
            </>
          );
        }}
      </RemoteGate>
    </Screen>
  );
}
