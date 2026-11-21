import { useState } from "react";
import { Stack, useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { useCatalogEntry } from "../../src/hooks/useRemoteContent";
import { useProgressSync } from "../../src/hooks/useProgressSync";
import { Button, Callout, Card, H1, H2, P, RemoteGate, Screen } from "../../src/ui/components";
import { space } from "../../src/ui/theme";

function StepOrderActivity({ code, title, steps }: { code: string; title: string; steps: string[] }) {
  const { recordAnswer } = useProgressSync();
  const [order, setOrder] = useState<number[]>(() => steps.map((_, i) => i).reverse());
  const [checked, setChecked] = useState(false);
  const move = (i: number, d: number) => {
    if (checked || i + d < 0 || i + d >= order.length) return;
    setOrder((old) => {
      const next = [...old];
      [next[i], next[i + d]] = [next[i + d]!, next[i]!];
      return next;
    });
  };
  const correctCount = order.filter((value, index) => value === index).length;
  const check = () => {
    if (checked) return;
    setChecked(true);
    recordAnswer(`ORDER-${code}`, code, 0, correctCount === steps.length, Date.now());
  };
  return (
    <View style={{ gap: space.md }}>
      <H1>{title}</H1>
      <H2>Put the clinical skill steps in order</H2>
      <P small muted>Use Move up and Move down. These are educational steps from the lesson's checklist, not a competency assessment.</P>
      {order.map((originalIndex, position) => (
        <Card key={originalIndex}>
          <P>{position + 1}. {steps[originalIndex]}</P>
          <View style={{ flexDirection: "row", gap: space.sm }}>
            <View style={{ flex: 1 }}><Button label="Move up ↑" variant="outline" disabled={checked || position === 0} onPress={() => move(position, -1)} /></View>
            <View style={{ flex: 1 }}><Button label="Move down ↓" variant="outline" disabled={checked || position === order.length - 1} onPress={() => move(position, 1)} /></View>
          </View>
          {checked ? <P small muted>Correct position: {originalIndex + 1}</P> : null}
        </Card>
      ))}
      {checked ? (
        <>
          <Callout tone={correctCount === steps.length ? "success" : "warn"}>{correctCount} / {steps.length} steps are in the correct position.</Callout>
          <Button label="Try again" variant="outline" onPress={() => { setOrder(steps.map((_, i) => i).reverse()); setChecked(false); }} />
        </>
      ) : <Button label="Check order" onPress={check} />}
    </View>
  );
}

export default function StepOrderScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const entry = useCatalogEntry(code);
  return (
    <Screen>
      <RemoteGate state={entry} onRetry={entry.refresh}>
        {(data) => (
          <>
            <Stack.Screen options={{ title: "Step-order practice" }} />
            {(data.checklist?.length ?? 0) >= 2
              ? <StepOrderActivity key={data.key} code={data.key} title={data.title} steps={data.checklist!} />
              : <P>No ordered skill checklist is available for this lesson.</P>}
          </>
        )}
      </RemoteGate>
    </Screen>
  );
}
