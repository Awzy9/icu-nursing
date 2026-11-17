"use client";
import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useLearning } from "./progress";
import { WorkingBody } from "./body";
import type { RevisionStatus } from "@/lib/working/revision";

// A fixed snapshot of what was due when the session started: answering one question must not
// change which questions are in *this* session, even though the live due queue shrinks as you go.
export function RevisionSession({ items, locale, onFinish }: { items: RevisionStatus[]; locale: string; onFinish: () => void }) {
  const ar = locale === "ar";
  const { saveAnswer } = useLearning();
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  if (finished) return (
    <section className="rounded-2xl border border-border bg-card p-6 sm:p-10 text-center space-y-5">
      <p className="text-sm font-semibold text-primary">{ar ? "اكتملت جلسة المراجعة" : "Revision session complete"}</p>
      <h2 className="text-3xl font-bold">{score} / {items.length}</h2>
      <p className="text-muted-foreground">{ar ? "ستعود الأسئلة التي أخطأت فيها للمراجعة فوراً، والتي أجبت عنها بشكل صحيح بعد فترة لاحقة." : "Questions you missed come due again immediately; ones you got right come due again later."}</p>
      <button onClick={onFinish} className="min-h-11 rounded-xl bg-primary px-5 text-primary-foreground">{ar ? "العودة إلى المراجعة" : "Back to revision"}</button>
    </section>
  );
  const current = items[index]!;
  const q = current.question;
  function submit() {
    if (choice === null) return;
    setChecked(true);
    const correct = choice === q.answer;
    if (correct) setScore((s) => s + 1);
    saveAnswer({ id: q.id, title: q.moduleTitle, href: q.moduleHref, choice, correct, at: Date.now() });
  }
  function next() {
    if (index + 1 === items.length) { setFinished(true); return; }
    setIndex((i) => i + 1); setChoice(null); setChecked(false);
  }
  return (
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-8 space-y-6" aria-label={ar ? "جلسة مراجعة" : "Revision session"}>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <span className="font-semibold text-primary">{ar ? "سؤال" : "Question"} {index + 1} / {items.length}</span>
        <Link href={q.moduleHref} className="text-muted-foreground">{ar ? "الدرس المرتبط:" : "Related lesson:"} <span lang="en" dir="ltr">{q.moduleTitle}</span></Link>
        <button type="button" onClick={onFinish} className="text-muted-foreground underline">{ar ? "إنهاء الجلسة الآن" : "End session now"}</button>
      </div>
      <progress aria-label={ar ? "تقدم الجلسة" : "Session progress"} value={index} max={items.length} className="h-1.5 w-full accent-primary" />
      <fieldset disabled={checked} className="space-y-3" lang="en" dir="ltr">
        <legend className="mb-5 text-lg font-semibold leading-8">{q.prompt}</legend>
        {q.options.map((option, i) => {
          const isCorrect = checked && i === q.answer, isMyWrong = checked && choice === i && i !== q.answer;
          return (
            <label key={i} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${isCorrect ? "border-success-foreground/60 bg-success text-success-foreground" : isMyWrong ? "border-danger-foreground/60 bg-danger text-danger-foreground" : choice === i ? "border-primary bg-primary/5" : "border-border hover:bg-muted"}`}>
              <input type="radio" name={q.id} value={i} checked={choice === i} onChange={() => setChoice(i)} className="mt-1.5 size-4 accent-primary" />
              <span className="font-semibold">{String.fromCharCode(65 + i)}</span>
              <span className="flex-1 leading-7">{option}
                {isCorrect ? <span className="mt-1 flex items-center gap-1 text-sm font-semibold"><CheckCircle2 className="size-4" aria-hidden />{ar ? "الإجابة الصحيحة" : "Correct answer"}</span> : null}
                {isMyWrong ? <span className="mt-1 flex items-center gap-1 text-sm font-semibold"><XCircle className="size-4" aria-hidden />{ar ? "إجابتك" : "Your answer"}</span> : null}
              </span>
            </label>
          );
        })}
      </fieldset>
      {checked ? (
        <div role="status" className="space-y-3 rounded-xl bg-muted p-5">
          <h3 className="font-bold">{choice === q.answer ? (ar ? "إجابة صحيحة" : "Correct answer") : (ar ? "لنراجع هذا السؤال" : "Let's review this question")}</h3>
          <p>{ar ? "الإجابة الصحيحة" : "Correct choice"}: {String.fromCharCode(65 + q.answer)}</p>
          <WorkingBody body={q.explanation} />
          <Link href={q.moduleHref} className="inline-block text-sm font-semibold text-primary">{ar ? "اقرأ الدرس المرتبط ←" : "Read the related lesson →"}</Link>
        </div>
      ) : <p className="text-sm text-muted-foreground">{ar ? "ستظهر الإجابة والتفسير بعد تأكيد اختيارك." : "The answer and explanation appear after you check your choice."}</p>}
      <div className="flex justify-end">
        {checked ? (
          <button onClick={next} className="min-h-12 rounded-xl bg-primary px-6 font-semibold text-primary-foreground">{index + 1 === items.length ? (ar ? "عرض النتيجة" : "View results") : (ar ? "السؤال التالي" : "Next question")}</button>
        ) : (
          <button disabled={choice === null} onClick={submit} className="min-h-12 rounded-xl bg-primary px-6 font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40">{ar ? "تحقق من الإجابة" : "Check answer"}</button>
        )}
      </div>
    </section>
  );
}
