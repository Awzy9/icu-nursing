import type { ScenarioStep } from "@/lib/working/model";

const responseLabels: Readonly<Record<string, string>> = {
  "Eye opening": "فتح العينين",
  "Verbal response": "الاستجابة اللفظية",
  "Motor response": "الاستجابة الحركية",
};

const responseValues: Readonly<Record<string, string>> = {
  "Less than last check": "أقل من الفحص السابق",
  "Lower than last check": "أقل من الفحص السابق",
  "Still reduced": "لا تزال منخفضة",
  "Still lower": "لا تزال أقل من الفحص السابق",
};

export function neuroReadings(step: ScenarioStep) {
  return (step.observations ?? []).filter(observation =>
    Object.hasOwn(responseLabels, observation.label),
  );
}

export function ScenarioNeuroComparison({ readings, locale }: {
  readings: ReturnType<typeof neuroReadings>;
  locale: string;
}) {
  const ar = locale === "ar";
  return (
    <figure dir={ar ? "rtl" : "ltr"} lang={ar ? "ar" : "en"} className="rounded-xl border border-border bg-muted p-4">
      <figcaption className="font-semibold">
        {ar ? "تغيّر الاستجابات في الفحص العصبي" : "Changes in neurological responses"}
      </figcaption>
      <dl className="mt-3 grid gap-2 sm:grid-cols-3">
        {readings.map(({ label, value }) => {
          const translated = ar ? responseValues[String(value)] : undefined;
          return (
            <div key={label} className="rounded-lg border border-border bg-card p-3">
              <dt className="text-sm font-semibold">{ar ? responseLabels[label] : label}</dt>
              <dd lang={translated ? "ar" : "en"} dir={translated ? "rtl" : "ltr"} className="mt-1 text-sm text-muted-foreground">
                {translated ?? value}
              </dd>
            </div>
          );
        })}
      </dl>
    </figure>
  );
}
