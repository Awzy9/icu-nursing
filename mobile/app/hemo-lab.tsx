import { useMemo, useState } from "react";
import { View } from "react-native";
import { computeHemodynamics, type HemoInputs } from "../src/core/hemodynamics";
import { useApp } from "../src/state/app";
import { Button, Callout, Card, H1, H2, P, Screen, SliderField } from "../src/ui/components";

const DEFAULTS: HemoInputs = { heartRate: 75, strokeVolume: 85, sbp: 120, dbp: 80, cvp: 5 };

const SCENARIOS: { key: string; label: [string, string]; params: HemoInputs; note: [string, string] }[] = [
  { key: "normal", label: ["Reference example", "مثال مرجعي"], params: DEFAULTS, note: [
    "This is a reference example for comparing the calculated values. Preserved pressure alone cannot exclude impaired tissue perfusion.",
    "هذا مثال مرجعي لمقارنة القيم المحسوبة. الضغط المحفوظ وحده لا يستبعد ضعف تروية الأنسجة.",
  ] },
  { key: "distributive", label: ["Distributive example", "مثال توزيعي"], params: { heartRate: 120, strokeVolume: 55, sbp: 85, dbp: 45, cvp: 4 }, note: [
    "This example illustrates low calculated SVR with relatively preserved cardiac output. Vasodilation can occur in distributive shock, and sepsis can also involve cardiac dysfunction or reduced effective circulating volume. These values alone cannot establish sepsis.",
    "يوضح المثال انخفاض المقاومة المحسوبة مع احتفاظ نسبي بالنتاج القلبي. قد يترافق الإنتان مع خلل قلبي أو نقص في الحجم الدوراني الفعّال. لا تكفي هذه القيم لتشخيص الإنتان.",
  ] },
  { key: "hypovolemic", label: ["Volume-loss example", "مثال فقدان الحجم"], params: { heartRate: 125, strokeVolume: 30, sbp: 80, dbp: 55, cvp: 1 }, note: [
    "Low stroke volume and low CVP can accompany volume loss. CVP alone cannot establish blood volume or predict fluid responsiveness.",
    "قد يترافق انخفاض حجم الضربة والضغط الوريدي المركزي مع فقدان الحجم. لا يكفي الضغط الوريدي المركزي وحده لتحديد حجم الدم أو توقّع الاستجابة للسوائل.",
  ] },
  { key: "cardiogenic", label: ["Low output with high CVP", "نتاج منخفض مع ضغط وريدي مركزي مرتفع"], params: { heartRate: 110, strokeVolume: 25, sbp: 80, dbp: 60, cvp: 16 }, note: [
    "Low output with elevated CVP can occur in pump failure or an obstruction. The calculated values cannot distinguish these causes. Assessment of tissue perfusion and clinical findings, with bedside echocardiography when indicated, helps identify the mechanism.",
    "قد يحدث انخفاض النتاج مع ارتفاع الضغط الوريدي المركزي في فشل المضخة أو الانسداد. لا تميّز الحسابات بينهما. يساعد تقييم التروية والفحص السريري والإيكو عند الحاجة في تحديد الآلية.",
  ] },
];

// Mirrors src/components/working/hemo-lab.tsx: a slider-driven hemodynamic-derivation
// calculator, using the native SliderField control.
export default function HemoLab() {
  const { t, rtl: ar } = useApp();
  const [params, setParams] = useState<HemoInputs>(DEFAULTS);
  const [scenario, setScenario] = useState("normal");
  const result = useMemo(() => computeHemodynamics(params), [params]);

  function applyScenario(key: string) {
    setScenario(key);
    setParams(SCENARIOS.find((s) => s.key === key)!.params);
  }
  function update(patch: Partial<HemoInputs>) {
    setScenario("");
    setParams((p) => ({ ...p, ...patch }));
  }

  const activeNote = SCENARIOS.find((s) => s.key === scenario)?.note;

  return (
    <Screen>
      <H1>{t("hemo.title")}</H1>
      <P muted>{t("hemo.intro")}</P>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {SCENARIOS.map((s) => (
          <Button key={s.key} variant={scenario === s.key ? "primary" : "outline"} label={s.label[ar ? 1 : 0]} onPress={() => applyScenario(s.key)} />
        ))}
      </View>

      {activeNote ? <Callout tone="info">{activeNote[ar ? 1 : 0]}</Callout> : null}

      <H2>{t("hemo.settingsTitle")}</H2>
      <Card>
        <SliderField label="Heart rate" unit="/min" value={params.heartRate} min={30} max={180} step={1} onChange={(v) => update({ heartRate: v })} />
        <SliderField label="Stroke volume" unit="mL" value={params.strokeVolume} min={10} max={120} step={1} onChange={(v) => update({ strokeVolume: v })} />
        <SliderField label="Systolic BP" unit="mmHg" value={params.sbp} min={50} max={200} step={1} onChange={(v) => update({ sbp: v })} />
        <SliderField label="Diastolic BP" unit="mmHg" value={params.dbp} min={20} max={130} step={1} onChange={(v) => update({ dbp: v })} />
        <SliderField label="CVP" unit="mmHg" value={params.cvp} min={0} max={25} step={1} onChange={(v) => update({ cvp: v })} />
      </Card>

      <H2>{t("hemo.readoutsTitle")}</H2>
      <Card>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
          <P>{t("hemo.cardiacOutput", { value: result.cardiacOutput?.toFixed(2) ?? "—" })}</P>
          <P>{t("hemo.map", { value: result.map?.toFixed(1) ?? "—" })}</P>
          <P>{t("hemo.svr", { value: result.svr?.toFixed(0) ?? "—" })}</P>
        </View>
      </Card>

      {result.map === null ? <Callout tone="danger">{t("hemo.invalidPressure")}</Callout> : result.svr === null ? <Callout tone="danger">{t("hemo.invalidSvr")}</Callout> : null}

      <H2>{t("hemo.sourcesTitle")}</H2>
      <P small muted>{t("hemo.sourcesNote")}</P>
    </Screen>
  );
}
