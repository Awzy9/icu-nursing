import { useState } from "react";
import { Stack } from "expo-router";
import { View } from "react-native";
import { useWaveformExercises } from "../src/hooks/useRemoteContent";
import { comparableWaveforms, type WaveformUnit } from "../src/core/waveform-compare";
import { useProgressSync } from "../src/hooks/useProgressSync";
import { useApp } from "../src/state/app";
import { Button, Callout, Card, Chip, H1, H2, NavCard, P, RemoteGate, Screen } from "../src/ui/components";
import { WaveformChart } from "../src/ui/waveform-chart";
import { space } from "../src/ui/theme";

export default function AdvancedWaveformCompare() {
  const { rtl: ar } = useApp();
  const data = useWaveformExercises();
  const { recordAnswer } = useProgressSync();
  const [caseKey, setCaseKey] = useState<"WV-02" | "WV-03">("WV-02");
  const [unit, setUnit] = useState<WaveformUnit>("L/min");
  const [choice, setChoice] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [showAccessibleDescription, setShowAccessibleDescription] = useState(false);
  const choose = (key: "WV-02" | "WV-03") => {
    setCaseKey(key); setChoice(null); setChecked(false); setShowAccessibleDescription(false);
  };
  return (
    <Screen>
      <Stack.Screen options={{ title: ar ? "مقارنة الموجات" : "Advanced waveform comparison" }} />
      <H1>{ar ? "قارن موجات جهاز التنفس" : "Compare ventilator waveforms"}</H1>
      <P muted>{ar ? "تدريب على ملاحظة الأنماط باستخدام منحنيات تعليمية من الموقع." : "Compare the website's authored simulated traces before checking an interpretation. No new patient data are used."}</P>
      <RemoteGate state={data} onRetry={data.refresh}>
        {(exercises) => {
          const normal = exercises.find((item) => item.key === "WV-01");
          const abnormal = exercises.find((item) => item.key === caseKey);
          if (!normal || !abnormal) return <Callout tone="warn">Teaching waveform dataset unavailable.</Callout>;
          const pair = comparableWaveforms(normal, abnormal, unit);
          return (
            <>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
                <Chip label={ar ? "الحالة أ" : "Pattern A"} selected={caseKey === "WV-02"} onPress={() => choose("WV-02")} />
                <Chip label={ar ? "الحالة ب" : "Pattern B"} selected={caseKey === "WV-03"} onPress={() => choose("WV-03")} />
              </View>
              <H2>{ar ? "قارن المقياسين" : "Choose a trace"}</H2>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
                <Chip label={ar ? "التدفق" : "Flow (L/min)"} selected={unit === "L/min"} onPress={() => setUnit("L/min")} />
                <Chip label={ar ? "الضغط" : "Pressure (cmH₂O)"} selected={unit === "cmH2O"} onPress={() => setUnit("cmH2O")} />
                <Chip label={ar ? "الحجم" : "Volume (mL)"} selected={unit === "mL"} onPress={() => setUnit("mL")} />
              </View>
              {pair ? (
                <Card>
                  <P small muted>{ar ? "المحور الزمني والرأسي متماثلان في كلا الرسمين." : "Both drawings use identical time and amplitude scales."}</P>
                  <WaveformChart trace={pair.reference} timeAxisEnd={pair.timeAxisEnd} />
                  <WaveformChart trace={pair.comparison} timeAxisEnd={pair.timeAxisEnd} />
                </Card>
              ) : <Callout tone="warn">{ar ? "بيانات الموجة غير متاحة" : "This waveform pair is unavailable."}</Callout>}
              <Button label={showAccessibleDescription ? (ar ? "إخفاء الوصف النصي" : "Hide text description") : (ar ? "قراءة وصف الموجة" : "Read waveform text description")} variant="outline" onPress={() => setShowAccessibleDescription((old) => !old)} />
              {showAccessibleDescription ? <Card>{abnormal.accessibleDescription.map((line, i) => <P key={i} small>{line}</P>)}</Card> : null}
              <H2>{abnormal.question.prompt}</H2>
              {abnormal.question.options.map((option, i) => (
                <Button key={i} label={option} variant={choice === i ? "primary" : "outline"} disabled={checked} onPress={() => setChoice(i)} />
              ))}
              {!checked ? (
                <Button label={ar ? "تحقق من الإجابة" : "Check interpretation"} disabled={choice === null} onPress={() => {
                  if (choice === null) return;
                  recordAnswer(`COMPARE-${caseKey}`, "WAVEFORMS", choice, choice === abnormal.question.answer, Date.now());
                  setChecked(true);
                }} />
              ) : (
                <>
                  <Callout tone={choice === abnormal.question.answer ? "success" : "warn"}>{choice === abnormal.question.answer ? "Correct" : "Review the explanation"}</Callout>
                  <Card><P>{abnormal.question.explanation}</P></Card>
                  <NavCard href={`/waveforms/${caseKey}`} title={ar ? "عرض الدرس الكامل" : "Open full waveform exercise"} icon="pulse" accent="equipment" />
                  <Button variant="outline" label={ar ? "أعد المحاولة" : "Try again"} onPress={() => { setChecked(false); setChoice(null); }} />
                </>
              )}
              <P small muted>{ar ? "محتوى تعليمي تجريبي. يجب تقييم المريض وإعدادات الجهاز الفعلية عند الممارسة." : "Simulation only. Clinical interpretation requires the patient's condition, device setup and actual readings."}</P>
            </>
          );
        }}
      </RemoteGate>
    </Screen>
  );
}
