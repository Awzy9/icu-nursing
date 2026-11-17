"use client";
import type { SavedModule } from "@/lib/working/activity-types";
import { useLearning } from "./progress";
import { AccountLearningStatus } from "./account-status";
export function ModuleSave({module,locale}:{module:SavedModule;locale:string}){
 const s=useLearning(),ar=locale==="ar",saved=s.bookmarks.some(b=>b.key===module.key),completed=s.lessons.some(l=>l.key===module.key&&l.completed);
 return <div className="space-y-3"><AccountLearningStatus locale={locale}/>{s.accountId?<div className="flex flex-wrap gap-3"><button disabled={s.busy} aria-pressed={saved} onClick={()=>s.bookmark(module,!saved)} className="min-h-11 rounded-xl border border-border bg-card px-4">{saved?(ar?"إزالة من المحفوظات":"Remove bookmark"):(ar?"حفظ لوقت لاحق":"Save for later")}</button><button disabled={s.busy} aria-pressed={completed} onClick={()=>s.complete(module,!completed)} className="min-h-11 rounded-xl border border-border bg-card px-4">{completed?(ar?"مكتملة ✓ — تراجع":"Completed ✓ — undo"):(ar?"وضع علامة مكتملة":"Mark as completed")}</button></div>:null}</div>;
}
