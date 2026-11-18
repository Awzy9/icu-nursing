// Pure port of src/components/working/scenario-reading-monitor.tsx's monitorReadings(): matches
// a scenario step's observations against the four known fictional-scenario metrics (oxygen
// saturation, temperature, blood glucose, serum potassium) by label and unit, so the native
// case screen can show the same numeric monitor display the website does, from the same real
// step.observations data (no separate backend content needed).

export const METRICS = [
  { key: "oxygen", label: "Oxygen saturation (fictional)", unit: "%", suffix: "%", name: ["Scenario oxygen saturation", "تشبع الأكسجين في السيناريو"] as [string, string] },
  { key: "temperature", label: "Temperature (fictional)", unit: "degrees C", suffix: " °C", name: ["Scenario temperature", "درجة الحرارة في السيناريو"] as [string, string] },
  { key: "glucose", label: "Blood glucose (fictional)", unit: "mmol/L", suffix: " mmol/L", name: ["Scenario blood glucose", "سكر الدم في السيناريو"] as [string, string] },
  { key: "potassium", label: "Serum potassium (fictional)", unit: "mmol/L", suffix: " mmol/L", name: ["Scenario serum potassium", "بوتاسيوم المصل في السيناريو"] as [string, string] },
] as const;
export type Metric = (typeof METRICS)[number];

export interface Observation { label: string; value: number | string; unit?: string }
export interface Reading { metric: Metric; value: number }

export function monitorReadings(observations: Observation[] | undefined): Reading[] {
  return (observations ?? []).flatMap((o) => {
    const metric = METRICS.find((m) => m.label === o.label && m.unit === o.unit);
    return metric && typeof o.value === "number" && Number.isFinite(o.value) ? [{ metric, value: o.value }] : [];
  });
}
