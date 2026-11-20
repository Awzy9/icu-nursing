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
    </section>
  );
}
