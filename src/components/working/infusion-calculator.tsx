"use client";

import { useState } from "react";

export function InfusionCalculator({ locale }: { locale: string }) {
  const ar = locale === "ar";
  const [mode, setMode] = useState<"rate" | "time">("rate");
  const [volume, setVolume] = useState("");
  const [quantity, setQuantity] = useState("");
  const [minutes, setMinutes] = useState(false);
  const isRate = mode === "rate";
  const input = Number(quantity);
  const volumeMl = Number(volume);
  const rawResult = volumeMl / (isRate && minutes ? input / 60 : input);
  const valid = volumeMl > 0 && input > 0 && Number.isFinite(rawResult) && rawResult > 0;
  const format = new Intl.NumberFormat(locale, { maximumSignificantDigits: 6 });
  const hours = isRate ? (minutes ? input / 60 : input) : rawResult;
  const rate = isRate ? rawResult : input;
  const field = "min-h-11 w-full rounded-lg border border-border bg-background px-3";

  return (
    <section id="calculator" aria-labelledby="infusion-calculator-title" className="scroll-mt-24 space-y-4 rounded-2xl border border-border bg-card p-5">
      <h2 id="infusion-calculator-title" className="text-xl font-bold">{ar ? "حاسبة مضخة التسريب" : "Infusion pump calculator"}</h2>
      <p className="text-sm text-muted-foreground">{ar ? "للتدريب على حساب معدل التسريب أو مدته باستخدام حجم سائل معلوم." : "Practise calculating a volumetric infusion rate or duration from a known fluid volume."}</p>
      <label className="block space-y-1 text-sm font-semibold">
        <span>{ar ? "احسب" : "Calculate"}</span>
        <select className={field} value={mode} onChange={(event) => {
          setMode(event.target.value === "time" ? "time" : "rate");
          setQuantity("");
        }}>
          <option value="rate">{ar ? "معدل التسريب" : "Infusion rate"}</option>
          <option value="time">{ar ? "مدة التسريب" : "Infusion duration"}</option>
        </select>
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm font-semibold">
          <span>{ar ? "الحجم (مل)" : "Volume (mL)"}</span>
          <input className={field} type="number" min="0" step="any" inputMode="decimal" value={volume} onChange={(event) => setVolume(event.target.value)} />
        </label>
        <label className="space-y-1 text-sm font-semibold">
          <span>{isRate ? (ar ? "المدة" : "Duration") : (ar ? "المعدل (مل/ساعة)" : "Rate (mL/h)")}</span>
          <input className={field} type="number" min="0" step="any" inputMode="decimal" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
        </label>
      </div>
      {isRate && (
        <label className="block space-y-1 text-sm font-semibold">
          <span>{ar ? "وحدة المدة" : "Duration unit"}</span>
          <select className={field} value={minutes ? "minutes" : "hours"} onChange={(event) => setMinutes(event.target.value === "minutes")}>
            <option value="hours">{ar ? "ساعات" : "Hours"}</option>
            <option value="minutes">{ar ? "دقائق" : "Minutes"}</option>
          </select>
        </label>
      )}
      <output className="block space-y-1 rounded-lg bg-muted p-4" aria-live="polite">
        {valid ? (
          <>
            <strong className="block text-xl tabular-nums" dir="ltr">{format.format(rawResult)} {isRate ? (ar ? "مل/ساعة" : "mL/h") : (ar ? "ساعة" : "h")}</strong>
            <span className="block text-sm text-muted-foreground" dir="ltr">
              {format.format(volumeMl)} {ar ? "مل" : "mL"} ÷ {format.format(isRate ? hours : rate)} {isRate ? (ar ? "ساعة" : "h") : (ar ? "مل/ساعة" : "mL/h")}
            </span>
          </>
        ) : (
          <span className="text-sm text-muted-foreground">{ar ? "أدخل قيمتين موجبتين لإظهار الناتج." : "Enter two positive values to see the result."}</span>
        )}
      </output>
      <a className="text-sm text-primary underline" href="https://www.ncbi.nlm.nih.gov/books/NBK596732/">{ar ? "مرجع حسابات التسريب من Open RN" : "Open RN · Infusion calculation reference"}</a>
      <DoseRatePractice locale={locale} fieldClassName={field} />
    </section>
  );
}

