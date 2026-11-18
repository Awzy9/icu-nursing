import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { COUNT_PRESETS, timeLimitSecondsFor } from "../../src/core/exam";
import { pickExamQuestions } from "../../src/core/remoteContent";
import { contentClientDeps, useExamTopics } from "../../src/hooks/useRemoteContent";
import { useAuth } from "../../src/auth/provider";
import { useApp } from "../../src/state/app";
import { Button, Callout, Card, Chip, H1, H2, P, RemoteGate, Screen } from "../../src/ui/components";

export default function ExamStart() {
  const { t } = useApp();
  const { rpc, email } = useAuth();
  const router = useRouter();
  const topics = useExamTopics();
  const [selected, setSelected] = useState<string[] | null>(null);
  const [count, setCount] = useState(20);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const signedIn = !!(rpc && email);

  return (
    <Screen>
      <H1>{t("exam.title")}</H1>
      <P muted>{t("exam.intro")}</P>
      {!signedIn ? <Callout tone="warn">{t("exam.signInRequired")}</Callout> : null}
      <RemoteGate state={topics} onRetry={topics.refresh}>
        {(data) => {
          const chosen = selected ?? data.map((topic) => topic.category);
          const available = data.filter((topic) => chosen.includes(topic.category)).reduce((n, topic) => n + topic.count, 0);
          const effectiveCount = Math.min(count, available);
          const minutes = Math.round(timeLimitSecondsFor(effectiveCount) / 60);
          const toggle = (category: string) => setSelected(chosen.includes(category) ? chosen.filter((c) => c !== category) : [...chosen, category]);

          async function start() {
            if (!signedIn || chosen.length === 0 || available === 0) return;
            setBusy(true); setError(null);
            const safeCount = (COUNT_PRESETS as readonly number[]).includes(count) ? count : 10;
            const picked = await pickExamQuestions(contentClientDeps(), chosen, safeCount);
            if (picked.status !== "ok") { setError(t("exam.startError")); setBusy(false); return; }
            try {
              const id = await rpc!.startWorkingExam(picked.data.questionIds, picked.data.timeLimitSeconds);
              router.push(`/exam/${id}`);
            } catch { setError(t("exam.startError")); setBusy(false); }
          }

          return (
            <>
              <Card>
                <H2>{t("exam.chooseTopics")}</H2>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {data.map((topic) => <Chip key={topic.category} label={`${topic.category} (${topic.count})`} selected={chosen.includes(topic.category)} onPress={() => toggle(topic.category)} />)}
                </View>
              </Card>
              <Card>
                <H2>{t("exam.numQuestions")}</H2>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {COUNT_PRESETS.map((n) => <Chip key={n} label={String(n)} selected={count === n} onPress={() => setCount(n)} />)}
                </View>
                <P small muted>{available === 0 ? t("exam.topicsNeeded") : effectiveCount < count ? t("exam.onlyAvailable", { available }) : ""}</P>
              </Card>
              <Card>
                <H2>{t("exam.rulesTitle")}</H2>
                <P small>{t("exam.ruleTime", { minutes })}</P>
                <P small>{t("exam.ruleNoReveal")}</P>
                <P small>{t("exam.ruleTimer")}</P>
                <P small muted>{t("exam.ruleEducational")}</P>
              </Card>
              {error ? <Callout tone="danger">{error}</Callout> : null}
              <Button label={busy ? t("exam.starting") : t("exam.start")} disabled={busy || !signedIn || chosen.length === 0 || available === 0} onPress={() => void start()} />
            </>
          );
        }}
      </RemoteGate>
    </Screen>
  );
}
