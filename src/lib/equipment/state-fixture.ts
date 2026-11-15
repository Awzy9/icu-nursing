import "server-only";
import { EquipmentError, type EquipmentState, type EquipmentStateService } from "./state";

/** In-memory twin of the eq_* database functions (fixture mode, development and end-to-end tests). Same ceilings and refusals. */
type Store = Map<string, { bookmarks: Set<string>; viewed: Map<string, string[]> }>;
const g = globalThis as unknown as { __eqFixtureStore?: Store };
export const sharedEquipmentStore = (): Store => (g.__eqFixtureStore ??= new Map());
const CODE = /^SYN-EQ-\d{3}$/, PART = /^[a-z]{1,24}$/;

export function createEquipmentFixtureService(userKey: string, opts: { store?: Store } = {}): EquipmentStateService {
  const store = opts.store ?? sharedEquipmentStore();
  if (!store.has(userKey)) {
    if (store.size >= 200) store.delete(store.keys().next().value as string);
    store.set(userKey, { bookmarks: new Set(), viewed: new Map() });
  }
  const me = store.get(userKey)!;
  const code = (c: string) => { if (!CODE.test(c)) throw new EquipmentError("invalid", "That selection is not valid."); };
  return {
    mode: "fixtures",
    async get(): Promise<EquipmentState> {
      return { fixtures: true, bookmarks: [...me.bookmarks].sort(), viewed: Object.fromEntries([...me.viewed].filter(([, p]) => p.length).map(([k, p]) => [k, [...p]])) };
    },
    async setBookmark(c, on) {
      code(c);
      if (on) { if (!me.bookmarks.has(c) && me.bookmarks.size >= 50) throw new EquipmentError("limit", "Too many bookmarks."); me.bookmarks.add(c); } else me.bookmarks.delete(c);
    },
    async markViewed(c, part) {
      code(c); if (!PART.test(part)) throw new EquipmentError("invalid", "That selection is not valid.");
      const cur = me.viewed.get(c) ?? [];
      if (cur.includes(part)) return;
      const total = [...me.viewed.values()].reduce((n, p) => n + p.length, 0);
      if (cur.length >= 8 || total >= 200) throw new EquipmentError("limit", "Too much progress recorded.");
      me.viewed.set(c, [...cur, part]);
    },
    async resetProgress(c) { code(c); me.viewed.delete(c); },
  };
}
