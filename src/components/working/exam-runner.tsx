"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Flag } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { answerExam, submitExam } from "@/app/[locale]/exam/actions";
import type { ExamQuestion } from "@/lib/working/exam";
import type { StoredExam } from "@/lib/working/exam-store";

function formatClock(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(m)}:${pad(s % 60)}`;
}

export function ExamRunner({ exam, serverNow, questions, locale }: { exam: StoredExam; serverNow: string; questions: ExamQuestion[]; locale: string }) {
  const ar = locale === "ar";
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, number>>(exam.answers);
  const [index, setIndex] = useState(() => { const i = questions.findIndex((q) => !(q.id in exam.answers)); return i === -1 ? 0 : i; });
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const mounted = useRef(false);
  const finishing = useRef(false);
  const q = questions[index];
  const answeredCount = Object.keys(answers).length;

  useEffect(() => { if (mounted.current) headingRef.current?.focus(); mounted.current = true; }, [index]);

  const finish = useCallback(async () => {
    if (finishing.current) return;
    finishing.current = true;
    setBusy(true);
    const r = await submitExam({ examId: exam.id });
    if (r.ok) router.push(`/exam/${exam.id}/results`);
    else { finishing.current = false; setBusy(false); setError(r.error); }
  }, [exam.id, router]);

  // Exam timer, anchored to the SERVER clock (started_at + time_limit_seconds) so a wrong device clock
  // cannot extend the exam, and survives a refresh since it is derived from server-stored state, not
  // from a client-side countdown that would restart.
  const skew = useMemo(() => Date.parse(serverNow) - Date.now(), [serverNow]);
  const deadline = useMemo(() => Date.parse(exam.startedAt) + exam.timeLimitSeconds * 1000, [exam.startedAt, exam.timeLimitSeconds]);
  const [remaining, setRemaining] = useState(() => (deadline - (Date.now() + skew)) / 1000);
  useEffect(() => {
    const tick = () => {
      const left = (deadline - (Date.now() + skew)) / 1000;
      setRemaining(left);
      if (left <= 0) { setLive(ar ? "انتهى الوقت" : "Time is up"); void finish(); }
      else if (Math.floor(left) === 300) setLive(ar ? "تبقّت 5 دقائق" : "5 minutes remaining");
      else if (Math.floor(left) === 60) setLive(ar ? "تبقّت دقيقة واحدة" : "1 minute remaining");
    };
    tick();
    const h = setInterval(tick, 1000);
    return () => clearInterval(h);
  }, [deadline, skew, finish, ar]);

  async function choose(choice: number) {
    setAnswers((a) => ({ ...a, [q!.id]: choice }));
    setError(null);
    const r = await answerExam({ examId: exam.id, questionId: q!.id, choice });
    if (!r.ok) setError(r.error);
  }
  function toggleFlag() { setFlagged((f) => { const n = new Set(f); if (n.has(q!.id)) n.delete(q!.id); else n.add(q!.id); return n; }); }
  const goTo = (i: number) => setIndex(Math.min(Math.max(i, 0), questions.length - 1));

  if (!q) return null;
  const unansweredCount = questions.length - answeredCount;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div aria-live="polite" className="sr-only">{live}</div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-primary bg-card px-5 py-3">
        <span className="font-semibold text-primary">{ar ? "سؤال" : "Question"} {index + 1} / {questions.length}</span>
        <span className="text-sm text-muted-foreground">{answeredCount}/{questions.length} {ar ? "تمت الإجابة" : "answered"}</span>
        <span role="timer" className="text-lg font-bold tabular-nums" aria-label={ar ? "الوقت المتبقي" : "Time remaining"}>{formatClock(remaining)}</span>
      </div>
      <section className="space-y-6 rounded-2xl border border-border bg-card p-5 sm:p-8" aria-label={ar ? "سؤال الامتحان" : "Exam question"}>
        <div className="flex items-center justify-between gap-3">
          <h2 ref={headingRef} tabIndex={-1} className="text-lg font-semibold leading-8 outline-none" lang="en" dir="ltr">{q.prompt}</h2>
          <button onClick={toggleFlag} aria-pressed={flagged.has(q.id)} className={`inline-flex shrink-0 items-center gap-1 rounded-lg border px-3 py-2 text-sm ${flagged.has(q.id) ? "border-primary bg-primary/10 text-primary" : "border-border"}`}><Flag className="size-4" aria-hidden />{ar ? "علّم للمراجعة" : "Flag"}</button>
        </div>
        <fieldset className="space-y-3" lang="en" dir="ltr">
          <legend className="sr-only">{q.prompt}</legend>
          {q.options.map((option, i) => (
            <label key={i} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${answers[q.id] === i ? "border-primary bg-primary/5" : "border-border hover:bg-muted"}`}>
              <input type="radio" name={q.id} checked={answers[q.id] === i} onChange={() => choose(i)} className="mt-1.5 size-4 accent-primary" />
              <span className="font-semibold">{String.fromCharCode(65 + i)}</span>
              <span className="flex-1 leading-7">{option}</span>
            </label>
          ))}
        </fieldset>
        {error ? <p role="alert" className="text-sm font-semibold text-danger-foreground">{error}</p> : null}
      </section>
      <nav aria-label={ar ? "التنقل بين الأسئلة" : "Question navigator"} className="flex flex-wrap gap-2">
        {questions.map((item, i) => (
          <button key={item.id} onClick={() => goTo(i)} aria-current={i === index ? "step" : undefined} aria-label={`${ar ? "سؤال" : "Question"} ${i + 1}${item.id in answers ? (ar ? "، تمت الإجابة" : ", answered") : ""}${flagged.has(item.id) ? (ar ? "، معلّم" : ", flagged") : ""}`}
            className={`flex size-9 items-center justify-center rounded-lg text-sm font-semibold ${i === index ? "bg-primary text-primary-foreground" : item.id in answers ? "bg-success text-success-foreground" : "border border-border"} ${flagged.has(item.id) ? "ring-2 ring-primary ring-offset-1" : ""}`}>{i + 1}</button>
        ))}
      </nav>
      <div className="flex flex-wrap justify-between gap-3">
        <div className="flex gap-2">
          <button disabled={index === 0} onClick={() => goTo(index - 1)} className="min-h-11 rounded-xl border border-border px-4 disabled:opacity-30">{ar ? "السابق" : "Previous"}</button>
          <button disabled={index === questions.length - 1} onClick={() => goTo(index + 1)} className="min-h-11 rounded-xl border border-border px-4 disabled:opacity-30">{ar ? "التالي" : "Next"}</button>
        </div>
        <button disabled={busy} onClick={() => setConfirming(true)} className="min-h-11 rounded-xl bg-primary px-6 font-semibold text-primary-foreground disabled:opacity-40">{ar ? "تسليم الامتحان" : "Submit exam"}</button>
      </div>
      {confirming ? (
        <div role="alertdialog" aria-labelledby="confirm-h" className="space-y-4 rounded-2xl border-2 border-primary bg-card p-6">
          <h2 id="confirm-h" className="text-lg font-bold">{ar ? "تأكيد التسليم" : "Confirm submission"}</h2>
          <p>{unansweredCount > 0 ? (ar ? `لا تزال هناك ${unansweredCount} أسئلة بلا إجابة. ستُحتسب كخاطئة.` : `${unansweredCount} question${unansweredCount === 1 ? "" : "s"} still unanswered. They will count as incorrect.`) : (ar ? "أجبت عن جميع الأسئلة." : "You've answered every question.")}</p>
          <div className="flex gap-3">
            <button disabled={busy} onClick={finish} className="min-h-11 rounded-xl bg-primary px-5 font-semibold text-primary-foreground">{busy ? (ar ? "جارٍ التسليم…" : "Submitting…") : (ar ? "تسليم نهائي" : "Submit now")}</button>
            <button disabled={busy} onClick={() => setConfirming(false)} className="min-h-11 rounded-xl border border-border px-5">{ar ? "متابعة الامتحان" : "Keep going"}</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
