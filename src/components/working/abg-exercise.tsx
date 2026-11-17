"use client";
import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useLearning } from "./progress";
import type { AbgCase } from "@/lib/working/abg-case";

const GAS_LABELS: Record<string, string> = { pH: "pH", paco2: "PaCO2 (mmHg)", hco3: "HCO3- (mEq/L)", pao2: "PaO2 (mmHg)", fio2: "FiO2" };

export function AbgExerciseView({ exercise, locale }: { exercise: AbgCase; locale: string }) {
  const ar = locale === "ar";
  const { saveAnswer } = useLearning();
  const [choice, setChoice] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const q = exercise.question;
  const href = `/abg/${exercise.key}`;

  function submit() {
    if (choice === null) return;
    setChecked(true);
    saveAnswer({ id: exercise.key, title: exercise.title[0], href, correct: choice === q.answer, at: Date.now() });
  }

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <Link href="/abg">← {ar ? "كل حالات غازات الدم" : "All ABG cases"}</Link>
      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{ar ? "تمرين تفسير غازات الدم الشرياني" : "ABG INTERPRETATION EXERCISE"}</p>
        <h1 className="text-2xl font-bold" lang="en" dir="ltr">{exercise.title[ar ? 1 : 0]}</h1>
        <p className="leading-7 text-muted-foreground" lang="en" dir="ltr">{exercise.vignette}</p>
      </header>

      <section aria-label={ar ? "لوحة الغازات" : "Gas panel"} className="rounded-2xl border border-border bg-card p-5">
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3" lang="en" dir="ltr">
          {Object.entries(exercise.gases).map(([k, v]) => (
            <div key={k}><dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{GAS_LABELS[k] ?? k}</dt><dd className="text-lg font-bold">{v}</dd></div>
          ))}
        </dl>
        {exercise.oxygenationNote ? <p className="mt-4 border-t border-border pt-3 text-sm text-muted-foreground" lang="en" dir="ltr">{exercise.oxygenationNote}</p> : null}
      </section>

      <section className="space-y-5 rounded-2xl border border-border bg-card p-5 sm:p-8" aria-label={ar ? "سؤال التفسير" : "Interpretation question"}>
        <fieldset disabled={checked} className="space-y-3" lang="en" dir="ltr">
          <legend className="mb-4 text-lg font-semibold leading-8">{q.prompt}</legend>
          {q.options.map((option, i) => {
            const isCorrect = checked && i === q.answer, isMyWrong = checked && choice === i && i !== q.answer;
            return (
              <label key={i} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${isCorrect ? "border-success-foreground/60 bg-success text-success-foreground" : isMyWrong ? "border-danger-foreground/60 bg-danger text-danger-foreground" : choice === i ? "border-primary bg-primary/5" : "border-border hover:bg-muted"}`}>
                <input type="radio" name={exercise.key} checked={choice === i} onChange={() => setChoice(i)} className="mt-1.5 size-4 accent-primary" />
                <span className="flex-1 leading-7">{option}
                  {isCorrect ? <span className="mt-1 flex items-center gap-1 text-sm font-semibold"><CheckCircle2 className="size-4" aria-hidden />{ar ? "الإجابة الصحيحة" : "Correct answer"}</span> : null}
                  {isMyWrong ? <span className="mt-1 flex items-center gap-1 text-sm font-semibold"><XCircle className="size-4" aria-hidden />{ar ? "إجابتك" : "Your answer"}</span> : null}
                </span>
              </label>
            );
          })}
        </fieldset>
        {checked ? (
          <div role="status" className="space-y-3 rounded-xl bg-muted p-5" lang="en" dir="ltr">
            <h3 className="font-bold">{choice === q.answer ? (ar ? "إجابة صحيحة" : "Correct") : (ar ? "لنراجع هذا التمرين" : "Let's review this one")}</h3>
            <p className="leading-7">{q.explanation}</p>
            <Link href={exercise.lessonHref} className="inline-block text-sm font-semibold text-primary">{ar ? "اقرأ الدرس المرتبط ←" : "Read the related lesson →"}</Link>
          </div>
        ) : <p className="text-sm text-muted-foreground">{ar ? "ستظهر الإجابة والتفسير بعد تأكيد اختيارك." : "The answer and explanation appear after you check your choice."}</p>}
        <div className="flex justify-end">
          <button disabled={choice === null || checked} onClick={submit} className="min-h-12 rounded-xl bg-primary px-6 font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40">{ar ? "تحقق من الإجابة" : "Check answer"}</button>
        </div>
      </section>

      <section aria-labelledby="abg-evidence" className="space-y-2 text-sm text-muted-foreground">
        <h2 id="abg-evidence" className="text-sm font-semibold text-foreground">{ar ? "المصادر وحالة المراجعة" : "Sources and review status"}</h2>
        <p>{ar ? "حالة تعليمية افتراضية وليست بيانات مريض حقيقية. لا تُستخدم كأداة تشخيص سريري." : "A fictional teaching vignette, not real patient data; not a clinical diagnostic tool."} {ar ? "لم تخضع هذه المادة بعد لمراجعة سريرية رسمية." : "This material has not yet had a formal clinical review."}</p>
        <ul className="list-disc ps-5" lang="en" dir="ltr">{exercise.evidenceSources.map((s) => <li key={s}>{s}</li>)}</ul>
      </section>
    </article>
  );
}
