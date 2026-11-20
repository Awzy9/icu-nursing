"use client";

import { useEffect, useState } from "react";
import { Activity, ArrowLeft, ArrowRight, CheckCircle2, CircleAlert, BookOpenCheck, ListRestart, Monitor, Pill } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { activities, expiratoryFlowExamples, orientation } from "@/lib/working/nursing-lab";
import { computeRevisionQueue, type RevisionQuestion, type RevisionStatus } from "@/lib/working/revision";
import { WaveformChart } from "./waveform-chart";
import { EquipmentVisual } from "./equipment-visual";
import { useLearning } from "./progress";
import { RevisionSession } from "./revision";

const card = "space-y-4 rounded-2xl border border-border bg-card p-5 sm:p-6";
const button = "inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-sm font-semibold hover:bg-muted disabled:opacity-50";
const primaryButton = "inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50";
const link = "inline-flex min-h-11 items-center font-semibold text-primary underline";
type Activity = typeof activities[number];
type Results = Record<string, boolean>;

const workspaces = [
  { id: "shift", title: ["Shift simulator", "محاكاة المناوبة"], detail: ["Decide which patient needs you first.", "حدّد المريض الذي يحتاج إلى تقييمك أولاً."], icon: Activity },
  { id: "orientation", title: ["Orientation path", "مسار التهيئة"], detail: ["Start with four guided bedside skills.", "ابدأ بأربع مهارات سريرية موجّهة."], icon: BookOpenCheck },
  { id: "medication-checks", title: ["Medication checks", "التحقق من الأدوية"], detail: ["Compare the order, label and pump.", "قارن بين الوصفة والملصق والمضخة."], icon: Pill },
  { id: "visual-skills", title: ["Visual skills", "المهارات البصرية"], detail: ["Read equipment photos and waveforms.", "تعرّف على الأجهزة وفسّر المنحنيات."], icon: Monitor },
  { id: "mistakes", title: ["Review mistakes", "مراجعة الأخطاء"], detail: ["Retry decisions and questions you missed.", "أعد محاولة القرارات والأسئلة التي أخطأت فيها."], icon: ListRestart },
] as const;
type Workspace = typeof workspaces[number]["id"];

