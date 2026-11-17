"use client";
import { useMemo, useState } from "react";
import { computeHemodynamics, type HemoInputs } from "@/lib/working/hemodynamics";

const DEFAULTS: HemoInputs = { heartRate: 75, strokeVolume: 85, sbp: 120, dbp: 80, cvp: 5 };

const SCENARIOS: { key: string; label: [string, string]; params: HemoInputs; note: [string, string] }[] = [
  { key: "normal", label: ["Reference example", "مثال مرجعي"], params: DEFAULTS, note: [
    "This is a reference example for comparing the calculated values. Preserved pressure alone cannot exclude impaired tissue perfusion.",
    "هذا مثال مرجعي لمقارنة القيم المحسوبة. الضغط المحفوظ وحده لا يستبعد ضعف تروية الأنسجة.",
  ] },
  { key: "distributive", label: ["Distributive example", "مثال توزيعي"], params: { heartRate: 120, strokeVolume: 55, sbp: 85, dbp: 45, cvp: 4 }, note: [
    "This example illustrates low calculated SVR with relatively preserved cardiac output. Vasodilation can occur in distributive shock, and sepsis can also involve cardiac dysfunction or reduced effective circulating volume. These values alone cannot establish sepsis.",
    "يوضح المثال انخفاض المقاومة المحسوبة مع احتفاظ نسبي بالنتاج القلبي. قد يترافق الإنتان مع خلل قلبي أو نقص في الحجم الدوراني الفعّال. لا تكفي هذه القيم لتشخيص الإنتان.",
  ] },
  { key: "hypovolemic", label: ["Volume-loss example", "مثال فقدان الحجم"], params: { heartRate: 125, strokeVolume: 30, sbp: 80, dbp: 55, cvp: 1 }, note: [
    "Low stroke volume and low CVP can accompany volume loss. CVP alone cannot establish blood volume or predict fluid responsiveness.",
    "قد يترافق انخفاض حجم الضربة والضغط الوريدي المركزي مع فقدان الحجم. لا يكفي الضغط الوريدي المركزي وحده لتحديد حجم الدم أو توقّع الاستجابة للسوائل.",
  ] },
  { key: "cardiogenic", label: ["Low output with high CVP", "نتاج منخفض مع ضغط وريدي مركزي مرتفع"], params: { heartRate: 110, strokeVolume: 25, sbp: 80, dbp: 60, cvp: 16 }, note: [
    "Low output with elevated CVP can occur in pump failure or an obstruction. The calculated values cannot distinguish these causes. Assessment of tissue perfusion and clinical findings, with bedside echocardiography when indicated, helps identify the mechanism.",
    "قد يحدث انخفاض النتاج مع ارتفاع الضغط الوريدي المركزي في فشل المضخة أو الانسداد. لا تميّز الحسابات بينهما. يساعد تقييم التروية والفحص السريري والإيكو عند الحاجة في تحديد الآلية.",
  ] },
];

