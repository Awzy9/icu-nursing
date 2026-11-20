import { Image } from "react-native";
import { Card, P } from "./components";
import { imageUrl, siteBaseUrl } from "../core/remoteContent";

const images: Record<string, readonly [file: string, label: string][]> = {
  "EQ-01": [["wrist-oximeter", "Wrist pulse oximeter"]],
  "EQ-03": [["arterial-line", "Arterial monitoring setup"], ["arterial-transducer-level", "Arterial transducer leveling"], ["arterial-waveform-damping", "Arterial waveform damping comparison"]],
  "EQ-04": [["syringe-pump", "Syringe infusion pump"]],
  "EQ-05": [["defibrillator", "Defibrillator and ECG display"]],
  "EQ-06": [["cvvhd-circuit", "Continuous venovenous hemodialysis circuit"]],
};

export function EquipmentImages({ moduleKey, forQuestion = false }: { moduleKey: string; forQuestion?: boolean }) {
  const figures = images[moduleKey] ?? [];
  const base = siteBaseUrl({ EXPO_PUBLIC_SITE_URL: process.env.EXPO_PUBLIC_SITE_URL });
  return (forQuestion ? figures.slice(0, 1) : figures).map(([file, label]) => (
    <Card key={file}>
      <Image source={{ uri: imageUrl(base, `/images/equipment/${file}.webp`) }}
        accessibilityRole="image" accessibilityLabel={label} resizeMode="contain"
        style={{ width: "100%", height: 220 }} />
      <P small>{label}</P>
    </Card>
  ));
}
