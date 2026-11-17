import "server-only";
import { createClient } from "@/lib/supabase/server";
import { workingEntry } from "./index";
import type { LearningState } from "./activity-types";
export async function loadLearningState():Promise<LearningState> {
 const db=await createClient(); if(!db)throw Error("Account storage unavailable");
 const [attempts,bookmarks,lessons]=await Promise.all([db.from("working_attempts").select("question_id,module_key,choice,correct,answered_at"),db.from("working_bookmarks").select("module_key"),db.from("working_lessons").select("module_key,completed,updated_at")]);
 if(attempts.error||bookmarks.error||lessons.error)throw Error("Account progress could not be loaded");
 const describeModule=(key:string)=>{const e=workingEntry(key);return e?{key:e.key,title:e.title,type:e.type,href:`/working/${e.key}`}:null;};
 return {attempts:(attempts.data??[]).flatMap(a=>{const m=describeModule(a.module_key);return m?[{id:a.question_id,title:m.title,href:m.href,choice:a.choice,correct:a.correct,at:Date.parse(a.answered_at)}]:[];}),bookmarks:(bookmarks.data??[]).flatMap(b=>{const m=describeModule(b.module_key);return m?[m]:[];}),lessons:(lessons.data??[]).flatMap(l=>{const m=describeModule(l.module_key);return m?[{...m,completed:l.completed,at:Date.parse(l.updated_at)}]:[];})};
}
