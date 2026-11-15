import "server-only";
import { loadMedicationFixtures, type MedicationFixture } from "./fixtures";
import { MedicationError, type MedicationCard, type MedicationDetail, type MedicationFilter, type MedicationProgress, type MedicationService } from "./types";

/** In-memory engine for fixture mode (development and end-to-end tests). Mirrors the md_* database functions. */
interface FxUser { bookmarks: Set<string> }
export type MedicationStore = Map<string, FxUser>;
const g = globalThis as unknown as { __mdFixtureStore?: MedicationStore };
export const sharedMedicationStore = (): MedicationStore => (g.__mdFixtureStore ??= new Map());
const PUBLISHED = "2026-01-01T00:00:00.000Z";

export function createMedicationFixtureService(userKey: string, opts: { store?: MedicationStore; meds?: MedicationFixture[] } = {}): MedicationService {
  const store = opts.store ?? sharedMedicationStore();
  const meds = opts.meds ?? loadMedicationFixtures();
  if (!store.has(userKey)) {
    if (store.size >= 200) store.delete(store.keys().next().value as string);
    store.set(userKey, { bookmarks: new Set() });
  }
  const me = store.get(userKey)!;
  const card = (m: MedicationFixture): MedicationCard => ({ id: m.id, code: m.code, name: m.name, drug_class: m.drugClass, summary: m.summary, category: m.category, high_alert: m.highAlert, synthetic: true, bookmarked: me.bookmarks.has(m.id) });
  return {
    mode: "fixtures",
    async progress(): Promise<MedicationProgress> { return { available: meds.length, high_alert: meds.filter((m) => m.highAlert).length, bookmarked: me.bookmarks.size, synthetic_fixtures: true }; },
    async list(f: MedicationFilter = {}) {
      const q = f.query?.trim().toLowerCase();
      return meds.filter((m) => (!f.category || m.category === f.category) && (!f.highAlert || m.highAlert) && (!f.bookmarked || me.bookmarks.has(m.id))
        && (!q || JSON.stringify([m.name, m.drugClass, m.summary, m.code]).toLowerCase().includes(q)))
        .sort((a, b) => a.category.localeCompare(b.category) || a.code.localeCompare(b.code)).map(card);
    },
    async get(code) {
      const m = meds.find((x) => x.code === code);
      if (!m) return null;
      const d: MedicationDetail = {
        ...card(m), sections: m.sections, section_support: m.sectionSupport as MedicationDetail["section_support"], evidence_status: "unassessed", license_status: "unassessed",
        evidence_date: null, references: [], version: m.version, published_at: PUBLISHED, label_source: null, label_version: null, label_date: null, jurisdiction_note: null,
        monitoring: m.monitoring, revisions: [{ version: m.version, changed_at: PUBLISHED, summary: m.revision }],
      };
      return d;
    },
    async setBookmark(id, on) {
      if (!meds.some((m) => m.id === id)) throw new MedicationError("not_found", "medication not found");
      if (on) { if (me.bookmarks.size >= 200) throw new MedicationError("limit", "bookmark limit reached"); me.bookmarks.add(id); } else me.bookmarks.delete(id);
    },
  };
}
