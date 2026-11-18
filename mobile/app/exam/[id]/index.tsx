import { useCallback, useEffect, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { formatClock, remainingSeconds, type ExamQuestion } from "../../../src/core/exam";
import { useExamQuestions } from "../../../src/hooks/useRemoteContent";
import { useAuth } from "../../../src/auth/provider";
import { useApp } from "../../../src/state/app";
import { Button, Callout, Card, P, RemoteGate, Screen } from "../../../src/ui/components";
import { radius, space, type } from "../../../src/ui/theme";
import type { ExamRow } from "@icu/schemas/working-exam";

type ExamLoad = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; exam: ExamRow };

export default function ExamRunner() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, palette } = useApp();
  const { rpc } = useAuth();
  const router = useRouter();
  const [load, setLoad] = useState<ExamLoad>({ status: "loading" });
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [index, setIndex] = useState(0);
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const finishing = useRef(false);

  useEffect(() => {
    if (!rpc || !id) { setLoad({ status: "error", message: t("exam.startError") }); return; }
    let live = true;
    rpc.loadWorkingExam(id).then((row) => {
      if (!live) return;
      if (!row) { setLoad({ status: "error", message: t("common.notFound") }); return; }
      if (row.submitted_at) { router.replace(`/exam/${id}/results`); return; }
      setAnswers(row.answers);
      setLoad({ status: "ready", exam: row });
    }).catch(() => live && setLoad({ status: "error", message: t("exam.startError") }));
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, rpc]);

  const exam = load.status === "ready" ? load.exam : undefined;
  const questions = useExamQuestions(exam?.question_ids ?? []);

  const finish = useCallback(async () => {
    if (finishing.current || !exam || !rpc) return;
    finishing.current = true;
    setBusy(true);
    try { await rpc.submitWorkingExam(exam.id); router.replace(`/exam/${exam.id}/results`); }
    catch { finishing.current = false; setBusy(false); setError(t("exam.submitError")); }
  }, [exam, rpc, router, t]);

  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    if (!exam) return;
    const tick = () => {
      const left = remainingSeconds(exam.started_at, exam.time_limit_seconds, new Date().toISOString(), Date.now());
      setRemaining(left);
      if (left <= 0) void finish();
    };
    tick();
    const h = setInterval(tick, 1000);
    return () => clearInterval(h);
  }, [exam, finish]);

  if (load.status === "loading") return <Screen><P muted>{t("common.loading")}</P></Screen>;
  if (load.status === "error") return <Screen><Callout tone="danger">{load.message}</Callout></Screen>;

  return (
    <Screen banner={false}>
      <RemoteGate state={questions} onRetry={questions.refresh}>
        {(list) => {
          const q: ExamQuestion | undefined = list[index];
          if (!q) return <P>{t("common.notFound")}</P>;
          const answeredCount = Object.keys(answers).length;
          const unansweredCount = list.length - answeredCount;

          async function choose(choice: number) {
            setAnswers((a) => ({ ...a, [q!.id]: choice }));
            setError(null);
            try { await rpc!.answerWorkingExam(exam!.id, q!.id, choice); } catch { setError(t("exam.saveError")); }
          }
          const toggleFlag = () => setFlagged((f) => { const n = new Set(f); if (n.has(q.id)) n.delete(q.id); else n.add(q.id); return n; });
          const goTo = (i: number) => setIndex(Math.min(Math.max(i, 0), list.length - 1));

          return (
            <>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: space.sm, backgroundColor: palette.surface, borderColor: palette.primary, borderWidth: 2, borderRadius: radius, padding: space.md }}>
                <Text style={[type.small, { color: palette.primary, fontWeight: "700" }]}>{t("exam.question", { n: index + 1, total: list.length })}</Text>
                <Text style={[type.small, { color: palette.muted }]}>{t("exam.answered", { n: answeredCount, total: list.length })}</Text>
                <Text accessibilityRole="timer" style={[type.h3, { color: palette.text }]}>{formatClock(remaining)}</Text>
              </View>

              <Card>
                <View style={{ flexDirection: "row", justifyContent: "space-between", gap: space.sm }}>
                  <P>{q.prompt}</P>
                  <Pressable accessibilityRole="button" accessibilityState={{ selected: flagged.has(q.id) }} onPress={toggleFlag} style={{ borderWidth: 1, borderColor: flagged.has(q.id) ? palette.primary : palette.border, borderRadius: radius, paddingHorizontal: space.sm, justifyContent: "center" }}>
                    <Text style={[type.small, { color: flagged.has(q.id) ? palette.primary : palette.text }]}>{t("exam.flag")}</Text>
                  </Pressable>
                </View>
                {q.options.map((option, i) => (
                  <Button key={i} variant={answers[q.id] === i ? "primary" : "outline"} label={`${String.fromCharCode(65 + i)}. ${option}`} onPress={() => void choose(i)} />
                ))}
              </Card>
              {error ? <Callout tone="danger">{error}</Callout> : null}

              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {list.map((item, i) => (
                  <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={t("exam.question", { n: i + 1, total: list.length })} onPress={() => goTo(i)}
                    style={{ width: 36, height: 36, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: i === index ? palette.primary : item.id in answers ? palette.success : "transparent", borderWidth: i === index || item.id in answers ? 0 : 1, borderColor: palette.border }}>
                    <Text style={{ color: i === index ? palette.onPrimary : palette.text, fontWeight: "700" }}>{i + 1}</Text>
                  </Pressable>
                ))}
              </View>

              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: space.sm }}>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Button label={t("common.back")} variant="outline" disabled={index === 0} onPress={() => goTo(index - 1)} />
                  <Button label={t("common.next")} variant="outline" disabled={index === list.length - 1} onPress={() => goTo(index + 1)} />
                </View>
                <Button label={t("exam.submit")} disabled={busy} onPress={() => setConfirming(true)} />
              </View>

              {confirming ? (
                <Card>
                  <P>{t("exam.confirmTitle")}</P>
                  <P small>{unansweredCount > 0 ? t("exam.confirmUnanswered", { n: unansweredCount }) : t("exam.confirmAllAnswered")}</P>
                  <Button label={busy ? t("exam.submitting") : t("exam.submitNow")} disabled={busy} onPress={() => void finish()} />
                  <Button label={t("exam.keepGoing")} variant="outline" disabled={busy} onPress={() => setConfirming(false)} />
                </Card>
              ) : null}
            </>
          );
        }}
      </RemoteGate>
    </Screen>
  );
}
