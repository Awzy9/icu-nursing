import type { ScenarioStep } from "@/lib/working/model";

export function oxygenReading(step: ScenarioStep) {
  return step.observations?.find(({ label, value, unit }) =>
    label === "Oxygen saturation (fictional)" &&
    typeof value === "number" &&
    Number.isFinite(value) &&
    unit === "%",
  );
}

export function ScenarioOxygenMonitor({ current, previous, locale }: {
  current: ScenarioStep;
  previous: ScenarioStep[];
  locale: string;
}) {
  const ar = locale === "ar";
  const reading = oxygenReading(current);
  if (!reading) return null;

  const priorReadings = previous.flatMap(step => {
    const prior = oxygenReading(step);
    return prior ? [prior.value] : [];
  });

  return (
    <figure lang={ar ? "ar" : "en"} dir={ar ? "rtl" : "ltr"} className="rounded-xl bg-slate-950 p-4 text-slate-100">
      <figcaption className="text-sm font-medium">
        {ar ? "تشبع الأكسجين في السيناريو" : "Scenario oxygen saturation"}
      </figcaption>
      <p className="mt-2 text-sm">
        {ar ? "القراءة الحالية" : "Current reading"}{" "}
        <bdi className="ms-2 text-3xl font-semibold tabular-nums text-cyan-300" dir="ltr">{reading.value}%</bdi>
      </p>
      {priorReadings.length > 0 && (
        <div className="mt-3 border-t border-slate-700 pt-3 text-sm">
          <p>{ar ? "القراءات السابقة في هذه المحاولة" : "Previous readings in this attempt"}</p>
          <ol className="mt-2 flex flex-wrap gap-2">
            {priorReadings.map((value, index) => (
              <li key={index} className="rounded-md bg-slate-800 px-2 py-1 tabular-nums">
                <bdi dir="ltr">{value}%</bdi>
              </li>
            ))}
          </ol>
        </div>
      )}
    </figure>
  );
}
