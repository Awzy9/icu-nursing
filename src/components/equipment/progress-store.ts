"use client";
import { useCallback, useState } from "react";
import { markEquipmentPartViewedAction, setEquipmentBookmarkAction } from "@/app/[locale]/equipment/actions";
import type { EquipmentState } from "@/lib/equipment/state";

/**
 * Learning state saved in the learner's account (server side). Updates are optimistic and rolled back if the server refuses;
 * nothing is kept in the browser, so the same state appears on every device and session.
 */
export function useEquipmentState(initial: EquipmentState) {
  const [state, setState] = useState<EquipmentState>(initial);
  const [error, setError] = useState<string | null>(null);
  const markViewed = useCallback(async (code: string, part: string) => {
    if ((state.viewed[code] ?? []).includes(part)) return;
    const before = state;
    setState((s) => ({ ...s, viewed: { ...s.viewed, [code]: [...(s.viewed[code] ?? []), part] } }));
    const r = await markEquipmentPartViewedAction(code, part);
    if (!r.ok) { setState(before); setError(r.error); } else setError(null);
  }, [state]);
  const toggleBookmark = useCallback(async (code: string) => {
    const before = state;
    const on = !state.bookmarks.includes(code);
    setState((s) => ({ ...s, bookmarks: on ? [...s.bookmarks, code] : s.bookmarks.filter((c) => c !== code) }));
    const r = await setEquipmentBookmarkAction(code, on);
    if (!r.ok) { setState(before); setError(r.error); } else setError(null);
  }, [state]);
  return { state, error, markViewed, toggleBookmark };
}