function Slider({ label, unit, value, min, max, step, onChange }: { label: string; unit: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  const id = `hemo-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="flex items-baseline justify-between text-sm font-semibold" lang="en" dir="ltr">
        <span>{label}</span><span className="tabular-nums text-primary">{value} {unit}</span>
      </label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-primary" aria-valuetext={`${value} ${unit}`} />
    </div>
  );
}

export function HemoLab({ locale }: { locale: string }) {
  const ar = locale === "ar";
  const [params, setParams] = useState<HemoInputs>(DEFAULTS);
  const [scenario, setScenario] = useState("normal");
  const result = useMemo(() => computeHemodynamics(params), [params]);

  function applyScenario(key: string) {
    setScenario(key);
    setParams(SCENARIOS.find((s) => s.key === key)!.params);
  }
  function update(patch: Partial<HemoInputs>) {
    setScenario("");
    setParams((p) => ({ ...p, ...patch }));
  }

  const activeNote = SCENARIOS.find((s) => s.key === scenario)?.note;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{ar ? "مختبر تفاعلي" : "INTERACTIVE LABORATORY"}</p>
        <h1 className="text-3xl font-bold">{ar ? "مختبر المراقبة الديناميكية الدموية" : "Hemodynamic monitoring laboratory"}</h1>
        <p className="text-muted-foreground">{ar ? "غيّر الإعدادات أو جرّب نمط صدمة، وشاهد كيف تتغير النتاج القلبي والضغط الشرياني المتوسط والمقاومة الوعائية." : "Change the settings or try a shock pattern, and watch how cardiac output, MAP and systemic vascular resistance respond."}</p>
      </header>

      <section aria-label={ar ? "الأنماط" : "Patterns"} className="flex flex-wrap gap-2">
        {SCENARIOS.map((s) => (
          <button key={s.key} onClick={() => applyScenario(s.key)} aria-pressed={scenario === s.key} className={`min-h-11 rounded-xl px-4 text-sm font-semibold ${scenario === s.key ? "bg-primary text-primary-foreground" : "border border-border bg-card hover:bg-muted"}`}>
            {s.label[ar ? 1 : 0]}
          </button>
        ))}
      </section>

      {activeNote ? <div role="status" className="rounded-2xl border border-border bg-muted/40 p-4 text-sm leading-6">{activeNote[ar ? 1 : 0]}</div> : null}

      <section aria-label={ar ? "الإعدادات" : "Settings"} className="grid gap-5 rounded-2xl border border-border bg-card p-5 sm:grid-cols-2">
        <Slider label="Heart rate" unit="/min" value={params.heartRate} min={30} max={180} step={1} onChange={(v) => update({ heartRate: v })} />
        <Slider label="Stroke volume" unit="mL" value={params.strokeVolume} min={10} max={120} step={1} onChange={(v) => update({ strokeVolume: v })} />
        <Slider label="Systolic BP" unit="mmHg" value={params.sbp} min={50} max={200} step={1} onChange={(v) => update({ sbp: v })} />
        <Slider label="Diastolic BP" unit="mmHg" value={params.dbp} min={20} max={130} step={1} onChange={(v) => update({ dbp: v })} />
        <Slider label="CVP" unit="mmHg" value={params.cvp} min={0} max={25} step={1} onChange={(v) => update({ cvp: v })} />
      </section>

      <section aria-label={ar ? "القراءات" : "Readouts"} className="grid grid-cols-2 gap-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-3">
        <div><p className="text-xs font-semibold uppercase text-muted-foreground">{ar ? "النتاج القلبي" : "Cardiac output"}</p><p className="text-xl font-bold tabular-nums">{result.cardiacOutput?.toFixed(2) ?? "—"} <span className="text-sm font-normal">L/min</span></p></div>
        <div><p className="text-xs font-semibold uppercase text-muted-foreground">{ar ? "الضغط الشرياني المتوسط التقديري" : "Estimated MAP"}</p><p className="text-xl font-bold tabular-nums">{result.map?.toFixed(1) ?? "—"} <span className="text-sm font-normal">mmHg</span></p></div>
        <div><p className="text-xs font-semibold uppercase text-muted-foreground">{ar ? "المقاومة الوعائية" : "SVR"}</p><p className="text-xl font-bold tabular-nums">{result.svr?.toFixed(0) ?? "—"} <span className="text-sm font-normal">dyn·s/cm⁵</span></p></div>
      </section>

      {result.map === null ? (
        <p role="alert">{ar ? "يجب أن يتجاوز الضغط الانقباضي الضغط الانبساطي في هذا المثال." : "Systolic pressure must exceed diastolic pressure in this example."}</p>
      ) : result.svr === null ? (
        <p role="alert">{ar ? "يتطلب حساب المقاومة نتاجاً قلبياً موجباً وضغطاً شريانياً متوسطاً أعلى من الضغط الوريدي المركزي." : "SVR requires positive cardiac output and an estimated MAP above CVP."}</p>
      ) : null}

      <section aria-labelledby="hemo-lab-evidence" className="space-y-2 text-sm text-muted-foreground">
        <h2 id="hemo-lab-evidence" className="text-sm font-semibold text-foreground">{ar ? "حالة المراجعة" : "Review status"}</h2>
        <p>{ar ? "يُحسب النتاج القلبي باللتر في الدقيقة بقسمة حاصل ضرب معدل القلب وحجم الضربة على 1000. الضغط المتوسط تقديري وقد تقل دقته عند تسرّع القلب أو اضطراب النظم. المقاومة الوعائية = 80 × (الضغط المتوسط التقديري − الضغط الوريدي المركزي) ÷ النتاج القلبي. الأمثلة تعليمية ولم تخضع لمراجعة سريرية رسمية." : "Cardiac output in L/min is heart rate × stroke volume in mL ÷ 1,000. MAP is estimated as diastolic pressure plus one third of pulse pressure. This approximation can be less accurate with tachycardia or irregular rhythms. SVR = 80 × (estimated MAP − CVP) ÷ cardiac output. The presets are teaching examples and have not had a formal clinical review."}</p>
        <a className="underline" href="https://www.esicm.org/esicm-guideline-circulatory-shock-haemodynamic-monitoring/">{ar ? "إرشادات ESICM لعام 2025" : "ESICM 2025 shock and monitoring guideline"}</a>
      </section>
    </div>
  );
}
