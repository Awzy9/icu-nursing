"use client";
import { useState } from "react";
import { ArrowUp, ArrowDown, CheckCircle2, XCircle } from "lucide-react";
import { useLearning } from "./progress";
import { matchCount, isFullyOrdered, moveStep } from "@/lib/working/step-sequence";

export function StepSequenceExercise({ moduleKey, title, steps, initialOrder, locale }: { moduleKey: string; title: string; steps: string[]; initialOrder: number[]; locale: string }) {
  const ar = locale === "ar";
  const { saveAnswer } = useLearning();
  const [order, setOrder] = useState<number[]>(initialOrder);
  const [checked, setChecked] = useState(false);

  function move(index: number, direction: -1 | 1) {
    if (checked) return;
    setOrder((o) => moveStep(o, index, direction));
  }
  function check() {
    setChecked(true);
    const correct = isFullyOrdered(order);
    saveAnswer({ id: `${moduleKey}-sequence`, title: `${title} - step order`, href: `/working/${moduleKey}`, correct, at: Date.now() });
  }

  const score = matchCount(order);

  return (
    <section aria-label={ar ? "تمرين ترتيب الخطوات" : "Step-ordering exercise"} className="space-y-5 rounded-2xl border border-border bg-card p-5 sm:p-8">
      <div>
        <h2 className="text-lg font-semibold">{ar ? "رتّب البنود كما وردت في قائمة الدرس" : "Match the lesson checklist order"}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{ar ? "استخدم الأسهم لترتيب البنود. في الرعاية الفعلية، قد تُنفّذ بعض الإجراءات بالتوازي حسب حالة المريض وبروتوكول الوحدة." : "Use the arrows to match the checklist. In clinical care, actions may happen in parallel according to the patient’s condition and local protocol."}</p>
      </div>
      <ol className="space-y-2" lang="en" dir="ltr">
        {order.map((originalIndex, position) => {
          const isRight = checked && originalIndex === position;
          const isWrong = checked && originalIndex !== position;
          return (
            <li key={originalIndex} className={`flex items-start gap-3 rounded-xl border p-3 ${isRight ? "border-success-foreground/60 bg-success text-success-foreground" : isWrong ? "border-danger-foreground/60 bg-danger text-danger-foreground" : "border-border bg-background"}`}>
              <div className="flex flex-col gap-1">
                <button type="button" disabled={checked || position === 0} onClick={() => move(position, -1)} aria-label={ar ? "تحريك لأعلى" : "Move up"} className="rounded-lg border border-border bg-card p-1 disabled:opacity-30">
                  <ArrowUp className="size-4" aria-hidden />
                </button>
                <button type="button" disabled={checked || position === order.length - 1} onClick={() => move(position, 1)} aria-label={ar ? "تحريك لأسفل" : "Move down"} className="rounded-lg border border-border bg-card p-1 disabled:opacity-30">
                  <ArrowDown className="size-4" aria-hidden />
                </button>
              </div>
              <span className="flex-1 pt-1 leading-7">{steps[originalIndex]}</span>
              {isRight ? <CheckCircle2 className="mt-1 size-5 shrink-0" aria-hidden /> : null}
              {isWrong ? <XCircle className="mt-1 size-5 shrink-0" aria-hidden /> : null}
            </li>
          );
        })}
      </ol>
      {checked ? (
        <div role="status" className="rounded-xl bg-muted p-4" lang="en" dir="ltr">
          <p className="font-semibold">{isFullyOrdered(order) ? (ar ? "الترتيب صحيح تماماً" : "Fully correct order") : `${ar ? "الخطوات في الموضع الصحيح: " : "Steps in the correct position: "}${score} / ${order.length}`}</p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{ar ? "سيظهر عدد الخطوات الصحيحة بعد التحقق." : "The number of correctly placed steps appears after you check."}</p>
      )}
      <div className="flex justify-end">
        <button disabled={checked} onClick={check} className="min-h-12 rounded-xl bg-primary px-6 font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40">{ar ? "تحقق من الترتيب" : "Check order"}</button>
      </div>
    </section>
  );
}
