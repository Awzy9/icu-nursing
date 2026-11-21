import { useMemo, useState } from "react";
import { View } from "react-native";
import { simulateVentCycle, type VentParams } from "../src/core/vent-model";
import { useApp } from "../src/state/app";
import { Button, Callout, Card, H1, H2, P, Screen, SliderField } from "../src/ui/components";
import { WaveformChart } from "../src/ui/waveform-chart";

const DEFAULTS: VentParams = { tidalVolume: 450, respRate: 14, peep: 5, inspiratoryTime: 1, compliance: 50, resistance: 10 };

const SCENARIOS: { key: string; label: [string, string]; params: Partial<VentParams>; note: [string, string] }[] = [
  { key: "normal", label: ["Normal mechanics", "ميكانيكا طبيعية"], params: {}, note: [
    "Typical compliance and resistance - peak and plateau pressure are both unremarkable.",
    "امتثال ومقاومة طبيعيان - ضغط الذروة والهضبة كلاهما ضمن الحدود الطبيعية.",
  ] },
  { key: "stiff", label: ["Stiff lungs (low compliance)", "رئتان متيبستان (امتثال منخفض)"], params: { compliance: 15, resistance: 14 }, note: [
    "Low compliance raises BOTH peak and plateau pressure together - think ARDS, pulmonary oedema, or a large pleural effusion. Escalate if the high-pressure alarm persists.",
    "الامتثال المنخفض يرفع ضغط الذروة والهضبة معاً - فكّر في ARDS أو الوذمة الرئوية أو الانصباب الجنبي الكبير. صعّد الحالة إذا استمر إنذار الضغط المرتفع.",
  ] },
  { key: "obstructed", label: ["High airway resistance", "مقاومة مجرى هوائي مرتفعة"], params: { resistance: 32, compliance: 45 }, note: [
    "High resistance raises peak pressure much more than plateau pressure - a wide peak-minus-plateau gap points to the airway/circuit (secretions, bronchospasm, a kinked tube), not the lung tissue itself.",
    "المقاومة المرتفعة ترفع ضغط الذروة أكثر بكثير من الهضبة - الفرق الكبير بينهما يشير إلى مجرى الهواء أو الدائرة (إفرازات، تشنج قصبي، أنبوب منحني)، وليس نسيج الرئة نفسه.",
  ] },
  { key: "disconnect", label: ["Circuit disconnect", "انفصال الدائرة"], params: { circuitDisconnected: true }, note: [
    "In this simplified disconnected-circuit scenario, delivered volume and pressure rise are severely reduced and a simulated low-pressure alert appears. Assess the patient and adequacy of ventilation immediately, summon help if unstable, then inspect the airway and circuit using your unit's procedure. A real ventilator's alarm behaviour varies.",
    "في سيناريو انفصال الدائرة المبسّط، ينخفض الحجم المُسلّم وارتفاع الضغط بشدة ويظهر إنذار انخفاض ضغط افتراضي. قيّم المريض وفعالية التهوية فوراً، واطلب المساعدة إذا كان غير مستقر، ثم افحص مجرى الهواء والدائرة وفق إجراءات وحدتك. تختلف استجابة الإنذارات بين أجهزة التنفس الحقيقية.",
  ] },
];

// Mirrors src/components/working/vent-lab.tsx: a slider-driven breath-mechanics simulator,
// using the native SliderField control and the shared WaveformChart primitive.
export default function VentLab() {
  const { t, rtl: ar } = useApp();
  const [params, setParams] = useState<VentParams>(DEFAULTS);
  const [scenario, setScenario] = useState("normal");
  const result = useMemo(() => simulateVentCycle(params), [params]);

  function applyScenario(key: string) {
    const s = SCENARIOS.find((s) => s.key === key)!;
    setScenario(key);
    setParams({ ...DEFAULTS, ...s.params });
  }
  function update(patch: Partial<VentParams>) {
    setScenario("");
    setParams((p) => ({ ...p, ...patch }));
  }

  const activeNote = SCENARIOS.find((s) => s.key === scenario)?.note;

  return (
    <Screen>
      <H1>{t("vent.title")}</H1>
      <P muted>{t("vent.intro")}</P>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {SCENARIOS.map((s) => (
          <Button key={s.key} variant={scenario === s.key ? "primary" : "outline"} label={s.label[ar ? 1 : 0]} onPress={() => applyScenario(s.key)} />
        ))}
      </View>

      {activeNote ? <Callout tone="info">{activeNote[ar ? 1 : 0]}</Callout> : null}

      <H2>{t("vent.settingsTitle")}</H2>
      <Card>
        <SliderField label="Tidal volume" unit="mL" value={params.tidalVolume} min={200} max={600} step={10} onChange={(v) => update({ tidalVolume: v })} />
        <SliderField label="Respiratory rate" unit="/min" value={params.respRate} min={8} max={30} step={1} onChange={(v) => update({ respRate: v })} />
        <SliderField label="PEEP" unit="cmH2O" value={params.peep} min={0} max={15} step={1} onChange={(v) => update({ peep: v })} />
        <SliderField label="Inspiratory time" unit="s" value={params.inspiratoryTime} min={0.6} max={2} step={0.1} onChange={(v) => update({ inspiratoryTime: v })} />
        <SliderField label="Compliance" unit="mL/cmH2O" value={params.compliance} min={15} max={80} step={1} onChange={(v) => update({ compliance: v })} />
        <SliderField label="Airway resistance" unit="cmH2O/(L/s)" value={params.resistance} min={5} max={35} step={1} onChange={(v) => update({ resistance: v })} />
      </Card>

      <H2>{t("vent.readoutsTitle")}</H2>
      <Card>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
          <P>{t("vent.peak", { value: result.peakPressure })}</P>
          <P>{t("vent.plateau", { value: result.plateauPressure })}</P>
          <P>{t("vent.diff", { value: Math.round((result.peakPressure - result.plateauPressure) * 10) / 10 })}</P>
          <P>{t("vent.tau", { value: result.timeConstant })}</P>
        </View>
      </Card>

      {result.highPressureAlarm ? <Callout tone="danger">{t("vent.highPressureAlarm")}</Callout> : null}
      {result.lowPressureAlarm ? <Callout tone="danger">{t("vent.lowPressureAlarm")}</Callout> : null}

      <H2>{t("vent.tracesTitle")}</H2>
      <Card>
        <WaveformChart trace={result.pressure} />
        <WaveformChart trace={result.flow} />
        <WaveformChart trace={result.volume} />
      </Card>

      <H2>{t("vent.sourcesTitle")}</H2>
      <P small muted>{t("vent.sourcesNote")}</P>
    </Screen>
  );
}
