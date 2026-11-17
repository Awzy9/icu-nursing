"use client";
import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import type { LearningQuestion } from "@/lib/working/model";
import { WorkingBody } from "./body";
import { useLearning } from "./progress";
import { Link } from "@/i18n/navigation";
export function LearningQuiz({ questions, title, moduleKey, locale }: { questions:LearningQuestion[];title:string;moduleKey:string;locale:string }) {
  const [index,setIndex]=useState(0), [choice,setChoice]=useState<number|null>(null), [checked,setChecked]=useState(false), [score,setScore]=useState(0), [finished,setFinished]=useState(false);
  const {saveAnswer}=useLearning();
  const ar=locale==="ar", q=questions[index];
  if(!q) return <p>No questions are available for this lesson.</p>;
  const restart=()=>{setIndex(0);setChoice(null);setChecked(false);setScore(0);setFinished(false);};
  if(finished) return <section className="rounded-2xl border border-border bg-card p-6 sm:p-10 text-center space-y-5"><p className="text-sm font-semibold text-primary">{ar?"اكتملت الجلسة":"Session complete"}</p><h2 className="text-3xl font-bold">{score} / {questions.length}</h2><p className="text-muted-foreground">{ar?"راجع التفسيرات ثم أعد المحاولة لترسيخ فهمك.":"Review your explanations and try again to strengthen your understanding."}</p><div className="flex flex-wrap justify-center gap-3"><button onClick={restart} className="min-h-11 rounded-xl bg-primary px-5 text-primary-foreground">{ar?"إعادة المحاولة":"Try again"}</button><Link href="/study" className="min-h-11 rounded-xl border border-border px-5 py-3">{ar?"مراجعة الأخطاء":"Review mistakes"}</Link></div></section>;
  function submit() { if(choice===null || !q)return; setChecked(true);if(choice===q.answer)setScore(s=>s+1);saveAnswer({id:q.id,choice,title,href:`/working/${moduleKey}`,correct:choice===q.answer,at:Date.now()}); }
  function next() { if(index+1===questions.length){setFinished(true);return;}setIndex(i=>i+1);setChoice(null);setChecked(false); }
  return <section className="rounded-2xl border border-border bg-card p-5 sm:p-8 space-y-6" aria-label={ar?"اختبار تدريبي":"Practice quiz"}>
    <div className="flex items-center justify-between gap-3 text-sm"><span className="font-semibold text-primary">{ar?"السؤال":"Question"} {index+1} / {questions.length}</span><span className="text-muted-foreground">{ar?"اختر إجابة واحدة":"Choose one answer"}</span></div>
    <progress aria-label={ar?"تقدم الاختبار":"Quiz progress"} value={index} max={questions.length} className="h-1.5 w-full accent-primary" />
    {/* Correct/incorrect after checking is marked by an icon and a text label (not colour alone): the correct option always
        says so explicitly, and the learner's own choice is marked "Your answer" when it was wrong - two different signals,
        not two shades of the same colour, so the distinction survives colour-vision deficiency, grayscale and screen readers. */}
    <fieldset disabled={checked} className="space-y-3" lang="en" dir="ltr"><legend className="mb-5 text-lg font-semibold leading-8">{q.prompt}</legend>{q.options.map((option,i)=>{const isCorrect=checked&&i===q.answer,isMyWrong=checked&&choice===i&&i!==q.answer;return <label key={i} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${isCorrect?"border-success-foreground/60 bg-success text-success-foreground":isMyWrong?"border-danger-foreground/60 bg-danger text-danger-foreground":choice===i?"border-primary bg-primary/5":"border-border hover:bg-muted"}`}><input type="radio" name={q.id} value={i} checked={choice===i} onChange={()=>setChoice(i)} className="mt-1.5 size-4 accent-primary"/><span className="font-semibold">{String.fromCharCode(65+i)}</span><span className="flex-1 leading-7">{option}{isCorrect?<span className="mt-1 flex items-center gap-1 text-sm font-semibold"><CheckCircle2 className="size-4" aria-hidden/>{ar?"الإجابة الصحيحة":"Correct answer"}</span>:null}{isMyWrong?<span className="mt-1 flex items-center gap-1 text-sm font-semibold"><XCircle className="size-4" aria-hidden/>{ar?"إجابتك":"Your answer"}</span>:null}</span></label>;})}</fieldset>
    {checked?<div role="status" className="space-y-3 rounded-xl bg-muted p-5"><h3 className="font-bold">{choice===q.answer?(ar?"إجابة صحيحة":"Correct answer"):(ar?"لنراجع هذا السؤال":"Let’s review this question")}</h3><p>{ar?"الإجابة الصحيحة":"Correct choice"}: {String.fromCharCode(65+q.answer)}</p><WorkingBody body={q.explanation}/></div>:<p className="text-sm text-muted-foreground">{ar?"ستظهر الإجابة والتفسير بعد تأكيد اختيارك.":"The answer and explanation appear after you check your choice."}</p>}
    <div className="flex justify-end">{checked?<button onClick={next} className="min-h-12 rounded-xl bg-primary px-6 font-semibold text-primary-foreground">{index+1===questions.length?(ar?"عرض النتيجة":"View results"):(ar?"السؤال التالي":"Next question")}</button>:<button disabled={choice===null} onClick={submit} className="min-h-12 rounded-xl bg-primary px-6 font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40">{ar?"تحقق من الإجابة":"Check answer"}</button>}</div>
  </section>;
}
