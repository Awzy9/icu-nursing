import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { View } from "react-native";
import { computeExamResult, tenthsToPercentString } from "../../../src/core/exam";
import { ROUTE_FOR_TYPE } from "../../../src/core/search";
import { useCatalogList, useExamQuestions } from "../../../src/hooks/useRemoteContent";
import { useAuth } from "../../../src/auth/provider";
import { useApp } from "../../../src/state/app";
import { Button, Callout, Card, H1, H2, NavCard, P, RemoteGate, Screen } from "../../../src/ui/components";
import type { ExamRow } from "@icu/schemas/working-exam";

type ExamLoad = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; exam: ExamRow };

export default function ExamResults() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useApp();
  const { rpc } = useAuth();
  const router = useRouter();
  const [load, setLoad] = useState<ExamLoad>({ status: "loading" });
  const catalog = useCatalogList();

  useEffect(() => {
    if (!rpc || !id) { setLoad({ status: "error", message: t("exam.startError") }); return; }
    let live = true;
    rpc.loadWorkingExam(id).then((row) => {
      if (!live) return;
      if (!row) { setLoad({ status: "error", message: t("common.notFound") }); return; }
      if (!row.submitted_at) { router.replace(`/exam/${id}`); return; }
      setLoad({ status: "ready", exam: row });
    }).catch(() => live && setLoad({ status: "error", message: t("exam.startError") }));
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, rpc]);

  const exam = load.status === "ready" ? load.exam : undefined;
  const questions = useExamQuestions(exam?.question_ids ?? []);
  const typeByKey = catalog.status === "ready" ? new Map(catalog.data.map((e) => [e.key, e.type])) : new Map<string, string>();

  if (load.status === "loading") return <Screen><P muted>{t("common.loading")}</P></Screen>;
  if (load.status === "error") return <Screen><Callout tone="danger">{load.message}</Callout></Screen>;

  return (
    <Screen>
      <RemoteGate state={questions} onRetry={questions.refresh}>
        {(list) => {
          const result = computeExamResult(list, exam!.answers);
          const percent = tenthsToPercentString(result.scoreTenths);
          return (
            <>
              <H1>{t("exam.complete")}</H1>
              <P>{`${result.correct} / ${result.total}  ·  ${percent}%`}</P>
              {result.unanswered > 0 ? <P small muted>{t("exam.unansweredNote", { n: result.unanswered })}</P> : null}

              <H2>{t("exam.resultsByTopic")}</H2>
              <View style={{ gap: 8 }}>
                {result.topics.map((topic) => (
                  <Card key={topic.category}>
                    <P>{topic.category}</P>
                    <P small muted>{t("exam.correctOfTotal", { correct: topic.correct, total: topic.total })}</P>
                  </Card>
                ))}
              </View>

              {result.gaps.length ? (
                <>
                  <H2>{t("exam.gapsTitle")}</H2>
                  <P small muted>{t("exam.gapsBody")}</P>
                  {result.gaps.map((g) => {
                    const type = typeByKey.get(g.moduleKey);
                    const route = type ? ROUTE_FOR_TYPE[type] : undefined;
                    return (
                      <Card key={g.id}>
                        <P>{g.prompt}</P>
                        <P small>{t("exam.correctAnswer")}: {g.options[g.answer]}</P>
                        {route ? <NavCard href={`${route}${g.moduleKey}`} title={t("exam.readLesson")} body={g.moduleTitle} /> : null}
                      </Card>
                    );
                  })}
                </>
              ) : null}

              <P small muted>{t("exam.disclaimer")}</P>
              <Button label={t("exam.again")} onPress={() => router.replace("/exam")} />
            </>
          );
        }}
      </RemoteGate>
    </Screen>
  );
}
