"use client";
import { createContext,useCallback,useContext,useEffect,useState,useSyncExternalStore,type ReactNode } from "react";
import { saveLearningAnswer,setLearningBookmark,setLearningComplete,saveLearningSession,discardLearningSession,refreshLearning } from "@/app/[locale]/learning/actions";
import { emptyLearning,type Attempt,type LearningState,type SavedModule,type SessionRecord } from "@/lib/working/activity-types";
import { nextBox } from "@/lib/question-bank/leitner";
export type { Attempt, SessionRecord } from "@/lib/working/activity-types";
const guestKey="icu-nursing-learning-v1",sessionsKey="icu-nursing-sessions-v1",event="icu-learning-change";
// Same deterministic Leitner schedule as the signed-in path (public.working_record_attempt): the box moves
// from whatever this question's previous box was, read from the guest's own local history.
export function recordAttempt(attempt:Attempt){try{const data:Record<string,Attempt>=JSON.parse(localStorage.getItem(guestKey)??"{}");const box=nextBox(data[attempt.id]?.box??1,attempt.correct);data[attempt.id]={...attempt,box};localStorage.setItem(guestKey,JSON.stringify(data));window.dispatchEvent(new Event(event));}catch{/* Guest learning can continue without storage. */}}
function recordGuestSession(session:SessionRecord){try{const data:Record<string,SessionRecord>=JSON.parse(localStorage.getItem(sessionsKey)??"{}");data[session.key]=session;localStorage.setItem(sessionsKey,JSON.stringify(data));window.dispatchEvent(new Event(event));}catch{/* Guest sessions can continue without storage. */}}
function discardGuestSession(key:string){try{const data:Record<string,SessionRecord>=JSON.parse(localStorage.getItem(sessionsKey)??"{}");delete data[key];localStorage.setItem(sessionsKey,JSON.stringify(data));window.dispatchEvent(new Event(event));}catch{/* Guest sessions can continue without storage. */}}
function subscribe(callback:()=>void){window.addEventListener("storage",callback);window.addEventListener(event,callback);return()=>{window.removeEventListener("storage",callback);window.removeEventListener(event,callback);};}
function snapshot(){try{return localStorage.getItem(guestKey)??"{}";}catch{return "{}";}}
function sessionsSnapshot(){try{return localStorage.getItem(sessionsKey)??"{}";}catch{return "{}";}}
function useGuestAttempts(){const raw=useSyncExternalStore(subscribe,snapshot,()=>"{}");try{return Object.values(JSON.parse(raw)) as Attempt[];}catch{return [];}}
function useGuestSessions(){const raw=useSyncExternalStore(subscribe,sessionsSnapshot,()=>"{}");try{return Object.values(JSON.parse(raw)) as SessionRecord[];}catch{return [];}}
interface LearningContextValue extends LearningState {accountId:string|null;error:string|null;busy:boolean;saveAnswer:(a:Attempt)=>void;bookmark:(module:SavedModule,saved:boolean)=>void;complete:(module:SavedModule,completed:boolean)=>void;saveSession:(module:SavedModule,kind:"quiz"|"scenario",version:string,position:number,score:number,finished:boolean)=>void;discardSession:(key:string)=>void;retry:()=>void;refresh:()=>void;pending:number}
const Context=createContext<LearningContextValue|null>(null);
export function LearningProvider({accountId,initial=emptyLearning,loadError,children}:{accountId:string|null;initial?:LearningState;loadError?:string;children:ReactNode}){
 const [state,setState]=useState(initial),[error,setError]=useState<string|null>(loadError??null),[busy,setBusy]=useState(false),[pending,setPending]=useState<Attempt[]>([]);
 const pendingKey=accountId?`icu-learning-pending:${accountId}`:null;
 useEffect(()=>{if(!pendingKey)return;try{setPending(JSON.parse(localStorage.getItem(pendingKey)??"[]"));}catch{setPending([]);}},[pendingKey]);
 const persist=useCallback((values:Attempt[])=>{if(!pendingKey)return;try{localStorage.setItem(pendingKey,JSON.stringify(values));}catch{/* Error remains visible until a retry succeeds. */}},[pendingKey]);
 async function send(rawA:Attempt){
   if(!accountId){recordAttempt(rawA);return;}
   if(rawA.choice===undefined){setError("This older browser result cannot be synced. Answer the question again.");return;}
   // Mirrors the server's deterministic box update (public.working_record_attempt) so the due queue
   // reflects this answer immediately, without waiting for a refresh.
   const a:Attempt={...rawA,box:nextBox(state.attempts.find(x=>x.id===rawA.id)?.box??1,rawA.correct)};
   setBusy(true);
   try{
    const result=await saveLearningAnswer({id:a.id,moduleKey:a.href.split("/").pop(),choice:a.choice,at:a.at});
    if(!result.ok){setError(result.error);setPending(p=>{const n=p.some(x=>x.id===a.id&&x.at>a.at)?p:[...p.filter(x=>x.id!==a.id),a];persist(n);return n;});return;}
    setState(s=>s.attempts.some(x=>x.id===a.id&&x.at>a.at)?s:({...s,attempts:[...s.attempts.filter(x=>x.id!==a.id),a]}));
    setPending(p=>{const n=p.filter(x=>x.id!==a.id||x.at>a.at);persist(n);return n;});setError(null);
   }catch{setError("Could not save your answer. Retry when you are online.");setPending(p=>{const n=p.some(x=>x.id===a.id&&x.at>a.at)?p:[...p.filter(x=>x.id!==a.id),a];persist(n);return n;});}finally{setBusy(false);}
 }
 async function bookmark(module:SavedModule,saved:boolean){
   if(!accountId){setError("Sign in to save bookmarks to your account.");return;}
   setBusy(true);try{const r=await setLearningBookmark(module.key,saved);if(!r.ok){setError(r.error);return;}setState(s=>({...s,bookmarks:saved?[...s.bookmarks.filter(x=>x.key!==module.key),module]:s.bookmarks.filter(x=>x.key!==module.key)}));setError(null);}catch{setError("Could not update the bookmark. Please retry.");}finally{setBusy(false);}
 }
 async function complete(module:SavedModule,completed:boolean){
   if(!accountId){setError("Sign in to save completed modules to your account.");return;}
   setBusy(true);try{const r=await setLearningComplete(module.key,completed);if(!r.ok){setError(r.error);return;}setState(s=>({...s,lessons:[...s.lessons.filter(x=>x.key!==module.key),{...module,completed,at:Date.now()}]}));setError(null);}catch{setError("Could not save module progress. Please retry.");}finally{setBusy(false);}
 }
 async function saveSession(module:SavedModule,kind:"quiz"|"scenario",version:string,position:number,score:number,finished:boolean){
   const at=Date.now();
   if(!accountId){recordGuestSession({...module,kind,version,position,score,finished,at});return;}
   try{
    const result=await saveLearningSession({moduleKey:module.key,kind,version,position,score,finished,at});
    if(!result.ok){setError(result.error);return;}
    setState(s=>{const existing=s.sessions.find(x=>x.key===module.key);if(existing&&existing.at>at)return s;return {...s,sessions:[...s.sessions.filter(x=>x.key!==module.key),{...module,kind,version,position,score,finished,at}]};});
    setError(null);
   }catch{setError("Could not save your progress. Retry when you are online.");}
 }
 async function discardSession(key:string){
   if(!accountId){discardGuestSession(key);return;}
   try{const r=await discardLearningSession(key);if(!r.ok){setError(r.error);return;}setState(s=>({...s,sessions:s.sessions.filter(x=>x.key!==key)}));setError(null);}catch{setError("Could not discard this session. Please retry.");}
 }
 async function refresh(){if(!accountId)return;setBusy(true);try{const r=await refreshLearning();if(r.ok){setState(r.state);setError(null);}else setError(r.error);}catch{setError("Could not refresh your progress. Please retry.");}finally{setBusy(false);}}
 async function retry(){for(const a of pending)await send(a);await refresh();}
 const guest=useGuestAttempts(),guestSessions=useGuestSessions();
 return <Context.Provider value={{...state,attempts:accountId?state.attempts:guest,sessions:accountId?state.sessions:guestSessions,accountId,error,busy,pending:pending.length,saveAnswer:a=>void send(a),bookmark:(m,s)=>void bookmark(m,s),complete:(m,c)=>void complete(m,c),saveSession:(m,k,v,p,sc,f)=>void saveSession(m,k,v,p,sc,f),discardSession:k=>void discardSession(k),retry:()=>void retry(),refresh:()=>void refresh()}}>{children}</Context.Provider>;
}
export function useLearning(){
 const ctx=useContext(Context),guest=useGuestAttempts(),guestSessions=useGuestSessions();
 return ctx??{...emptyLearning,attempts:guest,sessions:guestSessions,accountId:null,error:null,busy:false,pending:0,saveAnswer:recordAttempt,bookmark:()=>{},complete:()=>{},saveSession:(m,k,v,p,sc,f)=>recordGuestSession({...m,kind:k,version:v,position:p,score:sc,finished:f,at:Date.now()}),discardSession:discardGuestSession,retry:()=>{},refresh:()=>{}};
}
export function useAttempts(){return useLearning().attempts;}
