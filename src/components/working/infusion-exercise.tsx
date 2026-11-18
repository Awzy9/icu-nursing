"use client";
import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useLearning } from "./progress";
import type { InfusionCase } from "@/lib/working/infusion-case";

export function InfusionExerciseView({ exercise, locale }: { exercise: InfusionCase; locale: string }) {
  const ar = locale === "ar";
  const { saveAnswer } = useLearning();
  const [choice, setChoice] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const href = `/infusion-practice/${exercise.key}`;

  function submit() {
    if (choice === null) return;
    setChecked(true);
    saveAnswer({ id: exercise.key, title: "Infusion rate practice", href, correct: choice === exercise.answerIndex, at: Date.now() });
  }

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <Link href="/infusion-practice">← {ar ? "كل تمارين معدل التسريب" : "All infusion-rate practice problems"}</Link>
      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{ar ? "تمرين حساب معدل التسريب" : "INFUSION-RATE PRACTICE PROBLEM"}</p>
        <h1 className="text-2xl font-bold">{ar ? "ما معدل التسريب الصحيح بالمل/ساعة؟" : "What is the correct infusion rate in mL/hr?"}</h1>
      </header>

      <section aria-label={ar ? "الوصفة" : "The order"} className="rounded-2xl border border-border bg-card p-5">
        <p className="leading-7" lang="en" dir="ltr">{exercise.vignette}</p>
      </section>

      <section className="space-y-5 rounded-2xl border border-border bg-card p-5 sm:p-8" aria-label={ar ? "خيارات المعدل" : "Rate options"}>
        <fieldset disabled={checked} className="space-y-3" lang="en" dir="ltr">
          <legend className="mb-4 text-lg font-semibold leading-8">{ar ? "اختر معدل التسريب الصحيح" : "Select the correct infusion rate"}</legend>
          {exercise.options.map((option, i) => {
            const isCorrect = checked && i === exercise.answerIndex, isMyWrong = checked && choice === i && i !== exercise.answerIndex;
            return (
              <label key={i} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors ${isCorrect ? "border-success-foreground/60 bg-success text-success-foreground" : isMyWrong ? "border-danger-foreground/60 bg-danger text-danger-foreground" : choice === i ? "border-primary bg-primary/5" : "border-border hover:bg-muted"}`}>
                <input type="radio" name={exercise.key} checked={choice === i} onChange={() => setChoice(i)} className="size-4 accent-primary" />
                <span className="flex-1 font-semibold tabular-nums">{option} mL/hr</span>
                {isCorrect ? <span className="flex items-center gap-1 text-sm font-semibold"><CheckCircle2 className="size-4" aria-hidden />{ar ? "صحيح" : "Correct"}</span> : null}
                {isMyWrong ? <span className="flex items-center gap-1 text-sm font-semibold"><XCircle className="size-4" aria-hidden />{ar ? "اختيارك" : "Your answer"}</span> : null}
              </label>
            );
          })}
        </fieldset>
        {checked ? (
          <div role="status" className="space-y-3 rounded-xl bg-muted p-5" lang="en" dir="ltr">
            <h3 className="font-bold">{choice === exercise.answerIndex ? (ar ? "صحيح" : "Correct") : (ar ? "لنراجع هذا الحساب" : "Let's review this calculation")}</h3>
            <p className="leading-7">{exercise.explanation}</p>
            <Link href={`/working/${exercise.drugRef}`} className="inline-block text-sm font-semibold text-primary">{ar ? "اقرأ عن هذا الدواء ←" : "Read about this medication →"}</Link>
          </div>
        ) : <p className="text-sm text-muted-foreground">{ar ? "ستظهر الإجابة والتفسير بعد تأكيد اختيارك." : "The answer and explanation appear after you check your choice."}</p>}
        <div className="flex justify-end">
          <button disabled={choice === null || checked} onClick={submit} className="min-h-12 rounded-xl bg-primary px-6 font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40">{ar ? "تحقق من الإجابة" : "Check answer"}</button>
        </div>
      </section>

      <section aria-labelledby="infusion-safety" className="space-y-2 rounded-2xl border-2 border-primary bg-card p-5 text-sm">
        <h2 id="infusion-safety" className="font-bold text-foreground">{ar ? "تنبيه سلامة" : "Safety note"}</h2>
        <p className="leading-6 text-muted-foreground">{ar ? "هذا تمرين تدريبي للرياضيات الدوائية فقط - وليس أداة لحساب معدل التسريب الفعلي لمريض حقيقي. يجب دائماً إجراء حساب مستقل والتحقق المزدوج وفق سياسة مؤسستك للأدوية عالية الخطورة قبل ضبط أي مضخة تسريب." : "This is a maths-practice exercise only - not a tool for calculating a real patient's actual infusion rate. Always perform an independent calculation and follow your institution's double-check policy for high-alert medications before setting any infusion pump."}</p>
      </section>
    </article>
  );
}
