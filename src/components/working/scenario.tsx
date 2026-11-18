"use client";
import { useEffect, useRef, useState } from "react";
import type { LearningScenario } from "@/lib/working/model";
import { useLearning } from "./progress";
import { EquipmentVisual } from "./equipment-visual";
import caseVisuals from "../../../content/working-case-visuals.json";
import { WaveformChart } from "./waveform-chart";
import { ecgExercise } from "@/lib/working/ecg";

const wideComplexTrace = ecgExercise(caseVisuals.rhythm.exerciseKey)?.trace;
const equipmentByCase: Readonly<Record<string, string>> = caseVisuals.equipment;

export function ScenarioPlayer({scenario,locale,moduleKey,title}:{scenario:LearningScenario;locale:string;moduleKey:string;title:string}) {
 const version=JSON.stringify(scenario.steps.map(s=>({p:s.position,n:s.options.length})));
 const href=`/working/${moduleKey}`;
 const {saveSession,discardSession,sessions}=useLearning();
 const saved=sessions.find(s=>s.key===moduleKey&&s.kind==="scenario"&&!s.finished);
 const staleRef=useRef(false);
 const validSaved=saved&&saved.version===version?saved:undefined;
 useEffect(()=>{if(saved&&saved.version!==version&&!staleRef.current){staleRef.current=true;discardSession(moduleKey);}},[saved,version,moduleKey,discardSession]);
 // `validSaved` is reactive (it has to be, to pick up the guest value once useSyncExternalStore settles
 // past its hydration-safe default). But this scenario's own saves also flow back into it mid-play, so
 // the resume prompt must only show before the learner has done anything *in this mount* - tracked by
 // a ref, not state, since the moment of the first interaction is all that matters, not a frozen snapshot.
 const interacted=useRef(false);
 const [position,setPosition]=useState(scenario.steps[0]?.position),[points,setPoints]=useState(0),[choice,setChoice]=useState<number|null>(null),[revealed,setRevealed]=useState(false),[done,setDone]=useState(false);
 const ar=locale==="ar",step=scenario.steps.find(s=>s.position===position),option=choice===null?undefined:step?.options[choice];
 if(!step)return null;
 const showRhythm = moduleKey === caseVisuals.rhythm.caseKey && caseVisuals.rhythm.positions.includes(step.position);
 const equipmentKey = equipmentByCase[moduleKey];

 if(validSaved&&!interacted.current){
  return <section className="rounded-2xl border-2 border-primary bg-card p-6 sm:p-8 space-y-4" role="status">
   <h2 className="text-lg font-bold">{ar?"لديك سيناريو غير مكتمل":"You have an unfinished scenario"}</h2>
   <p className="text-muted-foreground">{ar?`توقفت عند الخطوة ${scenario.steps.findIndex(s=>s.position===validSaved.position)+1} من ${scenario.steps.length}.`:`You stopped at step ${scenario.steps.findIndex(s=>s.position===validSaved.position)+1} of ${scenario.steps.length}.`}</p>
   <div className="flex flex-wrap gap-3">
    <button onClick={()=>{interacted.current=true;setPosition(validSaved.position);setPoints(validSaved.score);}} className="min-h-11 rounded-xl bg-primary px-5 font-semibold text-primary-foreground">{ar?"استمر":"Resume"}</button>
    <button onClick={()=>{if(confirm(ar?"سيتم حذف تقدمك غير المكتمل في هذا السيناريو. متابعة؟":"This will discard your unfinished progress in this scenario. Continue?")){interacted.current=true;discardSession(moduleKey);}}} className="min-h-11 rounded-xl border border-border px-5">{ar?"البدء من جديد":"Start over"}</button>
   </div>
  </section>;
 }

 if(done)return <section className="rounded-2xl border border-border bg-card p-6 space-y-5"><p className="text-primary font-semibold">{ar?"اكتمل السيناريو":"Scenario complete"}</p><h2 className="text-2xl font-bold">{ar?"ما تعلمته":"Your takeaways"}</h2><ul className="list-disc space-y-3 ps-5" lang="en" dir="ltr">{scenario.takeaways.map(t=><li key={t}>{t}</li>)}</ul><button className="min-h-11 rounded-xl border px-5" onClick={()=>{discardSession(moduleKey);setDone(false);setPosition(scenario.steps[0]?.position);setPoints(0);setChoice(null);setRevealed(false);}}>{ar?"إعادة السيناريو":"Restart scenario"}</button></section>;
 return <section className="space-y-6 rounded-2xl border border-border bg-card p-5 sm:p-8"><div className="flex justify-between gap-3 text-sm text-muted-foreground"><span>{ar?"سيناريو تعليمي لحالة افتراضية":"Fictional learning scenario"}</span><span>{ar?"الخطوة":"Step"} {scenario.steps.indexOf(step)+1} / {scenario.steps.length}</span></div><div lang="en" dir="ltr" className="space-y-5"><p className="rounded-xl bg-muted p-5 leading-7">{step.info}</p>{step.observations?.length?<dl className="grid grid-cols-2 gap-3">{step.observations.map(o=><div key={o.label} className="rounded-xl border border-border p-3"><dt className="text-xs text-muted-foreground">{o.label}</dt><dd className="mt-1 font-semibold">{o.value} {o.unit}</dd></div>)}</dl>:null}{showRhythm&&wideComplexTrace?<div className="space-y-2 rounded-xl border border-border p-4">
  <p className="text-sm font-semibold">{ar?"مثال توضيحي لشريط نظم واسع المركّبات":"Illustrative wide-complex rhythm strip"}</p>
  <WaveformChart trace={wideComplexTrace} locale={locale}/>
 </div>:null}<fieldset disabled={revealed} className="space-y-3"><legend className="mb-4 text-xl font-semibold">{step.prompt}</legend>{step.options.map((o,i)=><label key={i} className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer ${choice===i?"border-primary bg-primary/5":"border-border hover:bg-muted"}`}><input className="mt-1.5 size-4 accent-primary" type="radio" name={"scenario-"+position} checked={choice===i} onChange={()=>setChoice(i)}/><span className="leading-7">{o.text}</span></label>)}</fieldset></div>{revealed&&option?<div role="status" lang="en" dir="ltr" className="space-y-3 rounded-xl bg-muted p-5"><h3 className="font-bold">Decision feedback</h3><p className="leading-7">{option.feedback}</p>{option.consequence?<p className="leading-7"><strong>What happens next: </strong>{option.consequence}</p>:null}</div>:null}{revealed&&equipmentKey&&step.position===scenario.steps[0]?.position?<EquipmentVisual moduleKey={equipmentKey} locale={locale}/>:null}<div className="flex justify-end"><button disabled={choice===null} className="min-h-12 rounded-xl bg-primary px-6 text-primary-foreground disabled:opacity-40" onClick={()=>{
  interacted.current=true;
  if(!revealed){setRevealed(true);return;}
  const newPoints=points+(option?.points??0),next=option?.next;
  setPoints(newPoints);
  if(next==null){setDone(true);saveSession({key:moduleKey,title,href,type:"cases"},"scenario",version,position!,newPoints,true);return;}
  saveSession({key:moduleKey,title,href,type:"cases"},"scenario",version,next,newPoints,false);
  setPosition(next);setChoice(null);setRevealed(false);
 }}>{revealed?(option?.next==null?(ar?"إنهاء ومراجعة":"Finish and reflect"):(ar?"متابعة":"Continue")):(ar?"تأكيد القرار":"Confirm decision")}</button></div></section>;
}
