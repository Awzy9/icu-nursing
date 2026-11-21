import { useState } from "react";
import { View } from "react-native";
import Svg, { Ellipse, Line, Path, Rect } from "react-native-svg";
import { useApp } from "../state/app";
import { Chip, H2, P, Card } from "./components";
import { space } from "./theme";

type Landmark = "airway" | "lungs" | "pleura" | "diaphragm";
const landmarks: { id: Landmark; label: [string, string]; note: [string, string] }[] = [
  { id: "airway", label: ["Airway", "المجرى الهوائي"], note: ["Locate the tracheal air column, carina and main bronchi. When a tube is present, its tip must be assessed against the carina on the actual image.", "حدّد عمود الهواء في الرغامى والكارينا والقصبتين الرئيسيتين. عند وجود أنبوب، تُقيّم نهايته بالنسبة للكارينا في الصورة الفعلية."] },
  { id: "lungs", label: ["Lung fields", "الرئتان"], note: ["Compare the visible lung fields and their symmetry, remembering that positioning and image projection affect appearance.", "قارن حقول الرئتين وتماثلها مع مراعاة تأثير الوضعية وطريقة التصوير."] },
  { id: "pleura", label: ["Pleural edges", "حواف الجنب"], note: ["Follow the pleural boundaries on the actual chest image. A schematic cannot establish pneumothorax or other pathology.", "تتبّع حدود الجنب في صورة الصدر الحقيقية؛ لا يمكن للرسم التخطيطي إثبات وجود استرواح الصدر أو أي مرض آخر."] },
  { id: "diaphragm", label: ["Diaphragm", "الحجاب الحاجز"], note: ["Inspect each hemidiaphragm and costophrenic region in the real radiograph; compare with earlier images when available.", "راجع نصفي الحجاب الحاجز والزوايا الضلعية الحجابية في الصورة الفعلية وقارن بالصور السابقة إن توفرت."] },
];

/**
 * Original anatomy teaching schematic, deliberately not a radiograph or a diagnostic example.
 * Interactive explanations sit outside SVG so VoiceOver can reach every control.
 */
export function ChestLandmarkDiagram() {
  const { rtl: ar, palette } = useApp();
  const [active, setActive] = useState<Landmark>("airway");
  const selected = landmarks.find((item) => item.id === active)!;
  const accent = palette.primary;
  return (
    <Card>
      <H2>{ar ? "معالم صورة الصدر" : "Chest radiograph landmarks"}</H2>
      <P small muted>{ar ? "رسم تشريحي تعليمي أصلي، وليس صورة أشعة أو وسيلة للتشخيص." : "Original anatomy schematic — not an actual X-ray, diagnostic image or substitute for a licensed clinical radiograph."}</P>
      <View accessibilityRole="image" accessibilityLabel="Simplified thoracic outline with trachea, bronchi, bilateral lung contours, pleural borders and diaphragm" style={{ alignItems: "center", backgroundColor: "#0b1727", borderRadius: 14, padding: space.sm }}>
        <Svg width="100%" height={250} viewBox="0 0 340 260">
          <Path d="M158 20v90 M182 20v90" stroke={active === "airway" ? accent : "#dbeafe"} strokeWidth={5} strokeLinecap="round" />
          <Path d="M170 104L133 137 M170 104l37 33" stroke={active === "airway" ? accent : "#dbeafe"} strokeWidth={5} fill="none" strokeLinecap="round" />
          <Path d="M149 51C94 36 48 71 42 127l-8 71c36 18 75 15 120-3l-5-144z" stroke={active === "lungs" || active === "pleura" ? accent : "#94a3b8"} strokeWidth={active === "pleura" ? 4 : 2} fill={active === "lungs" ? "#1f5061" : "#142c46"} />
          <Path d="M191 51c55-15 101 20 107 76l8 71c-36 18-75 15-120-3l5-144z" stroke={active === "lungs" || active === "pleura" ? accent : "#94a3b8"} strokeWidth={active === "pleura" ? 4 : 2} fill={active === "lungs" ? "#1f5061" : "#142c46"} />
          <Path d="M30 195Q96 166 162 203 M178 203Q244 166 310 195" stroke={active === "diaphragm" ? accent : "#f2cf92"} strokeWidth={4} fill="none" strokeLinecap="round" />
          <Path d="M156 24v180 M184 24v180" stroke="#4b647a" strokeWidth={1} strokeDasharray="3 6" />
          <Ellipse cx={170} cy={104} rx={5} ry={5} fill={active === "airway" ? accent : "#f3f4f6"} />
          <Line x1={18} y1={230} x2={322} y2={230} stroke="#334155" />
        </Svg>
      </View>
      <View style={{ flexDirection: "row", gap: space.sm, flexWrap: "wrap" }}>
        {landmarks.map((item) => <Chip key={item.id} label={item.label[ar ? 1 : 0]} selected={active === item.id} onPress={() => setActive(item.id)} />)}
      </View>
      <P>{selected.note[ar ? 1 : 0]}</P>
    </Card>
  );
}
