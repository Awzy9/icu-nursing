import type { ScenarioStep } from "@/lib/working/model";

const metrics = [
  { key: "oxygen", label: "Oxygen saturation (fictional)", unit: "%", suffix: "%", name: ["Scenario oxygen saturation", "تشبع الأكسجين في السيناريو"] },
  { key: "temperature", label: "Temperature (fictional)", unit: "degrees C", suffix: " °C", name: ["Scenario temperature", "درجة الحرارة في السيناريو"] },
  { key: "glucose", label: "Blood glucose (fictional)", unit: "mmol/L", suffix: " mmol/L", name: ["Scenario blood glucose", "سكر الدم في السيناريو"] },
  { key: "potassium", label: "Serum potassium (fictional)", unit: "mmol/L", suffix: " mmol/L", name: ["Scenario serum potassium", "بوتاسيوم المصل في السيناريو"] },
] as const;

type Reading = {
  metric: (typeof metrics)[number];
  observation: NonNullable<ScenarioStep["observations"]>[number];
  value: number;
};

export function monitorReadings(step: ScenarioStep): Reading[] {
  return (step.observations ?? []).flatMap(observation => {
    const { label, value, unit } = observation;
    const metric = metrics.find(item => item.label === label && item.unit === unit);
    return metric && typeof value === "number" && Number.isFinite(value)
      ? [{ metric, observation, value }]
      : [];
  });
}

export function ScenarioReadingMonitor({ current, previous, locale }: {
  current: Reading[];
  previous: ScenarioStep[];
  locale: string;
}) {
  const ar = locale === "ar";
  const history = previous.flatMap(monitorReadings);
  return (
    <div lang={ar ? "ar" : "en"} dir={ar ? "rtl" : "ltr"} className="grid gap-3 sm:grid-cols-2 [&>figure:only-child]:col-span-full">
      {current.map(({ metric, value }) => {
        const priorReadings = history.filter(reading => reading.metric.key === metric.key);
        return (
          <figure key={metric.key} className="rounded-xl bg-slate-950 p-4 text-slate-100">
            <figcaption className="text-sm font-medium">{metric.name[ar ? 1 : 0]}</figcaption>
            <p className="mt-2 text-sm">
              {ar ? "القراءة الحالية" : "Current reading"}{" "}
              <bdi className="ms-2 text-3xl font-semibold tabular-nums text-cyan-300" dir="ltr">
                {value}{metric.suffix}
              </bdi>
            </p>
            {priorReadings.length > 0 && (
              <div className="mt-3 border-t border-slate-700 pt-3 text-sm">
                <p>{ar ? "القراءات السابقة في هذه المحاولة" : "Previous readings in this attempt"}</p>
                <ol className="mt-2 flex flex-wrap gap-2">
                  {priorReadings.map((reading, index) => (
                    <li key={index} className="rounded-md bg-slate-800 px-2 py-1 tabular-nums">
                      <bdi dir="ltr">{reading.value}{metric.suffix}</bdi>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </figure>
        );
      })}
    </div>
  );
}
