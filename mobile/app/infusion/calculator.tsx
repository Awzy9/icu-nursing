import { useState } from "react";
import { TextInput } from "react-native";
import { Card, Chip, H1, H2, P, Screen } from "../../src/ui/components";
import { useApp } from "../../src/state/app";

export default function InfusionCalculator() {
  const { locale, palette } = useApp();
  const ar = locale === "ar";
  const [volume, setVolume] = useState("");
  const [quantity, setQuantity] = useState("");
  const [mode, setMode] = useState<"rate" | "time">("rate");
  const [minutes, setMinutes] = useState(false);
  const amount = Number(quantity.replace(",", "."));
  const ml = Number(volume.replace(",", "."));
  const divisor = mode === "rate" && minutes ? amount / 60 : amount;
  const result = ml / divisor;
  const valid = Number.isFinite(ml) && Number.isFinite(amount) && ml > 0 && amount > 0 && Number.isFinite(result) && result > 0;
  const format = new Intl.NumberFormat(locale, { maximumSignificantDigits: 6 });
  const style = { minHeight: 48, borderRadius: 10, borderWidth: 1, borderColor: palette.border, color: palette.text, paddingHorizontal: 12, fontSize: 17 };
  const volumeLabel = ar ? "الحجم (مل)" : "Volume (mL)";
  const quantityLabel = mode === "rate" ? (ar ? "المدة" : "Duration") : (ar ? "المعدل (مل/ساعة)" : "Rate (mL/h)");
  return (
    <Screen>
      <H1>{ar ? "حاسبة مضخة التسريب" : "Infusion pump calculator"}</H1>
      <P>{ar ? "تدريب على حساب معدل التسريب أو مدته لأمثلة تعليمية." : "Practise calculating volumetric rate or duration with example values."}</P>
      <Chip label={ar ? "معدل التسريب" : "Infusion rate"} selected={mode === "rate"} onPress={() => { if (mode !== "rate") { setMode("rate"); setQuantity(""); } }} />
      <Chip label={ar ? "مدة التسريب" : "Infusion duration"} selected={mode === "time"} onPress={() => { if (mode !== "time") { setMode("time"); setQuantity(""); } }} />
      <P>{volumeLabel}</P>
      <TextInput accessibilityLabel={volumeLabel} value={volume} onChangeText={setVolume} keyboardType="decimal-pad" style={style} />
      <P>{quantityLabel}</P>
      <TextInput accessibilityLabel={quantityLabel} value={quantity} onChangeText={setQuantity} keyboardType="decimal-pad" style={style} />
      {mode === "rate" && <>
        <Chip label={ar ? "ساعات" : "Hours"} selected={!minutes} onPress={() => setMinutes(false)} />
        <Chip label={ar ? "دقائق" : "Minutes"} selected={minutes} onPress={() => setMinutes(true)} />
      </>}
      <Card>
        {valid ? <H2>{format.format(result)} {mode === "rate" ? "mL/h" : "h"}</H2> :
          <P muted>{ar ? "أدخل قيمتين موجبتين." : "Enter two positive values."}</P>}
      </Card>
    </Screen>
  );
}
