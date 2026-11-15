"use client";
import { useCallback, useEffect, useState } from "react";

/** Per-device convenience state only (not synced to an account): viewed diagram parts and bookmarks. Every access is guarded. */
const KEY = "icu-equipment-v1";
type Store = { viewed: Record<string, string[]>; bookmarks: string[] };
const empty = (): Store => ({ viewed: {}, bookmarks: [] });

function read(): Store {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return empty();
    const p = JSON.parse(raw) as Partial<Store>;
    return { viewed: typeof p.viewed === "object" && p.viewed ? p.viewed : {}, bookmarks: Array.isArray(p.bookmarks) ? p.bookmarks.filter((x) => typeof x === "string") : [] };
  } catch {
    return empty();
  }
}
function write(s: Store) {
  try { window.localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage unavailable: state simply is not kept */ }
}

export function useEquipmentStore() {
  const [store, setStore] = useState<Store>(empty);
  const [ready, setReady] = useState(false);
  useEffect(() => { setStore(read()); setReady(true); }, []);
  const markViewed = useCallback((code: string, part: string) => {
    setStore((s) => {
      const cur = s.viewed[code] ?? [];
      if (cur.includes(part)) return s;
      const next = { ...s, viewed: { ...s.viewed, [code]: [...cur, part] } };
      write(next);
      return next;
    });
  }, []);
  const toggleBookmark = useCallback((code: string) => {
    setStore((s) => {
      const next = { ...s, bookmarks: s.bookmarks.includes(code) ? s.bookmarks.filter((c) => c !== code) : [...s.bookmarks, code] };
      write(next);
      return next;
    });
  }, []);
  return { store, ready, markViewed, toggleBookmark };
}
