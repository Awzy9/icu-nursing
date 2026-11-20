"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { activities, orientation } from "@/lib/working/nursing-lab";
import { computeRevisionQueue, type RevisionQuestion, type RevisionStatus } from "@/lib/working/revision";
import { EquipmentVisual } from "./equipment-visual";
import { useLearning } from "./progress";
import { RevisionSession } from "./revision";

const card = "space-y-4 rounded-2xl border border-border bg-card p-5 sm:p-6";
const button = "inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-sm font-semibold hover:bg-muted disabled:opacity-50";
const link = "inline-flex min-h-11 items-center font-semibold text-primary underline";
type Activity = typeof activities[number];
type Results = Record<string, boolean>;

function ActivityPlayer({ activity, onAnswer }: { activity: Activity; onAnswer: (key: string, correct: boolean) => void }) {
  const [ index, setIndex ] = useState(0);
  const [ choice, setChoice ] = useState<number | null>(null);
  const [ checked, setChecked ] = useState(false);
  const [ score, setScore ] = useState(0);
  const step = activity.steps[index];
  if (!step) return (
    <div className="space-y-3">
      <p role="status">Activity complete. {score} of {activity.steps.length} correct.</p>
      {activity.id === "shift" && <Link className={link} href="/working/D01-T09">Review ventilator alarms</Link>}
      {activity.id === "medication-checks" && <Link className={link} href="/working/SK-22">Review infusion pump safety</Link>}
      <div><button className={button} type="button" onClick={() => { setIndex(0); setScore(0); }}>Restart activity</button></div>
    </div>
  );

  return (
    <div className="space-y-4" lang="en" dir="ltr">
      <p className="text-sm text-muted-foreground">Decision {index + 1} of {activity.steps.length}</p>
      {"equipment" in step && <EquipmentVisual moduleKey={step.equipment} locale="en" />}
      <fieldset className="space-y-2" disabled={checked}>
        <legend className="mb-2 font-semibold">{step.prompt}</legend>
        {step.choices.map((text, i) => (
          <label key={text} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2">
            <input type="radio" name={activity.id} checked={choice === i} onChange={() => setChoice(i)} />
            <span>{text}</span>
          </label>
        ))}
      </fieldset>
      {checked ? (
        <>
          <p role="status" className="rounded-lg bg-muted p-4"><strong>{choice === step.answer ? "Correct. " : "Review this decision. "}</strong>{step.why}</p>
          <button className={button} type="button" onClick={() => { setIndex(index + 1); setChoice(null); setChecked(false); }}>
            {index + 1 === activity.steps.length ? "Finish activity" : "Next decision"}
          </button>
        </>
      ) : (
        <button className={button} type="button" disabled={choice === null} onClick={() => {
          if (choice === null) return;
          const correct = choice === step.answer;
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
  const [ results, setResults ] = useState<Results>({});
  const [ review, setReview ] = useState<RevisionStatus[] | null>(null);
  const [ runs, setRuns ] = useState<Record<string, number>>({});
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
    results[`${activity.id}-${i}`] === false ? [{ activity, step }] : []));
  const titles = [...activities, { id: "orientation", title: "ICU Orientation Path" }, { id: "mistakes", title: "Review My Mistakes" }];

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold">{locale === "ar" ? "مختبر تمريض العناية المركزة" : "ICU Nursing Lab"}</h1>
        <p className="text-muted-foreground">{locale === "ar" ? "تمارين خيالية للتعلم. محتوى الأنشطة باللغة الإنجليزية." : "Practise with fictional cases and equipment examples."}</p>
      </header>
      <nav aria-label={locale === "ar" ? "الأنشطة" : "Lab activities"} className="flex flex-wrap gap-2" lang="en">
        {titles.map(({ id, title }) => <a key={id} className={button} href={`#${id}`}>{title}</a>)}
      </nav>
      <section id="orientation" className={`${card} scroll-mt-24`} lang="en" dir="ltr">
        <h2 className="text-xl font-bold">ICU Orientation Path</h2>
        <ol className="divide-y divide-border">
          {orientation.map(({ title, lesson, practice }) => {
            const done = lessons.some((item) => item.key === lesson && item.completed);
            return (
              <li key={lesson} className="py-3">
                <h3 className="font-semibold">{title}</h3>
                <div className="flex flex-wrap gap-x-5">
                  <Link className={link} href={`/working/${lesson}`}>{done ? "Revisit completed lesson" : "Open lesson"}</Link>
                  <a className={link} href={practice}>Try practice</a>
                </div>
              </li>
            );
          })}
        </ol>
      </section>
      {activities.map((activity) => (
        <section key={activity.id} id={activity.id} className={`${card} scroll-mt-24`} lang="en" dir="ltr">
          <h2 className="text-xl font-bold">{activity.title}</h2>
          <p className="text-muted-foreground">{activity.intro}</p>
          {runs[activity.id] !== undefined
            ? <ActivityPlayer key={runs[activity.id]} activity={activity} onAnswer={saveResult} />
            : <button type="button" className={button} onClick={() => setRuns({ ...runs, [activity.id]: 0 })}>Start {activity.title}</button>}
          {"source" in activity && <div><a className={link} href={activity.source.href}>{activity.source.label}</a></div>}
          {activity.id === "visual-skills" && <Link className={link} href="/waveforms">Practise interpreting ventilator waveforms</Link>}
        </section>
      ))}
      <section id="mistakes" className={`${card} scroll-mt-24`} lang="en" dir="ltr">
        <h2 className="text-xl font-bold">Review My Mistakes</h2>
        <p className="text-sm text-muted-foreground">Lab decisions are saved in this browser. Question-bank answers follow your usual study progress.</p>
        {review ? <RevisionSession items={review} locale={locale} onFinish={() => setReview(null)} /> : (
          <>
            <div className="flex flex-wrap gap-2">
              {missedQuestions.length > 0 && <button className={button} onClick={() => setReview(missedQuestions.slice(0, 20))}>Retry missed questions ({missedQuestions.length})</button>}
              {freshQuestions.length > 0 && <button className={button} onClick={() => setReview(freshQuestions.slice(0, 20))}>Try new questions on those topics</button>}
            </div>
            {!missedQuestions.length && !missedDecisions.length && <p>No missed answers to review yet. Try an activity or visit the <Link className="text-primary underline" href="/question-bank">question bank</Link>.</p>}
            {missedDecisions.map(({ activity, step }) => (
              <details key={step.prompt} className="rounded-lg border border-border p-3">
                <summary className="cursor-pointer font-semibold">{step.prompt}</summary>
                <p className="my-2">{step.why}</p>
                <a className={link} href={`#${activity.id}`} onClick={() => setRuns((current) => ({ ...current, [activity.id]: (current[activity.id] ?? 0) + 1 }))}>Retry in {activity.title}</a>
              </details>
            ))}
          </>
        )}
      </section>
    </div>
  );
}
