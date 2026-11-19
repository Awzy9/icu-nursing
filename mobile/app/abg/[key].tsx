import { useState } from "react";
import { Stack, useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { ROUTE_FOR_TYPE } from "../../src/core/search";
import { useAbgCases, useCatalogList } from "../../src/hooks/useRemoteContent";
import { useProgressSync } from "../../src/hooks/useProgressSync";
import { useApp } from "../../src/state/app";
import { Button, Callout, Card, H1, H2, NavCard, P, RemoteGate, Screen } from "../../src/ui/components";

// Mirrors src/components/working/abg-exercise.tsx: a static gas panel plus a multiple-choice
// interpretation question. moduleKey "ABG" is not a real catalog entry (same convention as ECG/GCS).
export default function AbgCaseScreen() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const { t, rtl: ar } = useApp();
  const { recordAnswer } = useProgressSync();
  const cases = useAbgCases();
  const catalog = useCatalogList();
  const [choice, setChoice] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);

  return (
    <Screen>
      <RemoteGate state={cases} onRetry={cases.refresh}>
        {(data) => {
          const item = data.find((c) => c.key === key);
          if (!item) return <P>{t("common.notFound")}</P>;
          const q = item.question;
          const lessonKey = item.lessonHref.split("/").pop() ?? "";
          const typeByKey = catalog.status === "ready" ? new Map(catalog.data.map((c) => [c.key, c.type])) : new Map<string, string>();
          const lessonRoute = ROUTE_FOR_TYPE[typeByKey.get(lessonKey) ?? ""];

          function submit() {
            if (choice === null) return;
            setChecked(true);
            recordAnswer(item!.key, "ABG", choice, choice === q.answer, Date.now());
          }

          const panel: Array<[string, number | undefined]> = [
            ["pH", item.gases.pH], ["PaCO2", item.gases.paco2], ["HCO3", item.gases.hco3],
            ["PaO2", item.gases.pao2], ["FiO2", item.gases.fio2],
          ];

          return (
            <>
              <Stack.Screen options={{ title: item.title[ar ? 1 : 0] }} />
              <H1>{item.title[ar ? 1 : 0]}</H1>
              <P muted>{item.vignette}</P>

              <H2>{t("abg.panelTitle")}</H2>
              <Card>
                <View style={{ gap: 4 }}>
                  {panel.filter(([, v]) => v !== undefined).map(([label, value]) => (
                    <P key={label}>{`${label}: ${value}`}</P>
                  ))}
                </View>
              </Card>
              {item.oxygenationNote ? <Callout tone="info">{item.oxygenationNote}</Callout> : null}

              <H2>{q.prompt}</H2>
              {q.options.map((option, i) => {
                const isMine = checked && choice === i, isCorrectOption = checked && i === q.answer;
                return <Button key={i} variant={choice === i ? "primary" : "outline"} disabled={checked} label={`${option}${isCorrectOption ? ` ✓ ${t("quiz.correct")}` : isMine ? " ✗" : ""}`} onPress={() => setChoice(i)} />;
              })}
              {checked ? (
                <>
                  <Callout tone={choice === q.answer ? "success" : "danger"}>{choice === q.answer ? t("quiz.correct") : t("quiz.incorrect")}</Callout>
                  <Card><P>{q.explanation}</P></Card>
                  {lessonRoute ? <NavCard href={`${lessonRoute}${lessonKey}`} title={t("abg.readLesson")} /> : null}
                </>
              ) : (
                <>
                  <P small muted>{t("study.checkPrompt")}</P>
                  <Button label={t("quiz.check")} disabled={choice === null} onPress={submit} />
                </>
              )}

              <H2>{t("abg.sourcesTitle") ?? ""}</H2>
              <P small muted>{t("abg.sourcesNote")}</P>
              {item.evidenceSources.length ? <View style={{ gap: 2 }}>{item.evidenceSources.map((s, i) => <P key={i} small muted>{`• ${s}`}</P>)}</View> : null}
            </>
          );
        }}
      </RemoteGate>
    </Screen>
  );
}
