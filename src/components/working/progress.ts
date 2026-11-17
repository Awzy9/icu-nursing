"use client";
import { useSyncExternalStore } from "react";
export interface Attempt { id:string; title:string; href:string; correct:boolean; at:number }
const key = "icu-nursing-learning-v1", event = "icu-learning-change";
export function recordAttempt(attempt: Attempt) {
  try { const data: Record<string, Attempt> = JSON.parse(localStorage.getItem(key) ?? "{}"); data[attempt.id] = attempt; localStorage.setItem(key, JSON.stringify(data)); window.dispatchEvent(new Event(event)); } catch { /* Learning remains usable when browser storage is unavailable. */ }
}
function subscribe(callback:()=>void) { window.addEventListener("storage", callback); window.addEventListener(event,callback); return ()=>{window.removeEventListener("storage",callback);window.removeEventListener(event,callback);}; }
function snapshot() { try { return localStorage.getItem(key) ?? "{}"; } catch { return "{}"; } }
export function useAttempts(): Attempt[] { const value=useSyncExternalStore(subscribe,snapshot,()=>"{}"); try { return Object.values(JSON.parse(value)); } catch { return []; } }
