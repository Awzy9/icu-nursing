import { useState } from "react";
import { Linking, Pressable, Text, TextInput, View } from "react-native";
import { Stack } from "expo-router";
import { doseToPumpRate, infusionDuration, volumetricRate, type ConcentrationUnit, type DoseUnit, type DurationUnit } from "../src/core/infusion-calculator";
import { useApp } from "../src/state/app";
import { Callout, Card, Chip, H1, H2, NavCard, P, Screen } from "../src/ui/components";
import { radii, space, type } from "../src/ui/theme";

type Mode = "volumetric" | "duration" | "dose";
const parsePositive = (raw: string): number => {
  if (!raw.trim()) return Number.NaN;
  const value = Number(raw.trim().replace(",", "."));
  return Number.isFinite(value) && value > 0 ? value : Number.NaN;
};
const fmt = (number: number) => String(Number(number.toPrecision(6)));

function NumberField({ label, value, onChange, unit }: { label: string; value: string; unit: string; onChange: (text: string) => void }) {
  const { palette } = useApp();
  return (
    <View style={{ gap: space.xs }}>
      <P small>{label} ({unit})</P>
      <TextInput
        value={value}
        onChangeText={onChange}
        accessibilityLabel={`${label}, ${unit}`}
        keyboardType="decimal-pad"
        autoCorrect={false}
        autoCapitalize="none"
        placeholder="0"
        placeholderTextColor={palette.muted}
        style={{ minHeight: 52, color: palette.text, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: radii.md, paddingHorizontal: space.lg, fontSize: 18 }}
      />
    </View>
  );
}

