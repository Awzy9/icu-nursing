import { View } from "react-native";
import { Card, H2, P } from "./components";
import { space } from "./theme";

export interface CaseObservation {
  label: string;
  value: string | number;
  unit?: string;
}
type Kind = "neuro" | "perfusion";
const neuroLabels = new Set(["Eye opening", "Verbal response", "Motor response"]);
const perfusionLabels = new Set(["Blood pressure", "Heart rate", "Pulse", "Skin", "Urine output", "Alertness", "Mental state", "Monitor rhythm", "Infusion site"]);
const neuroArabic: Record<string, string> = { "Eye opening": "فتح العينين", "Verbal response": "الاستجابة اللفظية", "Motor response": "الاستجابة الحركية" };
const perfusionArabic: Record<string, string> = {
  "Blood pressure": "ضغط الدم", "Heart rate": "معدل ضربات القلب", "Pulse": "النبض", "Skin": "الجلد",
  "Urine output": "إدرار البول", "Alertness": "مستوى اليقظة", "Mental state": "الحالة الذهنية",
  "Monitor rhythm": "النظم على الشاشة", "Infusion site": "موضع التسريب",
};
const selected = (obs: CaseObservation[] | undefined, kind: Kind) => (obs ?? []).filter((entry) =>
  (kind === "neuro" ? neuroLabels : perfusionLabels).has(entry.label)
);

export function CaseComparison({ kind, observations, earlier, ar }: {
  kind: Kind;
  observations?: CaseObservation[];
  earlier?: { observations?: CaseObservation[] }[];
  ar: boolean;
}) {
  const current = selected(observations, kind);
  if (!current.length) return null;
  const previous = new Map((earlier ?? []).flatMap((item) => selected(item.observations, kind)).map((item) => [item.label, item.value]));
  const translated = kind === "neuro" ? neuroArabic : perfusionArabic;
  return (
    <Card>
      <H2>{kind === "neuro" ? (ar ? "تغيّر الاستجابات العصبية" : "Neurological response comparison") : (ar ? "ملاحظات الدورة الدموية والتسريب" : "Perfusion and infusion observations")}</H2>
      <View style={{ gap: space.sm }}>
        {current.map((reading) => {
          const old = previous.get(reading.label);
          return (
            <Card key={reading.label}>
              <P>{ar ? translated[reading.label] ?? reading.label : reading.label}</P>
              <P>{String(reading.value)}{reading.unit ? ` ${reading.unit}` : ""}</P>
              {old !== undefined ? <P small muted>{ar ? "الملاحظة السابقة" : "Previous observation"}: {String(old)}</P> : null}
            </Card>
          );
        })}
      </View>
      <P small muted>{ar ? "قارن التغيّر عبر خطوات الحالة قبل اتخاذ القرار." : "Compare changes across case steps before making your decision."}</P>
    </Card>
  );
}
