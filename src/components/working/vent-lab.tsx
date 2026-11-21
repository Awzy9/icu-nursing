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
    "In this simplified disconnected-circuit scenario, delivered volume and pressure rise are severely reduced and a simulated low-pressure alert appears. Assess the patient and adequacy of ventilation immediately, summon help if unstable, then inspect the airway and circuit using your unit's procedure. A real ventilator's alarm behaviour varies.",
    "في سيناريو انفصال الدائرة المبسّط، ينخفض الحجم المُسلّم وارتفاع الضغط بشدة ويظهر إنذار انخفاض ضغط افتراضي. قيّم المريض وفعالية التهوية فوراً، واطلب المساعدة إذا كان غير مستقر، ثم افحص مجرى الهواء والدائرة وفق إجراءات وحدتك. تختلف استجابة الإنذارات بين أجهزة التنفس الحقيقية.",
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
  const result = useMemo(() => simulateVentCycle(params), [params]);

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

      <section aria-label={ar ? "القراءات" : "Readouts"} className="grid grid-cols-2 gap-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-4">
        <div><p className="text-xs font-semibold uppercase text-muted-foreground">{ar ? "ذروة" : "Peak"}</p><p className="text-xl font-bold tabular-nums">{result.peakPressure} <span className="text-sm font-normal">cmH2O</span></p></div>
        <div><p className="text-xs font-semibold uppercase text-muted-foreground">{ar ? "هضبة" : "Plateau"}</p><p className="text-xl font-bold tabular-nums">{result.plateauPressure} <span className="text-sm font-normal">cmH2O</span></p></div>
        <div><p className="text-xs font-semibold uppercase text-muted-foreground">{ar ? "الفرق" : "Peak − plateau"}</p><p className="text-xl font-bold tabular-nums">{Math.round((result.peakPressure - result.plateauPressure) * 10) / 10}</p></div>
        <div><p className="text-xs font-semibold uppercase text-muted-foreground">{ar ? "الثابت الزمني" : "Time constant (τ)"}</p><p className="text-xl font-bold tabular-nums">{result.timeConstant} <span className="text-sm font-normal">s</span></p></div>
      </section>

      {(result.highPressureAlarm || result.lowPressureAlarm) ? (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border-2 border-danger-foreground/60 bg-danger p-4 text-danger-foreground">
          <AlertTriangle aria-hidden className="mt-0.5 size-5 shrink-0" />
          <div className="space-y-1 text-sm leading-6">
            {result.highPressureAlarm ? <p className="font-semibold">{ar ? "إنذار ضغط مرتفع (محاكاة فقط): تم بلوغ حدّ تعليمي افتراضي قدره 40 سم ماء، وليس إعداد إنذار سريرياً." : "High-pressure alarm (simulation only): the invented 40 cmH₂O teaching trigger was reached; this is NOT a clinical alarm setting."}</p> : null}
            {result.lowPressureAlarm ? <p className="font-semibold">{ar ? "إنذار ضغط منخفض (محاكاة فقط): قيّم المريض والتهوية أولاً، ثم افحص مجرى الهواء والدائرة بحثاً عن انفصال أو تسرب كبير." : "Low-pressure alarm (simulation only): assess the patient and ventilation first, then check the airway and circuit for disconnection or a major leak."}</p> : null}
          </div>
        </div>
      ) : null}

      <section aria-label={ar ? "المنحنيات" : "Traces"} className="space-y-3 rounded-2xl border border-border bg-card p-5">
        <WaveformChart trace={result.pressure} locale={locale} />
        <WaveformChart trace={result.flow} locale={locale} />
        <WaveformChart trace={result.volume} locale={locale} />
      </section>

      <section aria-labelledby="vent-lab-evidence" className="space-y-2 text-sm text-muted-foreground">
        <h2 id="vent-lab-evidence" className="text-sm font-semibold text-foreground">{ar ? "حالة المراجعة" : "Review status"}</h2>
        <p>{ar ? "نموذج تعليمي مبسّط لمعادلة الحركة التنفسية القياسية (الضغط = PEEP + الحجم/الامتثال + المقاومة × التدفق)، وليس محاكاة جهاز معتمدة. لم تخضع هذه المادة بعد لمراجعة سريرية رسمية." : "A simplified teaching model of the standard respiratory equation of motion (Pressure = PEEP + Volume/Compliance + Resistance × Flow), not a validated device simulator. This material has not yet had a formal clinical review. The displayed alarm triggers are fictional for teaching; no threshold or machine behaviour should be copied into clinical settings."}</p>
      </section>
    </div>
  );
}