export default function InfusionCalculatorScreen() {
  const { locale, palette } = useApp();
  const ar = locale === "ar";
  const label = (en: string, arabic: string) => ar ? arabic : en;
  const [mode, setMode] = useState<Mode>("volumetric");
  const [volume, setVolume] = useState("");
  const [quantity, setQuantity] = useState("");
  const [durationUnit, setDurationUnit] = useState<DurationUnit>("hours");
  const [weightBased, setWeightBased] = useState(false);
  const [dose, setDose] = useState("");
  const [weight, setWeight] = useState("");
  const [concentration, setConcentration] = useState("");
  const [doseUnit, setDoseUnit] = useState<DoseUnit>("mg/h");
  const [concentrationUnit, setConcentrationUnit] = useState<ConcentrationUnit>("mg/mL");

  const volumeNumber = parsePositive(volume);
  const quantityNumber = parsePositive(quantity);
  const doseNumber = parsePositive(dose);
  const weightNumber = parsePositive(weight);
  const concentrationNumber = parsePositive(concentration);
  const result = mode === "volumetric"
    ? volumetricRate(volumeNumber, quantityNumber, durationUnit)
    : mode === "duration"
      ? infusionDuration(volumeNumber, quantityNumber)
      : doseToPumpRate({ dose: doseNumber, weightKg: weightNumber, weightBased, doseUnit, concentration: concentrationNumber, concentrationUnit });
  const resultUnit = mode === "duration" ? "h" : "mL/h";
  const hours = durationUnit === "minutes" ? quantityNumber / 60 : quantityNumber;
  const totalDose = doseNumber * (weightBased ? weightNumber : 1);
  const doseMgHour = totalDose * (doseUnit === "mcg/min" ? 60 / 1000 : 1);
  const concentrationMgMl = concentrationNumber * (concentrationUnit === "mcg/mL" ? 1 / 1000 : 1);
  const formula = result === null ? null : mode === "volumetric"
    ? `${fmt(volumeNumber)} mL ÷ ${fmt(hours)} h = ${fmt(result)} mL/h`
    : mode === "duration"
      ? `${fmt(volumeNumber)} mL ÷ ${fmt(quantityNumber)} mL/h = ${fmt(result)} h`
      : `${fmt(doseMgHour)} mg/h ÷ ${fmt(concentrationMgMl)} mg/mL = ${fmt(result)} mL/h` ;

  return (
    <Screen>
      <Stack.Screen options={{ title: label("Infusion calculator", "حاسبة التسريب") }} />
      <H1>{label("Infusion pump calculator", "حاسبة مضخة التسريب")}</H1>
      <P muted>{label("Practise a volume-based infusion rate, duration, or dose-to-rate calculation.", "تدرب على حساب معدل التسريب الحجمي أو مدته أو حساب المعدل من الجرعة والتركيز.")}</P>
      <Callout tone="warn">{label(
        "Learning tool only. Use fictional examples here. Never programme a patient's infusion pump using this screen; follow your hospital's approved prescribing, concentration and independent-check policies.",
        "أداة تعليمية بقيم افتراضية فقط. لا تستخدم هذه الشاشة لضبط مضخة المريض؛ اتبع إجراءات المؤسسة المعتمدة للتحقق من الأوامر والتركيز والجرعات."
      )}</Callout>

      <H2>{label("What would you like to calculate?", "ماذا تريد أن تحسب؟")}</H2>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
        <Chip label={label("Rate (mL/h)", "المعدل")} selected={mode === "volumetric"} onPress={() => setMode("volumetric")} />
        <Chip label={label("Duration", "المدة")} selected={mode === "duration"} onPress={() => setMode("duration")} />
        <Chip label={label("Dose to rate", "الجرعة إلى معدل")} selected={mode === "dose"} onPress={() => setMode("dose")} />
      </View>

      <Card>
        {mode === "dose" ? (
          <>
            <P>{label("Dose basis", "طريقة حساب الجرعة")}</P>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
              <Chip label={label("Fixed dose", "جرعة ثابتة")} selected={!weightBased} onPress={() => setWeightBased(false)} />
              <Chip label={label("Weight-based", "حسب الوزن")} selected={weightBased} onPress={() => setWeightBased(true)} />
            </View>
            <NumberField label={label("Dose rate", "معدل الجرعة")} value={dose} onChange={setDose} unit={weightBased ? (doseUnit === "mg/h" ? "mg/kg/h" : "mcg/kg/min") : doseUnit} />
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
              <Chip label={weightBased ? "mg/kg/h" : "mg/h"} selected={doseUnit === "mg/h"} onPress={() => setDoseUnit("mg/h")} />
              <Chip label={weightBased ? "mcg/kg/min" : "mcg/min"} selected={doseUnit === "mcg/min"} onPress={() => setDoseUnit("mcg/min")} />
            </View>
            {weightBased ? <NumberField label={label("Example weight", "الوزن الافتراضي")} value={weight} onChange={setWeight} unit="kg" /> : null}
            <NumberField label={label("Solution concentration", "تركيز المحلول")} value={concentration} onChange={setConcentration} unit={concentrationUnit} />
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
              <Chip label="mg/mL" selected={concentrationUnit === "mg/mL"} onPress={() => setConcentrationUnit("mg/mL")} />
              <Chip label="mcg/mL" selected={concentrationUnit === "mcg/mL"} onPress={() => setConcentrationUnit("mcg/mL")} />
            </View>
          </>
        ) : (
          <>
            <NumberField label={label("Volume", "الحجم")} value={volume} onChange={setVolume} unit="mL" />
            <NumberField
              label={mode === "volumetric" ? label("Duration", "المدة") : label("Infusion rate", "معدل التسريب")}
              value={quantity}
              onChange={setQuantity}
              unit={mode === "duration" ? "mL/h" : durationUnit === "hours" ? "h" : "min"}
            />
            {mode === "volumetric" ? (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
                <Chip label={label("Hours", "ساعات")} selected={durationUnit === "hours"} onPress={() => setDurationUnit("hours")} />
                <Chip label={label("Minutes", "دقائق")} selected={durationUnit === "minutes"} onPress={() => setDurationUnit("minutes")} />
              </View>
            ) : null}
          </>
        )}
      </Card>

      <Card>
        <P small muted>{label("Calculated result", "النتيجة المحسوبة")}</P>
        {result === null ? (
          <P muted>{label("Enter valid positive numbers to calculate.", "أدخل قيماً موجبة صحيحة لإظهار الناتج.")}</P>
        ) : (
          <View style={{ gap: space.sm }}>
            <Text accessibilityRole="text" style={[type.h1, { color: palette.primary, fontVariant: ["tabular-nums"], writingDirection: "ltr" }]}>{fmt(result)} {resultUnit}</Text>
            <P small>{formula}</P>
          </View>
        )}
      </Card>

      <H2>{label("Worked examples", "أمثلة محلولة")}</H2>
      <Card>
        <P small>150 mL ÷ 2 h = 75 mL/h</P>
        <P small>6 mg/h ÷ 2 mg/mL = 3 mL/h</P>
        <P small>0.2 mcg/kg/min × 50 kg = 10 mcg/min</P>
        <P small>10 mcg/min × 60 min/h ÷ 100 mcg/mL = 6 mL/h</P>
      </Card>
      <NavCard href="/infusion" title={label("Infusion practice questions", "أسئلة تدريب التسريب")} body={label("Test rate calculations in clinical scenarios", "تدرّب على مسائل حساب المعدلات")} icon="help" accent="practice" />
      <Pressable accessibilityRole="link" onPress={() => Linking.openURL("https://www.ncbi.nlm.nih.gov/books/NBK596732/")}>
        <Text style={[type.small, { color: palette.primary, textDecorationLine: "underline" }]}>{label("Open RN: infusion calculation reference", "مرجع Open RN لحسابات التسريب")}</Text>
      </Pressable>
    </Screen>
  );
}
