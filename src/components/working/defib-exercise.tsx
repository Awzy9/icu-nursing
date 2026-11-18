"use client";
import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useLearning } from "./progress";
import { WaveformChart } from "./waveform-chart";
import { defibTrace, type DefibExercise } from "@/lib/working/defib";

export function DefibExerciseView({ exercise, locale }: { exercise: DefibExercise; locale: string }) {
  const ar = locale === "ar";
  const { saveAnswer } = useLearning();
  const [choice, setChoice] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const q = exercise.question;
  const href = `/defib-rhythm-check/${exercise.key}`;
  const trace = defibTrace(exercise);

  function submit() {
    if (choice === null) return;
    setChecked(true);
    saveAnswer({ id: exercise.key, title: exercise.title[0], href, correct: choice === q.answer, at: Date.now() });
  }

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <Link href="/defib-rhythm-check">← {ar ? "كل تمارين الأنظمة القابلة للصدمة" : "All shockable-rhythm exercises"}</Link>
      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{ar ? "تمرين التعرف السريري" : "RECOGNITION EXERCISE"}</p>
        <h1 className="text-2xl font-bold" lang="en" dir="ltr">{exercise.title[ar ? 1 : 0]}</h1>
      </header>

      <section aria-label={ar ? "الموقف السريري" : "Clinical situation"} className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <p className="leading-7" lang="en" dir="ltr">{exercise.vignette}</p>
        <WaveformChart trace={trace} locale={locale} />
      </section>

      <section className="space-y-5 rounded-2xl border border-border bg-card p-5 sm:p-8" aria-label={ar ? "سؤال" : "Question"}>
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
            <Link href="/ecg" className="inline-block text-sm font-semibold text-primary">{ar ? "تمرّن أكثر على تمييز الأنظمة ←" : "Practise more rhythm recognition →"}</Link>
          </div>
        ) : <p className="text-sm text-muted-foreground">{ar ? "ستظهر الإجابة والتفسير بعد تأكيد اختيارك." : "The answer and explanation appear after you check your choice."}</p>}
        <div className="flex justify-end">
          <button disabled={choice === null || checked} onClick={submit} className="min-h-12 rounded-xl bg-primary px-6 font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40">{ar ? "تحقق من الإجابة" : "Check answer"}</button>
        </div>
      </section>

      <section aria-labelledby="dfb-evidence" className="space-y-2 text-sm text-muted-foreground">
        <h2 id="dfb-evidence" className="text-sm font-semibold text-foreground">{ar ? "حالة المراجعة" : "Review status"}</h2>
        <p>{ar ? "سيناريو تعليمي افتراضي يعكس تصنيف الأنظمة القابلة وغير القابلة للصدمة وفق خوارزميات الإنعاش القياسية. ليس بيانات مريض حقيقية. لم تخضع هذه المادة بعد لمراجعة سريرية رسمية." : "A fictional teaching scenario reflecting the standard shockable/non-shockable classification from resuscitation algorithms. Not real patient data. This material has not yet had a formal clinical review."}</p>
      </section>
    </article>
  );
}
