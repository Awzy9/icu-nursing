import { View } from "react-native";
import type { GcsOption } from "../core/gcs";
import { useApp } from "../state/app";
import { Button, P } from "./components";

/** One category's button row (Eye/Verbal/Motor) - shared between the free-scoring tool and the case-practice screen. */
export function GcsPicker({ title, options, value, onChange, disabled }: { title: string; options: GcsOption[]; value: number | null; onChange: (v: number) => void; disabled?: boolean }) {
  const { rtl } = useApp();
  return (
    <View style={{ gap: 6 }}>
      <P small>{title}</P>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {options.map((o) => <Button key={o.score} variant={value === o.score ? "primary" : "outline"} disabled={disabled} label={`${o.label[rtl ? 1 : 0]} (${o.score})`} onPress={() => onChange(o.score)} />)}
      </View>
    </View>
  );
}
