"use client";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { WorkingBody } from "./body";
import { LearningQuiz } from "./quiz";
import { PracticePlayer } from "./practice";
import { ScenarioPlayer } from "./scenario";
import { StepSequenceExercise } from "./step-sequence-exercise";
import type { WorkingEntry } from "@/lib/working/model";

// Cross-links from an existing lesson/skill module to the matching interactive lab or tool.
// Keyed by entry.key; an entry can appear more than once in LAB_LINKS (array), each rendered
// as its own callout.
const LAB_LINKS: Record<string, { href: string; label: [string, string] }[]> = {
  "EQ-02": [
    { href: "/waveforms", label: ["Try the ventilator waveform interpretation exercises", "جرّب تمارين تفسير منحنيات جهاز التنفس"] },
    { href: "/vent-lab", label: ["Try the interactive ventilator parameter panel", "جرّب لوحة ضبط جهاز التنفس التفاعلية"] },
  ],
  "SK-07": [{ href: "/vent-lab", label: ["Try the interactive ventilator parameter panel", "جرّب لوحة ضبط جهاز التنفس التفاعلية"] }],
  "D02-T02": [{ href: "/ecg", label: ["Try the ECG rhythm strip interpretation exercises", "جرّب تمارين تفسير شرائط تخطيط القلب"] }],
  "SK-18": [{ href: "/ecg", label: ["Try the ECG rhythm strip interpretation exercises", "جرّب تمارين تفسير شرائط تخطيط القلب"] }],
  "D04-T08": [{ href: "/abg", label: ["Try the ABG interpretation cases", "جرّب حالات تفسير غازات الدم الشرياني"] }],
  "D02-T08": [{ href: "/hemo-lab", label: ["Try the hemodynamic monitoring laboratory", "جرّب مختبر المراقبة الديناميكية الدموية"] }],
  "EQ-06": [{ href: "/crrt", label: ["Try the CRRT circuit laboratory", "جرّب مختبر دائرة العلاج الكلوي المستمر"] }],
  "SK-17": [{ href: "/crrt", label: ["Try the CRRT circuit laboratory", "جرّب مختبر دائرة العلاج الكلوي المستمر"] }],
  "D03-T01": [{ href: "/gcs", label: ["Try the Glasgow Coma Scale trainer", "جرّب مدرّب مقياس غلاسكو للغيبوبة"] }],
  "SK-24": [{ href: "/gcs", label: ["Try the Glasgow Coma Scale trainer", "جرّب مدرّب مقياس غلاسكو للغيبوبة"] }],
  "EQ-04": [{ href: "/infusion-practice", label: ["Try the infusion-rate practice problems", "جرّب تمارين حساب معدل التسريب"] }],
  "SK-22": [{ href: "/infusion-practice", label: ["Try the infusion-rate practice problems", "جرّب تمارين حساب معدل التسريب"] }],
  "SK-01": [{ href: "/aline", label: ["Try the arterial line square-wave test exercises", "جرّب تمارين اختبار الموجة المربعة للخط الشرياني"] }],
  "EQ-03": [{ href: "/aline", label: ["Try the arterial line square-wave test exercises", "جرّب تمارين اختبار الموجة المربعة للخط الشرياني"] }],
};
export function ModuleReader({entry,locale,stepOrder}:{entry:WorkingEntry;locale:string;stepOrder?:number[]}) {
 const ar=locale==="ar", [tab,setTab]=useState(entry.type==="questions"?"quiz":entry.scenario?"scenario":entry.practice?"practice":"read"),[active,setActive]=useState(0),[checks,setChecks]=useState<string[]>([]);
 const canSequence=(entry.checklist?.length??0)>=2 && !!stepOrder;
 // pieces[0] is whatever precedes the first "## " heading - for topics, the H1 title and draft banner already shown in the page header; for other
 // content types it is always empty. Drop it rather than show it as a synthetic, duplicate "Overview" section ahead of the real one.
 const pieces=entry.body.split(/^## /m),sections=pieces.slice(1).map((text)=>({title:text.split("\n")[0]!.replace(/^\d+[.]\s*/,""),body:text.slice(text.indexOf("\n")+1)})).filter(s=>s.body.trim()&&!/^17[.]?\s*MCQs|^MCQs/i.test(s.title));
 const referenceSections=sections.filter(s=>/reference|source|gap|permission|limitation/i.test(s.title)),lessons=sections.filter(s=>!referenceSections.includes(s));
 const tabs=[...(entry.practice?[{id:"practice",label:ar?"التدريب":"Exercise"}]:[]),...(!entry.scenario&&!entry.practice&&entry.type!=="questions"?[{id:"read",label:ar?"الدرس":"Lesson"}]:[]),...(entry.scenario?[{id:"scenario",label:ar?"السيناريو":"Scenario"}]:[]),...(entry.checklist?.length?[{id:"checklist",label:ar?"قائمة الممارسة":"Practice checklist"}]:[]),...(canSequence?[{id:"sequence",label:ar?"رتّب الخطوات":"Order the steps"}]:[]),...(entry.questions?.length?[{id:"quiz",label:ar?"اختبر نفسك":"Test yourself"}]:[]),...(referenceSections.length?[{id:"references",label:ar?"المراجع والحدود":"Sources & limitations"}]:[])];
 const section=lessons[Math.min(active,Math.max(0,lessons.length-1))];
 return <div className="space-y-6">{(LAB_LINKS[entry.key]??[]).map((l)=><Link key={l.href} href={l.href} className="flex items-center justify-between gap-3 rounded-2xl border-2 border-primary bg-card p-4"><span className="font-semibold">{l.label[ar?1:0]}</span><ArrowRight aria-hidden className="size-4 shrink-0 text-primary rtl:rotate-180"/></Link>)}<nav aria-label={ar?"أقسام الوحدة":"Module sections"} className="flex flex-wrap gap-2 border-b border-border pb-4">{tabs.map(t=><button key={t.id} aria-pressed={tab===t.id} onClick={()=>setTab(t.id)} className={`min-h-11 rounded-xl px-5 text-sm font-semibold ${tab===t.id?"bg-primary text-primary-foreground":"bg-card border border-border hover:bg-muted"}`}>{t.label}</button>)}</nav>
 {tab==="practice"&&entry.practice?<PracticePlayer exercise={entry.practice} locale={locale}/>:null}
 {tab==="quiz"?<LearningQuiz questions={entry.questions??[]} moduleKey={entry.key} title={entry.title} locale={locale}/>:null}
 {tab==="scenario"&&entry.scenario?<><div className="rounded-2xl border border-border bg-card p-5 space-y-3"><h2 className="text-lg font-semibold">{ar?"ملخص الحالة":"The situation"}</h2><p lang="en" dir="ltr" className="leading-7">{entry.scenario.setting}</p><details><summary className="cursor-pointer py-2 text-sm text-primary">{ar?"أهداف التعلم":"What you’ll practise"}</summary><ul lang="en" dir="ltr" className="mt-3 list-disc space-y-2 ps-5">{entry.scenario.objectives.map(o=><li key={o}>{o}</li>)}</ul></details></div><ScenarioPlayer scenario={entry.scenario} locale={locale} moduleKey={entry.key} title={entry.title}/></>:null}
 {tab==="read"&&section?<div className="grid items-start gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]"><div className="lg:hidden"><label htmlFor="lesson-section" className="mb-2 block text-sm font-semibold">{ar?"انتقل إلى قسم":"Jump to a section"}</label><select id="lesson-section" value={active} onChange={e=>setActive(Number(e.target.value))} className="min-h-12 w-full rounded-xl border border-border bg-card px-3">{lessons.map((s,i)=><option key={i} value={i}>{i+1}. {s.title}</option>)}</select></div><nav aria-label={ar?"محتويات الدرس":"Lesson contents"} className="hidden lg:block rounded-2xl border border-border bg-card p-3 lg:sticky lg:top-6"><p className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">{ar?"في هذا الدرس":"IN THIS LESSON"}</p>{lessons.map((s,i)=><button key={i} onClick={()=>setActive(i)} aria-current={i===active?"step":undefined} className={`flex w-full items-start gap-3 rounded-lg px-3 py-3 text-start text-sm ${i===active?"bg-primary/10 font-semibold text-primary":"hover:bg-muted"}`}><span className="tabular-nums text-muted-foreground">{String(i+1).padStart(2,"0")}</span><span lang="en" dir="ltr">{s.title}</span></button>)}</nav><section className="min-w-0 rounded-2xl border border-border bg-card p-5 sm:p-8"><p className="text-xs font-semibold uppercase tracking-wider text-primary">{ar?"القسم":"SECTION"} {active+1} / {lessons.length}</p><h2 className="mb-6 mt-2 text-2xl font-bold" lang="en" dir="ltr">{section.title}</h2><WorkingBody body={section.body}/><div className="mt-8 flex justify-between gap-3 border-t border-border pt-5"><button disabled={active===0} onClick={()=>setActive(i=>i-1)} className="min-h-11 rounded-xl border border-border px-4 disabled:opacity-30">{ar?"السابق":"Previous"}</button><button onClick={()=>{if(active+1<lessons.length)setActive(i=>i+1);else if(entry.questions?.length)setTab("quiz");else setActive(0);}} className="min-h-11 rounded-xl bg-primary px-5 text-primary-foreground">{active+1<lessons.length?(ar?"القسم التالي":"Next section"):entry.questions?.length?(ar?"اختبر نفسك":"Test yourself"):(ar?"العودة للبداية":"Back to start")}</button></div></section></div>:null}
 {tab==="checklist"?<section className="rounded-2xl border border-border bg-card p-5 sm:p-8 space-y-5"><h2 className="text-xl font-bold">{ar?"قائمة الممارسة الذاتية":"Self-study checklist"}</h2><p className="text-sm text-muted-foreground">{ar?"للمراجعة الذاتية، ولا تثبت الكفاءة السريرية. تُعاد القائمة عند مغادرة الصفحة.":"For self-study; this does not certify clinical competence. This checklist resets when you leave the page."}</p><p className="font-semibold text-primary">{checks.length} / {entry.checklist?.length}</p>{entry.checklist?.map((item,i)=><label key={i} className="flex gap-4 rounded-xl border border-border p-4 cursor-pointer" lang="en" dir="ltr"><input type="checkbox" className="mt-1 size-5 shrink-0 accent-primary" checked={checks.includes(item)} onChange={e=>setChecks(v=>e.target.checked?[...v,item]:v.filter(t=>t!==item))}/><span className="leading-7">{item}</span></label>)}</section>:null}
 {tab==="sequence"&&canSequence?<StepSequenceExercise moduleKey={entry.key} title={entry.title} steps={entry.checklist!} initialOrder={stepOrder!} locale={locale}/>:null}
 {tab==="references"?<section className="space-y-3">{referenceSections.map((s,i)=><details key={i} className="rounded-2xl border border-border bg-card p-5"><summary className="cursor-pointer font-semibold" lang="en" dir="ltr">{s.title}</summary><WorkingBody body={s.body}/></details>)}</section>:null}
 </div>;
}
