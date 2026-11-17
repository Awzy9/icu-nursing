"use client";
import { ArrowRight, CheckCircle2, Circle, Clock, GraduationCap, Users } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useLearning } from "./progress";
import { computePathProgress } from "@/lib/working/path-progress";
import type { ResolvedPath } from "@/lib/working/paths";

function Bar({ percent }: { percent: number }) {
  return <div role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} className="h-2 w-full overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${percent}%` }} /></div>;
}

export function PathsList({ paths, locale }: { paths: ResolvedPath[]; locale: string }) {
  const ar = locale === "ar";
  const { attempts, bookmarks, lessons, sessions } = useLearning();
  const state = { attempts, bookmarks, lessons, sessions };
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{ar ? "مسارات موجّهة" : "GUIDED LEARNING PATHS"}</p>
        <h1 className="text-3xl font-bold tracking-tight">{ar ? "اختر مساراً للتعلم" : "Choose a learning path"}</h1>
        <p className="max-w-prose leading-7 text-muted-foreground">{ar ? "كل مسار يجمع دروساً ومهارات وسيناريوهات وأسئلة مرتبطة بموضوع واحد، بترتيب مقترح. يمكنك دائماً تصفح أي محتوى بشكل منفصل أيضاً." : "Each path groups related lessons, skills, scenarios and questions into a suggested order. You can always browse any piece of content on its own too."}</p>
      </header>
      <ul className="grid gap-4 sm:grid-cols-2">
        {paths.map((p) => {
          const progress = computePathProgress(p.steps, state);
          const prereq = p.prerequisite ? paths.find((x) => x.key === p.prerequisite) : undefined;
          return (
            <li key={p.key} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
              <div className="space-y-2">
                <h2 className="text-lg font-bold" lang="en" dir="ltr">{p.title[ar ? 1 : 0]}</h2>
                <p className="flex items-start gap-2 text-sm text-muted-foreground"><Users className="mt-0.5 size-4 shrink-0" aria-hidden />{p.audience[ar ? 1 : 0]}</p>
                <p className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="size-4 shrink-0" aria-hidden />{ar ? `حوالي ${p.estimatedMinutes} دقيقة (تقدير)` : `About ${p.estimatedMinutes} minutes (estimate)`}</p>
                {prereq ? <p className="text-xs text-muted-foreground">{ar ? "يُنصح بإكمال هذا أولاً: " : "Suggested first: "}<Link href={`/learn/paths/${prereq.key}`}>{prereq.title[ar ? 1 : 0]}</Link></p> : null}
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground"><span>{progress.completed}/{progress.total} {ar ? "مكتمل" : "complete"}</span><span>{progress.percent}%</span></div>
                <Bar percent={progress.percent} />
              </div>
              <Link href={`/learn/paths/${p.key}`} className="mt-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 font-semibold text-primary-foreground">{progress.completed === 0 ? (ar ? "ابدأ المسار" : "Start path") : progress.percent === 100 ? (ar ? "مراجعة المسار" : "Review path") : (ar ? "استمر" : "Continue")}<ArrowRight className="size-4 rtl:rotate-180" aria-hidden /></Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const typeLabel: Record<string, [string, string]> = {
  topics: ["Lesson", "درس"], skills: ["Skill", "مهارة"], medications: ["Medicine", "دواء"], cases: ["Scenario", "سيناريو"], equipment: ["Equipment", "جهاز"], practice: ["Exercise", "تدريب"], questions: ["Quiz", "اختبار"],
};

export function PathDetail({ path, locale }: { path: ResolvedPath; locale: string }) {
  const ar = locale === "ar";
  const { attempts, bookmarks, lessons, sessions } = useLearning();
  const progress = computePathProgress(path.steps, { attempts, bookmarks, lessons, sessions });
  return (
    <article className="mx-auto max-w-3xl space-y-8">
      <Link href="/learn/paths">← {ar ? "كل المسارات" : "All paths"}</Link>
      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{ar ? "مسار موجّه" : "GUIDED PATH"}</p>
        <h1 className="text-3xl font-bold tracking-tight" lang="en" dir="ltr">{path.title[ar ? 1 : 0]}</h1>
        <p className="flex items-start gap-2 leading-7 text-muted-foreground"><Users className="mt-1 size-4 shrink-0" aria-hidden />{path.audience[ar ? 1 : 0]}</p>
        <p className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="size-4 shrink-0" aria-hidden />{ar ? `حوالي ${path.estimatedMinutes} دقيقة بالإجمال، تقدير وليس قاعدة ثابتة.` : `About ${path.estimatedMinutes} minutes in total — an estimate, not a fixed rule.`}</p>
      </header>
      <section aria-labelledby="path-objectives" className="space-y-2 rounded-2xl border border-border bg-card p-5">
        <h2 id="path-objectives" className="font-semibold">{ar ? "أهداف التعلم" : "Learning objectives"}</h2>
        <ul className="list-disc space-y-1.5 ps-5 leading-7">{path.objectives.map((o, i) => <li key={i} lang="en" dir="ltr">{o[ar ? 1 : 0]}</li>)}</ul>
      </section>
      <section aria-labelledby="path-progress" className="space-y-3">
        <div className="flex items-center justify-between"><h2 id="path-progress" className="font-semibold">{ar ? "تقدمك" : "Your progress"}</h2><span className="text-sm font-semibold text-muted-foreground">{progress.completed}/{progress.total} · {progress.percent}%</span></div>
        <Bar percent={progress.percent} />
        {progress.percent === 100 ? (
          <div role="status" className="rounded-xl bg-success p-4 text-success-foreground"><p className="flex items-center gap-2 font-semibold"><CheckCircle2 className="size-5" aria-hidden />{ar ? "أنهيت كل عناصر هذا المسار" : "You've been through every step in this path"}</p><p className="mt-1 text-sm">{ar ? "هذا يعكس نشاطك المسجَّل فقط: إتمامًا ذاتيًا للدروس وأداءً فعليًا في الأسئلة. وهو تعلم ذاتي، وليس تصديقاً على الكفاءة السريرية." : "This reflects your recorded activity only — self-reported lesson completion plus actual quiz performance. It is self-study, not a certification of clinical competence."}</p></div>
        ) : progress.nextStep ? (
          <Link href={progress.nextStep.step.href} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-primary px-6 font-semibold text-primary-foreground"><span>{progress.completed === 0 ? (ar ? "ابدأ:" : "Start:") : (ar ? "استمر من هنا:" : "Continue from here:")}</span> <span lang="en" dir="ltr">{progress.nextStep.step.title}</span><ArrowRight className="size-4 rtl:rotate-180" aria-hidden /></Link>
        ) : null}
      </section>
      <section aria-labelledby="path-steps" className="space-y-3">
        <h2 id="path-steps" className="font-semibold">{ar ? "خطوات المسار" : "Path steps"}</h2>
        <ol className="space-y-2">
          {progress.steps.map((s, i) => (
            <li key={s.step.key} className={`flex items-center gap-4 rounded-xl border p-4 ${s.done ? "border-success-foreground/40 bg-success/40" : "border-border bg-card"}`}>
              <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">{i + 1}</span>
              {s.done ? <CheckCircle2 className="size-5 shrink-0 text-success-foreground" aria-hidden /> : <Circle className="size-5 shrink-0 text-muted-foreground" aria-hidden />}
              <div className="min-w-0 flex-1">
                <Link href={s.step.href} className="font-semibold" lang="en" dir="ltr">{s.step.title}</Link>
                <p className="text-xs text-muted-foreground">{typeLabel[s.step.type]?.[ar ? 1 : 0] ?? s.step.type} · {s.step.type === "questions" ? (s.detail ? (ar ? `${s.detail.split(":")[0]} أُجيب عنها` : `${s.detail.split(":")[0]} answered`) : (ar ? "لم تبدأ بعد" : "Not started yet")) : s.done ? (ar ? "وضعتَها كمكتملة (ذاتياً)" : "Marked completed (self-reported)") : (ar ? "لم تُوضع كمكتملة بعد" : "Not marked completed yet")}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
      <p className="flex items-start gap-2 text-xs text-muted-foreground"><GraduationCap className="mt-0.5 size-4 shrink-0" aria-hidden />{ar ? "هذا المسار للتعلم الذاتي فقط، ولا يمثل اعتماداً سريرياً أو شهادة كفاءة." : "This path is for self-study only. It does not represent clinical approval or a certification of competence."}</p>
    </article>
  );
}