function ActivityPlayer({ activity, retryIndex, onAnswer }: { activity: Activity; retryIndex?: number; onAnswer: (key: string, correct: boolean) => void }) {
  const [ index, setIndex ] = useState(retryIndex ?? 0);
  const [ choice, setChoice ] = useState<number | null>(null);
  const [ checked, setChecked ] = useState(false);
  const [ delayed, setDelayed ] = useState(false);
  const [ score, setScore ] = useState(0);
  const step = activity.steps[index];
  if (!step) return (
    <div className="space-y-3">
      <p role="status">{retryIndex === undefined ? `Activity complete. ${score} of ${activity.steps.length} correct.` : "Decision reviewed."}</p>
      {activity.id === "shift" && <Link className={link} href="/working/D01-T09">Review ventilator alarms</Link>}
      {activity.id === "medication-checks" && <Link className={link} href="/working/SK-22">Review infusion pump safety</Link>}
      <div><button className={button} type="button" onClick={() => { setIndex(retryIndex ?? 0); setScore(0); setDelayed(false); }}>Restart activity</button></div>
    </div>
  );

  return (
    <div className="space-y-4" lang="en" dir="ltr">
      <div className="space-y-2">
        <p className="text-sm font-semibold text-muted-foreground">{retryIndex === undefined ? `Decision ${index + 1} of ${activity.steps.length}` : "Retrying a missed decision"}</p>
        {retryIndex === undefined && <progress aria-label="Activity progress" value={index + Number(checked)} max={activity.steps.length} className="block h-2 w-full accent-primary" />}
      </div>
      {"flowComparison" in step && (
        <section aria-label="Simulated ventilator flow traces" className="space-y-3 rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Time runs left to right. The dashed line marks zero flow.</p>
          {expiratoryFlowExamples.map((trace) => <WaveformChart key={trace.label} trace={trace} locale="en" />)}
          <details className="text-sm">
            <summary className="cursor-pointer font-semibold">Read a text description of the traces</summary>
            <p className="mt-2">In Trace A, flow reaches the dashed line before the next inspiratory upstroke. In Trace B, flow remains below it until the next upstroke.</p>
          </details>
          <a className={link} href="https://thoracic-society.files.svdcdn.com/production/2024-RBC-Physiology-Jeopardy-Handout.pdf?dm=1746279988">American Thoracic Society · Identifying auto-PEEP</a>
        </section>
      )}
      {"equipment" in step && <EquipmentVisual moduleKey={step.equipment} locale="en" hideTeaching={!checked} />}
      {activity.id === "shift" && index === 1 && delayed && <p className="rounded-lg bg-muted p-3">While the team was called, Patient A’s saturation fell further. The team corrected the circuit and is now reassessing recovery.</p>}
      {"monitor" in step && <figure className="space-y-2">
        <figcaption className="text-sm font-semibold">Simulated bedside readings</figcaption>
        <div className="grid gap-3 sm:grid-cols-2">
          {step.monitor.map(({ patient, readings }) => <div key={patient} className="rounded-xl border border-slate-700 bg-slate-950 p-4 text-slate-100">
            <p className="font-semibold">{patient}</p>
            <dl className="mt-2 divide-y divide-slate-700">
              {readings.map(([label, value]) => <div key={label} className="flex flex-wrap justify-between gap-x-3 gap-y-1 py-2">
                <dt className="text-sm text-slate-300">{label}</dt>
                <dd className="text-sm font-semibold tabular-nums text-cyan-200">{value}</dd>
              </div>)}
            </dl>
          </div>)}
        </div>
      </figure>}
      {"readouts" in step && <dl className="grid gap-2 sm:grid-cols-3">
        {step.readouts.map(([label, value]) => <div key={label} className="rounded-lg border border-border p-3"><dt className="text-sm text-muted-foreground">{label}</dt><dd className="font-semibold">{value}</dd></div>)}
      </dl>}
      <fieldset className="space-y-2" disabled={checked}>
        <legend className="mb-2 font-semibold">{step.prompt}</legend>
        {step.choices.map((text, i) => (
          <label key={text} className={`flex min-h-12 items-center gap-3 rounded-xl border px-4 py-3 ${checked ? "cursor-default" : "cursor-pointer hover:bg-muted"} ${choice === i ? "border-primary bg-primary/10" : "border-border"}`}>
            <input type="radio" name={activity.id} checked={choice === i} onChange={() => setChoice(i)} />
            <span>{text}</span>
          </label>
        ))}
      </fieldset>
      {checked ? (
        <>
          <div role="status" className={`flex gap-3 rounded-xl border p-4 ${choice === step.answer ? "border-primary/40 bg-primary/10" : "border-amber-500/40 bg-amber-500/10"}`}>
            {choice === step.answer ? <CheckCircle2 aria-hidden className="mt-0.5 size-5 shrink-0 text-primary" /> : <CircleAlert aria-hidden className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-300" />}
            <div>
              <p className="font-bold">{choice === step.answer ? "Correct" : "Review this decision"}</p>
              <p className="mt-1 text-sm leading-relaxed">{step.why}</p>
            </div>
          </div>
          <button className={primaryButton} type="button" onClick={() => { setIndex(retryIndex === undefined ? index + 1 : activity.steps.length); setChoice(null); setChecked(false); }}>
            {retryIndex !== undefined || index + 1 === activity.steps.length ? "Finish activity" : "Next decision"}
          </button>
        </>
      ) : (
        <button className={primaryButton} type="button" disabled={choice === null} onClick={() => {
          if (choice === null) return;
          const correct = choice === step.answer;
          if (activity.id === "shift" && index === 0) setDelayed(!correct);
          setChecked(true);
          setScore(score + Number(correct));
          onAnswer(`${activity.id}-${index}`, correct);
        }}>Check answer</button>
      )}
    </div>
  );
}

export function NursingLab({ locale, questions }: { locale: string; questions: RevisionQuestion[] }) {
  const { attempts, accountId, lessons } = useLearning();
  const ar = locale === "ar";
  const language = ar ? 1 : 0;
  const [workspace, setWorkspace] = useState<Workspace | null>(null);

  useEffect(() => {
    function selectFromHash() {
      const target = window.location.hash.slice(1);
      setWorkspace(workspaces.find(({ id }) => id === target)?.id ?? null);
    }
    selectFromHash();
    window.addEventListener("hashchange", selectFromHash);
    return () => window.removeEventListener("hashchange", selectFromHash);
  }, []);

  useEffect(() => {
    if (!workspace) return;
    const panel = document.getElementById(workspace);
    panel?.focus({ preventScroll: true });
  }, [workspace]);
  const [ results, setResults ] = useState<Results>({});
  const [ review, setReview ] = useState<RevisionStatus[] | null>(null);
  const [ runs, setRuns ] = useState<Record<string, { version: number; retryIndex?: number }>>({});
  const key = `icu-nursing-lab-v1:${accountId ?? "guest"}`;
  useEffect(() => {
    try { setResults(JSON.parse(localStorage.getItem(key) ?? "{}")); } catch { setResults({}); }
  }, [key]);

  function saveResult(id: string, correct: boolean) {
    setResults((previous) => {
      return { ...previous, [id]: correct };
    });
    try {
      const previous = JSON.parse(localStorage.getItem(key) ?? "{}") as Results;
      localStorage.setItem(key, JSON.stringify({ ...previous, [id]: correct }));
    } catch { /* The current page still retains the result. */ }
  }

  const attempted = new Set(attempts.map((attempt) => attempt.id));
  const missed = new Set(attempts.filter((attempt) => !attempt.correct).map((attempt) => attempt.id));
  const queue = computeRevisionQueue(questions, attempts);
  const missedQuestions = [...queue.due, ...queue.upcoming].filter(({ question }) => missed.has(question.id));
  const missedModules = new Set(missedQuestions.map(({ question }) => question.moduleKey));
  const freshQuestions = queue.due.filter(({ question }) => missedModules.has(question.moduleKey) && !attempted.has(question.id));
  const missedDecisions = activities.flatMap((activity) => activity.steps.flatMap((step, i) =>
    results[`${activity.id}-${i}`] === false ? [{ activity, step, i }] : []));
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="relative overflow-hidden rounded-3xl border border-cyan-800/60 bg-slate-950 px-6 py-8 text-slate-50 sm:px-10 sm:py-12">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-800/60 via-slate-950 to-slate-950" />
        <div className="relative max-w-2xl space-y-3">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{ar ? "مختبر تمريض العناية المركزة" : "ICU Nursing Lab"}</h1>
          <p className="max-w-xl text-base leading-relaxed text-slate-300">{ar ? "اختر نشاطاً للتدرّب على قرارات الرعاية بجانب السرير. التمارين باللغة الإنجليزية." : "Practise bedside decisions with fictional cases, equipment photos and simulated monitor readings."}</p>
        </div>
      </header>
      {workspace && <a href="#activities" onClick={() => setWorkspace(null)} className={link}><ArrowLeft aria-hidden className="me-2 size-4 rtl:rotate-180" />{ar ? "كل الأنشطة" : "All activities"}</a>}
      {workspace && (
        <label className="block space-y-1 sm:hidden">
          <span className="text-sm font-semibold">{ar ? "انتقل إلى نشاط" : "Switch activity"}</span>
          <select value={workspace} onChange={(event) => { window.location.hash = event.target.value; }} className="min-h-12 w-full rounded-xl border border-border bg-card px-3">
            {workspaces.map(({ id, title }) => <option key={id} value={id}>{title[language]}</option>)}
          </select>
        </label>
      )}
      <nav id="activities" aria-label={ar ? "الأنشطة" : "Lab activities"} className={workspace ? "hidden flex-wrap gap-2 sm:flex" : "grid gap-4 sm:grid-cols-2 lg:grid-cols-4"}>
        {workspaces.map(({ id, title, detail, icon: Icon }) => workspace ? (
          <a key={id} href={`#${id}`} aria-current={workspace === id ? "location" : undefined} onClick={() => setWorkspace(id)} className={`${button} gap-2 ${workspace === id ? "border-primary bg-primary/10 text-primary" : ""}`}>
            <Icon aria-hidden className="size-4" />{title[language]}
          </a>
        ) : (
          <a key={id} href={`#${id}`} onClick={() => setWorkspace(id)} className={`group relative flex min-h-40 flex-col gap-3 overflow-hidden rounded-2xl border p-5 transition-colors ${id === "shift" ? "border-cyan-800 bg-gradient-to-br from-slate-950 to-cyan-950 text-slate-50 hover:border-cyan-400 sm:col-span-2 lg:col-span-4" : "border-border bg-card hover:border-primary hover:bg-primary/5"}`}>
            <span className={`flex items-center justify-between ${id === "shift" ? "text-cyan-300" : "text-primary"}`}><Icon aria-hidden className="size-6" /><ArrowRight aria-hidden className="size-4 rtl:rotate-180" /></span>
            <span className={id === "shift" ? "text-2xl font-bold" : "font-bold"}>{title[language]}</span>
            <span className={id === "shift" ? "text-sm text-slate-300" : "text-sm text-muted-foreground"}>{detail[language]}</span>
          </a>
        ))}
      </nav>
      <section hidden={workspace !== "orientation"} tabIndex={-1} id="orientation" className={`${card} scroll-mt-24 focus:outline-none`} lang="en" dir="ltr">
        <h2 className="text-xl font-bold">ICU Orientation Path</h2>
        <ol className="divide-y divide-border">
          {orientation.map(({ title, lesson, practice }) => {
            const done = lessons.some((item) => item.key === lesson && item.completed);
            return (
              <li key={lesson} className="py-3">
                <h3 className="font-semibold">{title}</h3>
                <div className="flex flex-wrap gap-x-5">
                  <Link className={link} href={`/working/${lesson}`}>{done ? "Revisit completed lesson" : "Open lesson"}</Link>
                  {practice.startsWith("#") ? <a className={link} href={practice} onClick={() => setWorkspace(workspaces.find(({ id }) => practice === `#${id}`)?.id ?? null)}>Try practice</a> : <Link className={link} href={practice}>Try practice</Link>}
                </div>
              </li>
            );
          })}
        </ol>
      </section>
      {activities.map((activity) => {
        const run = runs[activity.id];
        return (
        <section key={activity.id} hidden={workspace !== activity.id} tabIndex={-1} id={activity.id} className={`${card} scroll-mt-24 focus:outline-none`} lang="en" dir="ltr">
          <h2 className="text-xl font-bold">{activity.title}</h2>
          <p className="text-muted-foreground">{activity.intro}</p>
          {run
            ? <ActivityPlayer key={run.version} activity={activity} retryIndex={run.retryIndex} onAnswer={saveResult} />
            : <button type="button" className={primaryButton} onClick={() => setRuns({ ...runs, [activity.id]: { version: 0 } })}>Start {activity.title}</button>}
          {"source" in activity && <div><a className={link} href={activity.source.href}>{activity.source.label}</a></div>}
          {activity.id === "visual-skills" && <Link className={link} href="/waveforms">Practise interpreting ventilator waveforms</Link>}
        </section>
        );
      })}
      <section hidden={workspace !== "mistakes"} tabIndex={-1} id="mistakes" className={`${card} scroll-mt-24 focus:outline-none`} lang="en" dir="ltr">
        <h2 className="text-xl font-bold">Review My Mistakes</h2>
        <p className="text-sm text-muted-foreground">Lab decisions are saved in this browser. Question-bank answers follow your usual study progress.</p>
        {review ? <RevisionSession items={review} locale={locale} onFinish={() => setReview(null)} /> : (
          <>
            <div className="flex flex-wrap gap-2">
              {missedQuestions.length > 0 && <button className={button} onClick={() => setReview(missedQuestions.slice(0, 20))}>Retry missed questions ({missedQuestions.length})</button>}
              {freshQuestions.length > 0 && <button className={button} onClick={() => setReview(freshQuestions.slice(0, 20))}>Try new questions on those topics</button>}
            </div>
            {!missedQuestions.length && !missedDecisions.length && <p>No missed answers to review yet. Start with the <a className="text-primary underline" href="#shift" onClick={() => setWorkspace("shift")}>ICU Shift Simulator</a>.</p>}
            {missedDecisions.map(({ activity, step, i }) => (
              <details key={step.prompt} className="rounded-lg border border-border p-3">
                <summary className="cursor-pointer font-semibold">{step.prompt}</summary>
                <p className="my-2">{step.why}</p>
                <a className={link} href={`#${activity.id}`} onClick={() => { setWorkspace(activity.id); setRuns((current) => ({ ...current, [activity.id]: { version: (current[activity.id]?.version ?? 0) + 1, retryIndex: i } })); }}>Retry in {activity.title}</a>
              </details>
            ))}
          </>
        )}
      </section>
    </div>
  );
}
