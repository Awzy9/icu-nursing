"use client";
import { Link } from "@/i18n/navigation";
import { useLearning } from "./progress";
export function AccountLearningStatus({locale}:{locale:string}){
 const s=useLearning(),ar=locale==="ar";
 return <div className="space-y-3"><div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm"><p>{s.accountId?(s.busy?(ar?"جارٍ الحفظ…":"Saving…"):s.pending?(ar?"توجد إجابات لم تُحفظ بعد":"Answers waiting to sync"):(ar?"مرتبط بحسابك. يُحفظ التقدم عبر أجهزتك.":"Connected to your account. Progress is saved across devices.")):(ar?"وضع الضيف: تُحفظ الإجابات على هذا المتصفح فقط.":"Guest practice: answers are saved on this browser only.")}</p>{s.accountId?<button disabled={s.busy} onClick={s.refresh} className="min-h-11 rounded-lg border border-border px-3 disabled:opacity-40">{ar?"تحديث":"Refresh"}</button>:<Link href="/login" className="font-semibold text-primary">{ar?"سجّل الدخول للمزامنة":"Sign in to sync"}</Link>}</div>{s.error||s.pending?<div role="alert" className="rounded-xl border border-border bg-muted p-4 text-sm space-y-3"><p>{s.error??(ar?"توجد إجابات لم تتم مزامنتها بعد.":"Some answers have not synced yet.")}</p><button disabled={s.busy} onClick={s.pending?s.retry:s.refresh} className="min-h-11 rounded-lg border border-border px-4">{ar?"إعادة المحاولة":"Retry"}</button></div>:null}</div>;
}
