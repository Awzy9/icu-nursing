import type { ScenarioStep } from "@/lib/working/model";

const labels = new Map([
  ["Blood pressure", "ضغط الدم"],
  ["Heart rate", "معدل ضربات القلب"],
  ["Pulse", "النبض"],
  ["Skin", "الجلد"],
  ["Urine output", "إدرار البول"],
  ["Alertness", "مستوى اليقظة"],
  ["Mental state", "الحالة الذهنية"],
  ["Monitor rhythm", "النظم على شاشة المراقبة"],
  ["Infusion site", "موضع التسريب"],
]);

const values = new Map([
  ["Falling over the last hour", "انخفض خلال الساعة الماضية"],
  ["Lower again", "انخفض مجدداً"],
  ["Steadier", "أكثر استقراراً"],
  ["Lower than usual", "أقل من المعتاد"],
  ["Still low", "لا يزال منخفضاً"],
  ["Faster than usual", "أسرع من المعتاد"],
  ["Fast and weak", "سريع وضعيف"],
  ["Cool and sweaty", "بارد ومتعرّق"],
  ["Cool, clammy", "بارد ورطب"],
  ["Cold and clammy", "بارد ورطب"],
  ["Falling", "يتناقص"],
  ["Low", "منخفض"],
  ["More drowsy than before", "أكثر نعاساً من السابق"],
  ["Slower to respond", "أبطأ في الاستجابة"],
  ["Confused", "مشوّش"],
  ["Runs of ventricular ectopic beats", "نوبات من الضربات البطينية المبكرة"],
  ["Fewer ectopic beats", "ضربات مبكرة أقل"],
  ["Looks normal", "يبدو طبيعياً"],
  ["Pale, cool, swollen", "شاحب وبارد ومتورّم"],
]);

export function perfusionReadings(step: ScenarioStep) {
  return (step.observations ?? []).filter(observation => labels.has(observation.label));
}

function Finding({ value, locale }: { value: string | number; locale: string }) {
  const translation = locale === "ar" ? values.get(String(value)) : undefined;
  return <span lang={translation ? "ar" : "en"} dir={translation ? "rtl" : "ltr"}>{translation ?? value}</span>;
}

export function ScenarioPerfusionPanel({ readings, previous, locale }: {
  readings: ReturnType<typeof perfusionReadings>;
  previous: ScenarioStep[];
  locale: string;
}) {
  const ar = locale === "ar";
  const latest = new Map(previous.flatMap(perfusionReadings).map(({ label, value }) => [label, value]));
  return (
    <figure lang={ar ? "ar" : "en"} dir={ar ? "rtl" : "ltr"} className="rounded-xl border border-border bg-muted p-4">
      <figcaption className="font-semibold">{ar ? "ملاحظات الدورة الدموية والتسريب" : "Circulation and infusion observations"}</figcaption>
      <dl className="mt-3 grid gap-2 sm:grid-cols-2">
        {readings.map(({ label, value }) => {
          const prior = latest.get(label);
          return (
            <div key={label} className="rounded-lg border border-border bg-card p-3 text-sm">
              <dt className="font-semibold">{ar ? labels.get(label) : label}</dt>
              <dd className="mt-1"><Finding value={value} locale={locale} /></dd>
              {prior !== undefined && (
                <dd className="mt-2 text-muted-foreground">
                  {ar ? "الملاحظة السابقة" : "Previous observation"}: <Finding value={prior} locale={locale} />
                </dd>
              )}
            </div>
          );
        })}
      </dl>
    </figure>
  );
}
