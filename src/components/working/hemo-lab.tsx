"use client";
import { useMemo, useState } from "react";
import { computeHemodynamics, classifyHemoPattern, type HemoInputs, type HemoPattern } from "@/lib/working/hemodynamics";

const DEFAULTS: HemoInputs = { heartRate: 75, strokeVolume: 85, sbp: 120, dbp: 80, cvp: 5 };

const SCENARIOS: { key: string; label: [string, string]; params: HemoInputs; note: [string, string] }[] = [
  { key: "normal", label: ["Normal", "طبيعي"], params: DEFAULTS, note: [
    "All four values sit within their normal bands.",
    "تقع القيم الأربع كلها ضمن حدودها الطبيعية.",
  ] },
  { key: "distributive", label: ["Septic (distributive) shock", "صدمة إنتانية (توزيعية)"], params: { heartRate: 120, strokeVolume: 55, sbp: 85, dbp: 45, cvp: 4 }, note: [
    "Low SVR from vasodilation is the hallmark - the vessels, not the heart or the volume, are the primary problem. Compensatory tachycardia tries to maintain cardiac output despite a falling MAP.",
    "انخفاض المقاومة الوعائية الناتج عن توسع الأوعية هو السمة المميزة - المشكلة الأساسية في الأوعية وليس القلب أو الحجم. تسرع القلب التعويضي يحاول الحفاظ على النتاج القلبي رغم انخفاض الضغط الشرياني المتوسط.",
  ] },
  { key: "hypovolemic", label: ["Hypovolemic shock", "صدمة نقص حجم الدم"], params: { heartRate: 125, strokeVolume: 30, sbp: 80, dbp: 55, cvp: 1 }, note: [
    "Low CVP (low preload) and low stroke volume reflect too little circulating volume; the compensatory response is tachycardia plus vasoconstriction (high SVR) to defend MAP.",
    "انخفاض الضغط الوريدي المركزي (انخفاض الحمل القبلي) وانخفاض حجم الضربة يعكسان نقصاً في الحجم الدوراني؛ الاستجابة التعويضية هي تسرع القلب مع تضيق وعائي (مقاومة مرتفعة) للحفاظ على الضغط الشرياني المتوسط.",
  ] },
  { key: "cardiogenic", label: ["Cardiogenic or obstructive shock", "صدمة قلبية أو انسدادية"], params: { heartRate: 110, strokeVolume: 25, sbp: 80, dbp: 60, cvp: 16 }, note: [
    "Low cardiac output WITH a high CVP (backward congestion) fits both a failing pump (cardiogenic) and a mechanical obstruction to filling or outflow such as tamponade or tension pneumothorax (obstructive) - these two cannot be told apart from these four numbers alone. Heart sounds, pulsus paradoxus, tracheal position and echo findings are needed to distinguish them.",
    "انخفاض النتاج القلبي مع ارتفاع الضغط الوريدي المركزي (احتقان خلفي) يتوافق مع كل من فشل المضخة (قلبية) والانسداد الميكانيكي للامتلاء أو التدفق مثل اندحاس القلب أو استرواح الصدر الضاغط (انسدادية) - لا يمكن التمييز بينهما من هذه الأرقام الأربعة وحدها. تحتاج إلى أصوات القلب والنبض المتناقض ووضع القصبة الهوائية ونتائج الإيكو للتمييز بينهما.",
  ] },
];

const PATTERN_LABEL: Record<HemoPattern, [string, string]> = {
  normal: ["Normal", "طبيعي"],
  distributive: ["Distributive pattern (low SVR)", "نمط توزيعي (مقاومة منخفضة)"],
  hypovolemic: ["Hypovolemic pattern (low preload + low CO)", "نمط نقص حجم الدم (حمل قبلي منخفض ونتاج منخفض)"],
  cardiogenic_or_obstructive: ["Cardiogenic or obstructive pattern - cannot distinguish from these numbers alone", "نمط قلبي أو انسدادي - لا يمكن تمييزه من هذه الأرقام وحدها"],
  indeterminate: ["Does not fit a single classic pattern", "لا يطابق نمطاً كلاسيكياً واحداً"],
};

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
  const pattern = useMemo(() => classifyHemoPattern(result, params.cvp), [result, params.cvp]);

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
        <div><p className="text-xs font-semibold uppercase text-muted-foreground">{ar ? "النتاج القلبي" : "Cardiac output"}</p><p className="text-xl font-bold tabular-nums">{result.cardiacOutput ?? "—"} <span className="text-sm font-normal">L/min</span></p></div>
        <div><p className="text-xs font-semibold uppercase text-muted-foreground">{ar ? "الضغط الشرياني المتوسط" : "MAP"}</p><p className="text-xl font-bold tabular-nums">{result.map} <span className="text-sm font-normal">mmHg</span></p></div>
        <div><p className="text-xs font-semibold uppercase text-muted-foreground">{ar ? "المقاومة الوعائية" : "SVR"}</p><p className="text-xl font-bold tabular-nums">{result.svr ?? "—"} <span className="text-sm font-normal">dyn·s/cm⁵</span></p></div>
      </section>

      <div role="status" className="rounded-2xl border-2 border-primary bg-card p-4 text-sm font-semibold leading-6" lang="en" dir="ltr">
        {PATTERN_LABEL[pattern][ar ? 1 : 0]}
      </div>

      <section aria-labelledby="hemo-lab-evidence" className="space-y-2 text-sm text-muted-foreground">
        <h2 id="hemo-lab-evidence" className="text-sm font-semibold text-foreground">{ar ? "حالة المراجعة" : "Review status"}</h2>
        <p>{ar ? "نموذج تعليمي مبسّط للصيغ الديناميكية الدموية القياسية (النتاج القلبي = معدل القلب × حجم الضربة؛ الضغط الشرياني المتوسط؛ المقاومة = 80×(الضغط المتوسط−الضغط الوريدي المركزي)/النتاج)، وليس أداة تشخيص. لم تخضع هذه المادة بعد لمراجعة سريرية رسمية." : "A simplified teaching model of the standard hemodynamic formulas (CO = HR × SV; MAP; SVR = 80×(MAP−CVP)/CO), not a diagnostic tool. This material has not yet had a formal clinical review."}</p>
      </section>
    </div>
  );
}
