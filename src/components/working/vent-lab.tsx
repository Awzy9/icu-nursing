"use client";
import { useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { simulateVentCycle, type VentParams } from "@/lib/working/vent-model";
import { WaveformChart } from "./waveform-chart";

const DEFAULTS: VentParams = { tidalVolume: 450, respRate: 14, peep: 5, inspiratoryTime: 1, compliance: 50, resistance: 10 };

const SCENARIOS: { key: string; label: [string, string]; params: Partial<VentParams>; note: [string, string] }[] = [
  { key: "normal", label: ["Normal mechanics", "ميكانيكا طبيعية"], params: {}, note: [
    "Typical compliance and resistance - peak and plateau pressure are both unremarkable.",
    "امتثال ومقاومة طبيعيان - ضغط الذروة والهضبة كلاهما ضمن الحدود الطبيعية.",
  ] },
  { key: "stiff", label: ["Stiff lungs (low compliance)", "رئتان متيبستان (امتثال منخفض)"], params: { compliance: 15, resistance: 14 }, note: [
    "Low compliance raises BOTH peak and plateau pressure together - think ARDS, pulmonary oedema, or a large pleural effusion. Escalate if the high-pressure alarm persists.",
    "الامتثال المنخفض يرفع ضغط الذروة والهضبة معاً - فكّر في ARDS أو الوذمة الرئوية أو الانصباب الجنبي الكبير. صعّد الحالة إذا استمر إنذار الضغط المرتفع.",
  ] },
  { key: "obstructed", label: ["High airway resistance", "مقاومة مجرى هوائي مرتفعة"], params: { resistance: 32, compliance: 45 }, note: [
    "High resistance raises peak pressure much more than plateau pressure - a wide peak-minus-plateau gap points to the airway/circuit (secretions, bronchospasm, a kinked tube), not the lung tissue itself.",
    "المقاومة المرتفعة ترفع ضغط الذروة أكثر بكثير من الهضبة - الفرق الكبير بينهما يشير إلى مجرى الهواء أو الدائرة (إفرازات، تشنج قصبي، أنبوب منحني)، وليس نسيج الرئة نفسه.",
  ] },
  { key: "disconnect", label: ["Circuit disconnect", "انفصال الدائرة"], params: { circuitDisconnected: true }, note: [
    "This preset represents complete loss of ventilator support at the patient airway. Alarm type and timing vary by device. Assess the patient first, call for help if ventilation is compromised, and check the circuit. If ventilation cannot be restored promptly, follow the local emergency ventilation protocol.",
    "يمثّل هذا المثال فقدان دعم جهاز التنفس عند مجرى هواء المريض. يختلف نوع الإنذار وتوقيته حسب الجهاز. قيّم المريض أولاً، واطلب المساعدة إذا كانت التهوية غير كافية، وتحقق من الدائرة. إذا لم تعد التهوية سريعاً، فاتبع بروتوكول التهوية الطارئة المحلي.",
  ] },
];

function Slider({ label, unit, value, min, max, step, onChange }: { label: string; unit: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  const id = `vent-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="flex items-baseline justify-between text-sm font-semibold" lang="en" dir="ltr">
        <span>{label}</span><span className="tabular-nums text-primary">{value} {unit}</span>
      </label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-primary" aria-valuetext={`${value} ${unit}`} />
    </div>
  );
}

export function VentLab({ locale }: { locale: string }) {
  const ar = locale === "ar";
  const [params, setParams] = useState<VentParams>(DEFAULTS);
  const [scenario, setScenario] = useState("normal");
  const result = useMemo(() => params.inspiratoryTime < 60 / params.respRate ? simulateVentCycle(params) : null, [params]);

  function applyScenario(key: string) {
    const s = SCENARIOS.find((s) => s.key === key)!;
    setScenario(key);
    setParams({ ...DEFAULTS, ...s.params });
  }
  function update(patch: Partial<VentParams>) {
    setScenario("");
    setParams((p) => ({ ...p, ...patch }));
  }

  const activeNote = SCENARIOS.find((s) => s.key === scenario)?.note;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{ar ? "مختبر تفاعلي" : "INTERACTIVE LABORATORY"}</p>
        <h1 className="text-3xl font-bold">{ar ? "لوحة ضبط جهاز التنفس الصناعي" : "Ventilator parameter panel"}</h1>
        <p className="text-muted-foreground">{ar ? "غيّر الإعدادات أو جرّب سيناريو، وشاهد كيف يتغير منحنى الضغط والتدفق والحجم." : "Change the settings or try a scenario, and watch how the pressure, flow and volume traces respond."}</p>
      </header>

      <section aria-label={ar ? "سيناريوهات" : "Scenarios"} className="flex flex-wrap gap-2">
        {SCENARIOS.map((s) => (
          <button key={s.key} onClick={() => applyScenario(s.key)} aria-pressed={scenario === s.key} className={`min-h-11 rounded-xl px-4 text-sm font-semibold ${scenario === s.key ? "bg-primary text-primary-foreground" : "border border-border bg-card hover:bg-muted"}`}>
            {s.label[ar ? 1 : 0]}
          </button>
        ))}
      </section>

      {activeNote ? (
        <div role="status" className="rounded-2xl border border-border bg-muted/40 p-4 text-sm leading-6">{activeNote[ar ? 1 : 0]}</div>
      ) : null}

      <section aria-label={ar ? "الإعدادات" : "Settings"} className="grid gap-5 rounded-2xl border border-border bg-card p-5 sm:grid-cols-2">
        <Slider label="Tidal volume" unit="mL" value={params.tidalVolume} min={200} max={600} step={10} onChange={(v) => update({ tidalVolume: v })} />
        <Slider label="Respiratory rate" unit="/min" value={params.respRate} min={8} max={30} step={1} onChange={(v) => update({ respRate: v })} />
        <Slider label="PEEP" unit="cmH2O" value={params.peep} min={0} max={15} step={1} onChange={(v) => update({ peep: v })} />
        <Slider label="Inspiratory time" unit="s" value={params.inspiratoryTime} min={0.6} max={2} step={0.1} onChange={(v) => update({ inspiratoryTime: v })} />
        <Slider label="Compliance" unit="mL/cmH2O" value={params.compliance} min={15} max={80} step={1} onChange={(v) => update({ compliance: v })} />
        <Slider label="Airway resistance" unit="cmH2O/(L/s)" value={params.resistance} min={5} max={35} step={1} onChange={(v) => update({ resistance: v })} />
      </section>

      {result ? <>
      <section aria-label={ar ? "القراءات" : "Readouts"} className="grid grid-cols-2 gap-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-4">
        <div><p className="text-xs font-semibold uppercase text-muted-foreground">{ar ? "ذروة" : "Peak"}</p><p className="text-xl font-bold tabular-nums">{result.peakPressure} <span className="text-sm font-normal">cmH2O</span></p></div>
        <div><p className="text-xs font-semibold uppercase text-muted-foreground">{ar ? "هضبة" : "Estimated plateau"}</p><p className="text-xl font-bold tabular-nums">{params.circuitDisconnected ? "—" : `${result.plateauPressure} cmH2O`}</p></div>
        <div><p className="text-xs font-semibold uppercase text-muted-foreground">{ar ? "الفرق" : "Peak − plateau"}</p><p className="text-xl font-bold tabular-nums">{params.circuitDisconnected ? "—" : Math.round((result.peakPressure - result.plateauPressure) * 10) / 10}</p></div>
        <div><p className="text-xs font-semibold uppercase text-muted-foreground">{ar ? "الثابت الزمني" : "Time constant (τ)"}</p><p className="text-xl font-bold tabular-nums">{result.timeConstant} <span className="text-sm font-normal">s</span></p></div>
      </section>

      {(result.highPressureAlarm || result.lowPressureAlarm) ? (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border-2 border-danger-foreground/60 bg-danger p-4 text-danger-foreground">
          <AlertTriangle aria-hidden className="mt-0.5 size-5 shrink-0" />
          <div className="space-y-1 text-sm leading-6">
            {result.highPressureAlarm ? <p className="font-semibold">{ar ? "إنذار ضغط مرتفع: بلغ ضغط الذروة الحدّ التوضيحي لهذا النموذج (40 سم ماء)." : "High-pressure alarm: peak pressure reached this model’s example limit of 40 cmH2O."}</p> : null}
            {result.lowPressureAlarm ? <p className="font-semibold">{ar ? "إنذار ضغط منخفض: قيّم المريض أولاً، ثم تحقق من انفصال الدائرة أو وجود تسرب كبير." : "Low-pressure alarm: assess the patient first, then check for a circuit disconnect or major leak."}</p> : null}
          </div>
        </div>
      ) : null}

      <p className="text-sm text-muted-foreground">{ar ? "زمن الزفير" : "Expiratory time"}: {result.expiratoryTime.toFixed(2)} s</p>
      <section aria-label={ar ? "المنحنيات" : "Traces"} className="space-y-3 rounded-2xl border border-border bg-card p-5">
        <WaveformChart trace={result.pressure} locale={locale} />
        <WaveformChart trace={result.flow} locale={locale} />
        <WaveformChart trace={result.volume} locale={locale} />
      </section>

      </> : <p role="alert" className="rounded-xl border border-border p-4">
        {ar ? "لا يتبقى وقت للزفير. قلّل زمن الشهيق أو معدل التنفس في هذا المثال." : "These settings leave no time for exhalation. Shorten inspiratory time or lower the respiratory rate in this example."}
      </p>}

      <section aria-labelledby="vent-lab-evidence" className="space-y-2 text-sm text-muted-foreground">
        <h2 id="vent-lab-evidence" className="text-sm font-semibold text-foreground">{ar ? "حالة المراجعة" : "Review status"}</h2>
        <p>{ar ? "نموذج تعليمي مبسّط لمعادلة الحركة التنفسية القياسية (الضغط = PEEP + الحجم/الامتثال + المقاومة × التدفق)، وليس محاكاة جهاز معتمدة. يعرض النموذج نفَساً سلبياً واحداً. ضغط الهضبة معروض كتقدير ويُقاس سريرياً أثناء وقفة شهيقية دون تدفق في الظروف المناسبة. استمرار التدفق في نهاية الزفير يشير إلى عدم اكتمال الزفير. لا يحسب النموذج الضغط الإيجابي الذاتي المتراكم ولا يحاكي إيقاف الشهيق عند حد الضغط. لم تخضع هذه المادة بعد لمراجعة سريرية رسمية." : "A simplified teaching model of the standard respiratory equation of motion (Pressure = PEEP + Volume/Compliance + Resistance × Flow), not a validated device simulator. The model shows a single passive breath. Plateau is estimated. At the bedside it is measured during a zero-flow inspiratory hold under suitable conditions. Persistent end-expiratory flow suggests incomplete emptying. The model does not calculate accumulated intrinsic PEEP or simulate a device pressure cutoff. This material has not yet had a formal clinical review."}</p>
      </section>
    </div>
  );
}