function DoseRatePractice({ locale, fieldClassName }: { locale: string; fieldClassName: string }) {
  const ar = locale === "ar";
  const [basis, setBasis] = useState("dose");
  const [dose, setDose] = useState("");
  const [weight, setWeight] = useState("");
  const [concentration, setConcentration] = useState("");
  const [doseUnit, setDoseUnit] = useState("mg/h");
  const [concentrationUnit, setConcentrationUnit] = useState("mg/mL");
  const weightBased = basis === "weight";
  const perMinute = doseUnit === "mcg/min";
  const massFactor = perMinute ? 0.001 : 1;
  const minutesPerHour = perMinute ? 60 : 1;
  const doseMgPerHour = Number(dose) * (weightBased ? Number(weight) : 1) * massFactor * minutesPerHour;
  const mgPerMl = Number(concentration) * (concentrationUnit === "mcg/mL" ? 0.001 : 1);
  const rate = doseMgPerHour / mgPerMl;
  const valid = Number(dose) > 0 && Number(concentration) > 0 && (!weightBased || Number(weight) > 0) &&
    Number.isFinite(rate) && rate > 0;
  const format = new Intl.NumberFormat(locale, { maximumSignificantDigits: 6 });
  const currentDoseUnit = perMinute ? "mcg/min" : "mg/h";
  const weightDoseUnit = perMinute ? "mcg/kg/min" : "mg/kg/h";
  const labelClass = "block min-w-0 space-y-1 text-sm font-semibold";

  return (
    <details className="rounded-xl border border-border p-4">
      <summary className="flex min-h-11 cursor-pointer items-center font-semibold">
        {ar ? "تدريب حساب المعدل من الجرعة والتركيز" : "Practise calculating rate from dose and concentration"}
      </summary>
      <div className="space-y-3 pt-2">
        <p className="text-sm text-muted-foreground">
          {ar ? "للتدريب باستخدام قيم افتراضية فقط. استخدم نظام مؤسستك المعتمد لإعداد مضخة المريض." : "Use fictional values for practice. Use your institution’s approved tools and checks for patient pump programming."}
        </p>
        <label className={labelClass}>
          <span>{ar ? "طريقة الجرعة" : "Dose basis"}</span>
          <select className={fieldClassName} value={basis} onChange={(event) => {
            setBasis(event.target.value);
            setDose("");
            setWeight("");
          }}>
            <option value="dose">{ar ? "جرعة ثابتة" : "Fixed dose rate"}</option>
            <option value="weight">{ar ? "جرعة حسب الوزن" : "Weight-based dose rate"}</option>
          </select>
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={labelClass}>
            <span>{ar ? "معدل الجرعة" : "Dose rate"}</span>
            <input className={fieldClassName} type="number" min="0" step="any" inputMode="decimal" value={dose} onChange={(event) => setDose(event.target.value)} />
          </label>
          <label className={labelClass}>
            <span>{ar ? "وحدة الجرعة" : "Dose unit"}</span>
            <select className={fieldClassName} value={doseUnit} onChange={(event) => { setDoseUnit(event.target.value); setDose(""); }}>
              <option value="mg/h">{weightBased ? "mg/kg/h" : "mg/h"}</option>
              <option value="mcg/min">{weightBased ? "mcg/kg/min" : "mcg/min"}</option>
            </select>
          </label>
          {weightBased && (
            <label className={labelClass}>
              <span>{ar ? "الوزن الافتراضي (كغ)" : "Example weight (kg)"}</span>
              <input className={fieldClassName} type="number" min="0" step="any" inputMode="decimal" value={weight} onChange={(event) => setWeight(event.target.value)} />
            </label>
          )}
          <label className={labelClass}>
            <span>{ar ? "تركيز المحلول" : "Solution concentration"}</span>
            <input className={fieldClassName} type="number" min="0" step="any" inputMode="decimal" value={concentration} onChange={(event) => setConcentration(event.target.value)} />
          </label>
          <label className={labelClass}>
            <span>{ar ? "وحدة التركيز" : "Concentration unit"}</span>
            <select className={fieldClassName} value={concentrationUnit} onChange={(event) => { setConcentrationUnit(event.target.value); setConcentration(""); }}>
              <option value="mg/mL">mg/mL</option>
              <option value="mcg/mL">mcg/mL</option>
            </select>
          </label>
        </div>
        <output className="block space-y-1 rounded-lg bg-muted p-3 text-sm" aria-live="polite">
          {valid ? (
            <>
              <strong className="block text-lg" dir="ltr">{format.format(rate)} mL/h</strong>
              {weightBased && <span className="block" dir="ltr">{format.format(Number(dose))} {weightDoseUnit} × {format.format(Number(weight))} kg = {format.format(Number(dose) * Number(weight))} {currentDoseUnit}</span>}
              {perMinute && <span className="block" dir="ltr">{format.format(Number(dose) * (weightBased ? Number(weight) : 1))} mcg/min × 60 min/h ÷ 1,000 mcg/mg = {format.format(doseMgPerHour)} mg/h</span>}
              {concentrationUnit === "mcg/mL" && <span className="block" dir="ltr">{format.format(Number(concentration))} mcg/mL ÷ 1,000 mcg/mg = {format.format(mgPerMl)} mg/mL</span>}
              <span className="block" dir="ltr">{format.format(doseMgPerHour)} mg/h ÷ {format.format(mgPerMl)} mg/mL = {format.format(rate)} mL/h</span>
            </>
          ) : <span>{ar ? "أدخل قيمًا موجبة للحصول على الناتج." : "Enter positive values in all fields to see the result."}</span>}
        </output>
        <p className="text-sm font-semibold">{ar ? "أمثلة افتراضية محلولة" : "Worked examples with fictional values"}</p>
        <ul dir="ltr" className="space-y-1 text-sm text-muted-foreground">
          <li>6 mg/h ÷ 2 mg/mL = 3 mL/h</li>
          <li>0.2 mcg/kg/min × 50 kg = 10 mcg/min</li>
          <li>10 mcg/min × 60 min/h = 600 mcg/h</li>
          <li>600 mcg/h ÷ 100 mcg/mL = 6 mL/h</li>
        </ul>
      </div>
    </details>
  );
}
