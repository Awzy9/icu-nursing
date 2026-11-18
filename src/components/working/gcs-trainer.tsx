"use client";
import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useLearning } from "./progress";
import { EYE_OPTIONS, VERBAL_OPTIONS, MOTOR_OPTIONS, gcsTotal, gcsSeverity, type GcsOption } from "@/lib/working/gcs";
import type { GcsCase } from "@/lib/working/gcs-case";

const SEVERITY_LABEL: Record<string, [string, string]> = {
  severe: ["Severe (≤8)", "شديد (≤8)"],
  moderate: ["Moderate (9–12)", "متوسط (9–12)"],
  mild: ["Mild (13–15)", "خفيف (13–15)"],
};

function Picker({ title, options, value, onChange, disabled, locale }: { title: string; options: GcsOption[]; value: number | null; onChange: (v: number) => void; disabled: boolean; locale: string }) {
  const ar = locale === "ar";
  return (
    <fieldset disabled={disabled} className="space-y-2">
      <legend className="text-sm font-semibold" lang="en" dir="ltr">{title}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button key={o.score} type="button" onClick={() => onChange(o.score)} aria-pressed={value === o.score}
            className={`min-h-11 rounded-xl border px-3 text-sm font-medium ${value === o.score ? "border-primary bg-primary/10 text-primary" : "border-border bg-background hover:bg-muted"}`}>
            {o.label[ar ? 1 : 0]} <span className="tabular-nums text-muted-foreground">({o.score})</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function GcsTrainer({ locale, gcsCase }: { locale: string; gcsCase?: GcsCase }) {
  const ar = locale === "ar";
  const { saveAnswer } = useLearning();
  const [eye, setEye] = useState<number | null>(null);
  const [verbal, setVerbal] = useState<number | null>(null);
  const [motor, setMotor] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);

  const complete = eye !== null && verbal !== null && motor !== null;
  const total = complete ? gcsTotal(eye!, verbal!, motor!) : null;

  function check() {
    if (!complete || !gcsCase) return;
    setChecked(true);
    const correct = eye === gcsCase.correctEye && verbal === gcsCase.correctVerbal && motor === gcsCase.correctMotor;
    saveAnswer({ id: gcsCase.key, title: "GCS case", href: `/gcs/${gcsCase.key}`, correct, at: Date.now() });
  }

  const showAnswerKey = checked && gcsCase;
  const allCorrect = showAnswerKey && eye === gcsCase!.correctEye && verbal === gcsCase!.correctVerbal && motor === gcsCase!.correctMotor;

  return (
    <div className="space-y-6">
      {gcsCase ? (
        <section aria-label={ar ? "الموقف السريري" : "Clinical situation"} className="rounded-2xl border border-border bg-card p-5">
          <p className="leading-7" lang="en" dir="ltr">{gcsCase.vignette}</p>
        </section>
      ) : null}

      <section aria-label={ar ? "تسجيل جلاسكو" : "Glasgow Coma Scale scoring"} className="space-y-5 rounded-2xl border border-border bg-card p-5 sm:p-8">
        <Picker title="Eye opening" options={EYE_OPTIONS} value={eye} onChange={setEye} disabled={checked} locale={locale} />
        <Picker title="Verbal response" options={VERBAL_OPTIONS} value={verbal} onChange={setVerbal} disabled={checked} locale={locale} />
        <Picker title="Motor response" options={MOTOR_OPTIONS} value={motor} onChange={setMotor} disabled={checked} locale={locale} />

        <div role="status" className="rounded-xl bg-muted/40 p-4" lang="en" dir="ltr">
          {complete ? (
            <p className="font-semibold">{ar ? "المجموع: " : "Total: "}<span className="tabular-nums">{total}</span> / 15 — {SEVERITY_LABEL[gcsSeverity(total!)]![ar ? 1 : 0]}</p>
          ) : (
            <p className="text-sm text-muted-foreground">{ar ? "اختر استجابة واحدة لكل فئة لرؤية المجموع." : "Select one response in each category to see the total."}</p>
          )}
        </div>

        {gcsCase ? (
          <>
            {showAnswerKey ? (
              <div role="status" className="space-y-3 rounded-xl bg-muted p-5" lang="en" dir="ltr">
                <h3 className="flex items-center gap-2 font-bold">
                  {allCorrect ? <CheckCircle2 className="size-5" aria-hidden /> : <XCircle className="size-5" aria-hidden />}
                  {allCorrect ? (ar ? "تسجيل صحيح" : "Correct scoring") : (ar ? "لنراجع هذا السجل" : "Let's review this scoring")}
                </h3>
                <p className="leading-7">{gcsCase.explanation}</p>
                <p className="text-sm font-semibold">{ar ? `الإجابة الصحيحة: العين ${gcsCase.correctEye}، اللفظي ${gcsCase.correctVerbal}، الحركي ${gcsCase.correctMotor}` : `Correct: Eye ${gcsCase.correctEye}, Verbal ${gcsCase.correctVerbal}, Motor ${gcsCase.correctMotor}`}</p>
                <Link href="/working/D03-T01" className="inline-block text-sm font-semibold text-primary">{ar ? "اقرأ الدرس المرتبط ←" : "Read the related lesson →"}</Link>
              </div>
            ) : <p className="text-sm text-muted-foreground">{ar ? "ستظهر الإجابة والتفسير بعد تأكيد اختيارك." : "The answer and explanation appear after you check your scoring."}</p>}
            <div className="flex justify-end">
              <button disabled={!complete || checked} onClick={check} className="min-h-12 rounded-xl bg-primary px-6 font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40">{ar ? "تحقق من التسجيل" : "Check scoring"}</button>
            </div>
          </>
        ) : null}
      </section>
    </div>
  );
}
