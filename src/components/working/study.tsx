"use client";
import { useState } from "react";
import { AccountLearningStatus } from "./account-status";
import { RevisionSession } from "./revision";
import { useLearning } from "./progress";
import { Link } from "@/i18n/navigation";
import { computeRevisionQueue, type RevisionQuestion, type RevisionStatus } from "@/lib/working/revision";

function formatDue(ms: number, locale: string) {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(ms));
}

const SESSION_SIZE = 20;

export function WorkingStudy({ locale, questions }: { locale: string; questions: RevisionQuestion[] }) {
  const { attempts } = useLearning();
  const ar = locale === "ar";
  const queue = computeRevisionQueue(questions, attempts);
  const [session, setSession] = useState<RevisionStatus[] | null>(null);
  const moduleCount = new Set(queue.due.map((s) => s.question.moduleKey)).size;
  const sessionSize = Math.min(SESSION_SIZE, queue.due.length);

  if (session) return <RevisionSession items={session} locale={locale} onFinish={() => setSession(null)} />;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header className="space-y-3">
        <p className="text-sm font-semibold text-primary">{ar ? "خطوتك التالية" : "YOUR NEXT STEP"}</p>
        <h1 className="text-3xl font-bold">{ar ? "راجع وثبّت معرفتك" : "Review and strengthen your knowledge"}</h1>
        <p className="text-muted-foreground">{ar ? "تُجدوَل الأسئلة تلقائياً للمراجعة: الأسئلة الجديدة والمخطئ فيها تظهر فوراً، والأسئلة الصحيحة تعود للمراجعة لاحقاً حسب جدول ثابت وواضح." : "Questions are scheduled for you automatically: new or missed questions come due right away; ones you got right come due again later, on a fixed, transparent schedule."}</p>
      </header>
      <AccountLearningStatus locale={locale} />
      <dl className="grid grid-cols-3 gap-3">
        {([[ar ? "تمت الإجابة" : "Answered", queue.totalAttempted], [ar ? "صحيحة" : "Correct", attempts.filter((a) => a.correct).length], [ar ? "مستحقة الآن" : "Due now", queue.due.length]] as const).map(([label, n]) => (
          <div key={label} className="rounded-2xl border border-border bg-card p-5"><dt className="text-sm text-muted-foreground">{label}</dt><dd className="mt-2 text-3xl font-bold">{n}</dd></div>
        ))}
      </dl>
      {queue.due.length ? (
        <section className="space-y-4 rounded-2xl border-2 border-primary bg-card p-6">
          <h2 className="text-xl font-semibold">{ar ? `${queue.due.length} سؤال مستحق الآن عبر ${moduleCount} موضوع` : `${queue.due.length} question${queue.due.length === 1 ? "" : "s"} due now across ${moduleCount} topic${moduleCount === 1 ? "" : "s"}`}</h2>
          <p className="text-sm text-muted-foreground">
            {sessionSize < queue.due.length
              ? (ar ? `ستراجع أول ${sessionSize} سؤالاً (الأكثر استحقاقاً)، وتبقى البقية للجلسة التالية. اختر إجابتك ثم تحقق منها.` : `You'll go through the ${sessionSize} most-overdue questions now; the rest will wait for your next session. Choose your answer, then check it.`)
              : (ar ? "ستراجع كل سؤال على حدة: اختر إجابتك ثم تحقق منها." : "You'll go through each question on its own: choose your answer, then check it.")}
          </p>
          <button onClick={() => setSession(queue.due.slice(0, sessionSize))} className="inline-flex min-h-12 items-center rounded-xl bg-primary px-6 font-semibold text-primary-foreground">{ar ? "ابدأ جلسة المراجعة" : "Start revision session"}</button>
        </section>
      ) : (
        <section className="rounded-2xl border border-border bg-card p-8 space-y-4">
          <h2 className="text-xl font-semibold">{queue.totalAttempted ? (ar ? "أحسنت، لا شيء مستحق الآن" : "You're up to date") : (ar ? "ابدأ بخطوة صغيرة" : "Start with a short practice session")}</h2>
          <p className="text-muted-foreground">
            {queue.totalAttempted
              ? queue.nextDueAt
                ? (ar ? `موعد المراجعة التالية: ${formatDue(queue.nextDueAt, locale)}.` : `Your next question comes due on ${formatDue(queue.nextDueAt, locale)}.`)
                : (ar ? "لقد أجبت عن كل الأسئلة المتاحة." : "You've answered every available question.")
              : (ar ? "اختر وحدة أسئلة، وحدد إجابتك ثم تحقق منها. ستظهر هنا الأسئلة التي تحتاج لمراجعتها." : "Answer a few questions anywhere in the library. The ones you need to revisit will appear here.")}
          </p>
          {queue.totalAttempted ? null : <Link href="/question-bank" className="inline-flex min-h-12 items-center rounded-xl bg-primary px-5 font-semibold text-primary-foreground">{ar ? "ابدأ التدريب" : "Start practising"}</Link>}
        </section>
      )}
    </div>
  );
}
