import { useState } from "react";
import { Stack, useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import type { WorkingEntryShared } from "../../src/core/remoteContent";
import { useCatalogEntry } from "../../src/hooks/useRemoteContent";
import { useProgressSync } from "../../src/hooks/useProgressSync";
import { useApp } from "../../src/state/app";
import { Button, Callout, Card, Chip, H1, H2, P, RemoteGate, Screen } from "../../src/ui/components";
import { space } from "../../src/ui/theme";
import { evaluatePractice } from "../../src/core/practice-evaluation";

type Exercise = NonNullable<WorkingEntryShared["practice"]>;
const statusChoices = ["not_started", "learning", "with_support", "independent"] as const;

function PracticeActivity({ moduleKey, exercise }: { moduleKey: string; exercise: Exercise }) {
  const { locale } = useApp();
  const { setComplete } = useProgressSync();
  const ar = locale === "ar";
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flags, setFlags] = useState<string[]>([]);
  const [choice, setChoice] = useState("");
  const [checked, setChecked] = useState(false);
  const initialOrder = () => [...(exercise.steps ?? [])].reverse().map((step) => step.id);
  const [order, setOrder] = useState<string[]>(initialOrder);
  const evaluation = evaluatePractice(exercise, { answers, flags, choice, order });
  const ready = evaluation.ready;

  const reset = () => {
    setAnswers({});
    setFlags([]);
    setChoice("");
    setOrder(initialOrder());
    setChecked(false);
  };
  const move = (i: number, delta: number) => {
    if (checked || i + delta < 0 || i + delta >= order.length) return;
    setOrder((old) => {
      const next = [...old];
      [next[i], next[i + delta]] = [next[i + delta]!, next[i]!];
      return next;
    });
  };
  const submit = () => {
    if (!ready) return;
    setChecked(true);
    if (evaluation.passed) setComplete(moduleKey, true);
  };
  const correctSequence = evaluation.passed;

  return (
    <View style={{ gap: space.lg }}>
      <Callout tone="info">{exercise.setup}</Callout>
      {exercise.prompt ? <H2>{exercise.prompt}</H2> : null}

      {exercise.kind === "choice" ? exercise.options?.map((option) => (
        <View key={option.id} style={{ gap: space.sm }}>
          <Button label={option.text} variant={choice === option.id ? "primary" : "outline"} disabled={checked} onPress={() => setChoice(option.id)} />
          {checked ? <Card><P small>{option.correct ? "Correct choice: " : "Why not: "}{option.feedback}</P></Card> : null}
        </View>
      )) : null}

      {exercise.kind === "classify" ? exercise.items?.map((item) => (
        <Card key={item.id}>
          <P>{item.text}</P>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
            {exercise.categories?.map((category) => (
              <Chip key={category.id} label={category.label} selected={answers[item.id] === category.id} onPress={() => { if (!checked) setAnswers((old) => ({ ...old, [item.id]: category.id })); }} />
            ))}
          </View>
          {checked ? <Callout tone={answers[item.id] === item.category ? "success" : "warn"}>{item.why ?? ""}</Callout> : null}
        </Card>
      )) : null}

      {exercise.kind === "spot" ? exercise.lines?.map((line) => {
        const selected = flags.includes(line.id);
        return (
          <Card key={line.id}>
            <P>{line.text}</P>
            <Button label={selected ? "✓ Flagged as a concern" : "Flag this as a concern"} variant={selected ? "primary" : "outline"} disabled={checked}
              onPress={() => setFlags((old) => selected ? old.filter((id) => id !== line.id) : [...old, line.id])} />
            {checked ? <Callout tone={selected === line.problem ? "success" : "warn"}>{line.problem ? "This needs attention. " : "This is sound. "}{line.why}</Callout> : null}
          </Card>
        );
      }) : null}

      {exercise.kind === "sequence" ? (
        <>
          <P small muted>Use the arrows to put the steps in the correct order.</P>
          {order.map((id, i) => {
            const step = exercise.steps?.find((item) => item.id === id);
            if (!step) return null;
            return (
              <Card key={id}>
                <P>{i + 1}. {step.text}</P>
                <View style={{ flexDirection: "row", gap: space.md }}>
                  <View style={{ flex: 1 }}><Button label="↑ Move up" variant="outline" disabled={checked || i === 0} onPress={() => move(i, -1)} /></View>
                  <View style={{ flex: 1 }}><Button label="↓ Move down" variant="outline" disabled={checked || i === order.length - 1} onPress={() => move(i, 1)} /></View>
                </View>
                {checked ? <P small muted>{`Correct position: ${exercise.steps!.findIndex((item) => item.id === id) + 1}. ${step.why}`}</P> : null}
              </Card>
            );
          })}
          {checked ? <Callout tone={correctSequence ? "success" : "warn"}>{correctSequence ? "All steps are in the correct order." : "Compare your order with the correct positions shown above."}</Callout> : null}
        </>
      ) : null}

      {exercise.kind === "checklist" ? (
        <>
          <P muted small>{ar ? "تقييم ذاتي للتعلم وليس شهادة كفاءة سريرية." : "Self-assessment for learning, not a certificate of clinical competence."}</P>
          {exercise.items?.map((item) => (
            <Card key={item.id}>
              <P>{item.text}</P>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
                {statusChoices.map((status) => (
                  <Chip key={status} label={status.replaceAll("_", " ")} selected={answers[item.id] === status} onPress={() => { if (!checked) setAnswers((old) => ({ ...old, [item.id]: status })); }} />
                ))}
              </View>
            </Card>
          ))}
        </>
      ) : null}

      {checked ? (
        <Callout tone={evaluation.passed ? "success" : "warn"}>{evaluation.selfAssessment
          ? (ar ? "تم حفظ التقييم الذاتي للتعلّم فقط؛ ليس إثباتاً للكفاءة السريرية." : "Self-assessment recorded for learning only; this is not clinical competency certification.")
          : evaluation.passed
            ? (ar ? "إجاباتك صحيحة؛ اكتمل التدريب." : "All responses correct — practice completed.")
            : (ar ? `${evaluation.correct} من ${evaluation.total} صحيحة. راجع الشرح ثم أعد المحاولة لإكمال التدريب.` : `${evaluation.correct} of ${evaluation.total} correct. Review the feedback and try again to complete this activity.`)
        }</Callout>
        <Button label={ar ? "إعادة المحاولة" : "Try again"} variant="outline" onPress={reset} />
      ) : (
        <Button label={exercise.kind === "checklist" ? (ar ? "حفظ التقييم الذاتي" : "Save self-assessment") : (ar ? "تحقق من عملي" : "Check my work")} disabled={!ready} onPress={submit} />
      )}
    </View>
  );
}

export default function PracticeActivityScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { locale, t } = useApp();
  const entry = useCatalogEntry(code);
  return (
    <Screen>
      <RemoteGate state={entry} onRetry={entry.refresh}>
        {(data) => (
          <>
            <Stack.Screen options={{ title: data.title }} />
            <H1>{data.title}</H1>
            {data.practice ? <PracticeActivity key={data.key} moduleKey={data.key} exercise={data.practice} /> : <Callout tone="warn">{t("common.notFound")}</Callout>}
          </>
        )}
      </RemoteGate>
    </Screen>
  );
}
