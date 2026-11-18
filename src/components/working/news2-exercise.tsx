"use client";
import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useLearning } from "./progress";
import type { News2Case } from "@/lib/working/news2-case";

export function News2ExerciseView({ exercise, locale }: { exercise: News2Case; locale: string }) {
  const ar = locale === "ar";
  const { saveAnswer } = useLearning();
  const [choice, setChoice] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const href = `/news2/${exercise.key}`;

  function submit() {
    if (choice === null) return;
    setChecked(true);
    saveAnswer({ id: exercise.key, title: exercise.key, href, correct: choice === exercise.answer, at: Date.now() });
  }

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <Link href="/news2">← {ar ? "كل تمارين NEWS2" : "All NEWS2 scoring exercises"}</Link>
      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{ar ? "تمرين حساب الدرجة" : "SCORING EXERCISE"}</p>
        <h1 className="text-2xl font-bold" lang="en" dir="ltr">{ar ? `تمرين NEWS2 ${exercise.key}` : `NEWS2 exercise ${exercise.key}`}</h1>
      </header>

      <section aria-label={ar ? "الموقف السريري" : "Clinical situation"} className="rounded-2xl border border-border bg-card p-5">
        <p className="leading-7" lang="en" dir="ltr">{exercise.vignette}</p>
        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground" lang="en" dir="ltr">
          {exercise.scale === "2" ? "Scored on SpO2 Scale 2 (hypercapnic respiratory failure target)" : "Scored on SpO2 Scale 1 (standard)"}
        </p>
      </section>

      <section className="space-y-5 rounded-2xl border border-border bg-card p-5 sm:p-8" aria-label={ar ? "سؤال" : "Question"}>
        <fieldset disabled={checked} className="space-y-3" lang="en" dir="ltr">
          <legend className="mb-4 text-lg font-semibold leading-8">{ar ? "ما هو مجموع NEWS2 الصحيح والاستجابة السريرية المناسبة؟" : "What is this patient's correct NEWS2 total and the appropriate clinical response?"}</legend>
          {exercise.options.map((option, i) => {
            const isCorrect = checked && i === exercise.answer, isMyWrong = checked && choice === i && i !== exercise.answer;
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
            <h3 className="font-bold">{choice === exercise.answer ? (ar ? "إجابة صحيحة" : "Correct") : (ar ? "لنراجع هذا التمرين" : "Let's review this one")}</h3>
            <p className="leading-7">{exercise.explanation}</p>
            <Link href="/working/D01-T19" className="inline-block text-sm font-semibold text-primary">{ar ? "اقرأ الدرس المرتبط ←" : "Read the related lesson →"}</Link>
          </div>
        ) : <p className="text-sm text-muted-foreground">{ar ? "ستظهر الإجابة والتفسير بعد تأكيد اختيارك." : "The answer and explanation appear after you check your choice."}</p>}
        <div className="flex justify-end">
          <button disabled={choice === null || checked} onClick={submit} className="min-h-12 rounded-xl bg-primary px-6 font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40">{ar ? "تحقق من الإجابة" : "Check answer"}</button>
        </div>
      </section>

      <section aria-labelledby="news2-evidence" className="space-y-2 text-sm text-muted-foreground">
        <h2 id="news2-evidence" className="text-sm font-semibold text-foreground">{ar ? "حالة المراجعة" : "Review status"}</h2>
        <p>{ar ? "سيناريو تعليمي افتراضي يستخدم جدول تسجيل NEWS2 الرسمي الصادر عن الكلية الملكية للأطباء (لا توجد قيود على حقوق النشر على المحتوى، لكن لا يُعاد إنتاج الرسم البياني الرسمي نفسه). ليس بيانات مريض حقيقية، وهذه أداة مساعدة للتقييم السريري وليست بديلاً عنه." : "A fictional teaching scenario that implements the official NEWS2 scoring table published by the Royal College of Physicians (the content itself carries no copyright restriction; this does not reproduce RCP's own graphic chart). Not real patient data, and NEWS2 is an aid to clinical assessment, never a substitute for it - any concern about a patient should prompt urgent review whatever the score."}</p>
      </section>
    </article>
  );
}
