import { useAuth } from "./provider";
import { isFreeCatalogEntry, isFreeIndex, isLockedStaticRoute, pathOf } from "../core/access";

/** Whether the guest limits apply right now, and helpers to ask about one item. Nothing is locked while accounts are unavailable, while the saved session is still loading, or once signed in. */
export function useAccess() {
  const { config, ready, email } = useAuth();
  const gateActive = Boolean(config) && ready && !email;
  return {
    gateActive,
    lockedHref: (href: unknown): boolean => { if (!gateActive) return false; const p = pathOf(href); return p !== null && isLockedStaticRoute(p); },
    lockedIndex: (index: number): boolean => gateActive && !isFreeIndex(index),
    lockedKey: (keys: readonly string[] | undefined, key: string): boolean => gateActive && keys !== undefined && !isFreeCatalogEntry(keys, key),
  };
}
