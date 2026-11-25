// Fetches and caches the real, published website content from the content API
// (src/app/api/content/*), replacing the old hardcoded-synthetic content module. Every response
// is validated with the shared @icu/schemas definitions, mirroring the discipline already used
// for the Supabase RPCs in src/api/rpc.ts. Falls back to the last cached copy when offline; if
// there is no cache either, callers get an explicit "offline, nothing cached yet" result rather
// than silently showing stale or placeholder data.
//
// The cache store and fetch function are injected (same pattern as core/progress.ts's
// KeyValueStore) so this module's logic is unit-testable from the repository root without a
// React Native runtime; the app wires in AsyncStorage and the global fetch at the call sites.
import { z } from "zod";
import {
  catalogEntryResponseSchema, catalogListResponseSchema, caseVisualsResponseSchema, labDatasetResponseSchema,
  type WorkingEntrySummary, type WorkingEntryShared, type CaseVisuals,
} from "@icu/schemas/working-content";
import {
  examPickResponseSchema, examQuestionsResponseSchema, examTopicsResponseSchema,
  type ExamQuestionShared, type ExamTopicShared,
} from "@icu/schemas/working-exam";
import { pathsResponseSchema, type ResolvedPathShared } from "@icu/schemas/working-paths";
import { revisionQuestionsResponseSchema, type RevisionQuestionShared } from "@icu/schemas/working-revision";
import { crrtResponseSchema, type CrrtData } from "@icu/schemas/working-crrt";
import { news2CaseSchema, type News2Case } from "./news2";
import { gcsCaseSchema, type GcsCase } from "./gcs";
import { ecgExerciseSchema, type EcgExercise } from "./ecg";
import { waveformExerciseSchema, type WaveformExercise } from "./waveformExercise";
import { alineExerciseSchema, type AlineExercise } from "./aline";
import { defibExerciseSchema, type DefibExercise } from "./defib";
import { abgCaseSchema, type AbgCase } from "./abg";
import { infusionCaseSchema, type InfusionCase } from "./infusion";
import { transfusionExerciseSchema, type TransfusionExercise } from "./transfusion";

export type { WorkingEntrySummary, WorkingEntryShared, CaseVisuals } from "@icu/schemas/working-content";
export type { ExamQuestionShared, ExamTopicShared } from "@icu/schemas/working-exam";
export type { ResolvedPathShared } from "@icu/schemas/working-paths";
export type { RevisionQuestionShared } from "@icu/schemas/working-revision";
export type { News2Case } from "./news2";
export type { GcsCase } from "./gcs";
export type { EcgExercise } from "./ecg";
export type { WaveformExercise } from "./waveformExercise";
export type { AlineExercise } from "./aline";
export type { DefibExercise } from "./defib";
export type { AbgCase } from "./abg";
export type { InfusionCase } from "./infusion";
export type { TransfusionExercise } from "./transfusion";
export type { CrrtData } from "@icu/schemas/working-crrt";
export interface KeyValueStore { get(key: string): Promise<string | null>; set(key: string, value: string): Promise<void> }

const DEFAULT_SITE_URL = "https://icu-nursing.vercel.app";
export function siteBaseUrl(env: Record<string, string | undefined>, extraSiteUrl?: string): string {
  const candidate = env.EXPO_PUBLIC_SITE_URL || extraSiteUrl || DEFAULT_SITE_URL;
  return candidate.replace(/\/$/, "");
}
export const imageUrl = (base: string, path: string): string => `${base}${path.startsWith("/") ? path : `/${path}`}`;

export type RemoteResult<T> =
  | { status: "ok"; data: T; fromCache: boolean }
  | { status: "offline" };

// v2 keys are scoped to the exact content API origin and a persisted generation.
// Legacy v1 caches were created without a publication/revocation check, so do not
// reuse them after this upgrade: an offline response must not resurrect old drafts.
const CACHE_PREFIX = "icu.content.v2:";
const scope = (baseUrl: string) => `${CACHE_PREFIX}${encodeURIComponent(baseUrl)}:`;
// Coordinate invalidation with in-flight requests and asynchronous storage operations.
// A response that started before a denial must never populate the new cache generation.
type OriginState = { epoch: number; blocked: boolean; persistenceFailed: boolean; pending: Promise<void> };
const origins = new Map<string, OriginState>();
function originState(baseUrl: string): OriginState {
  let state = origins.get(baseUrl);
  if (!state) {
    state = { epoch: 0, blocked: false, persistenceFailed: false, pending: Promise.resolve() };
    origins.set(baseUrl, state);
  }
  return state;
}
function queueStorage(state: OriginState, task: () => Promise<void>): Promise<void> {
  const next = state.pending.then(task);
  state.pending = next.catch(() => { /* subsequent tasks can still run */ });
  return next;
}
async function cacheGeneration(deps: ContentClientDeps): Promise<number> {
  const raw = await deps.store.get(scope(deps.baseUrl) + "generation");
  const n = Number(raw ?? 0);
  if (!Number.isSafeInteger(n) || n < 0) throw new Error("invalid cache generation");
  return n;
}
async function readCache<T>(deps: ContentClientDeps, key: string, state: OriginState, epoch: number): Promise<T | undefined> {
  if (state.blocked || state.epoch !== epoch) return undefined;
  try {
    await state.pending;
    if (state.blocked || state.epoch !== epoch) return undefined;
    const n = await cacheGeneration(deps);
    const raw = await deps.store.get(`${scope(deps.baseUrl)}${n}:${key}`);
    if (state.blocked || state.epoch !== epoch) return undefined;
    return raw ? (JSON.parse(raw) as T) : undefined;
  } catch { return undefined; }
}
async function writeCache<T>(deps: ContentClientDeps, key: string, value: T, state: OriginState, epoch: number): Promise<void> {
  await queueStorage(state, async () => {
    if (state.epoch !== epoch || state.persistenceFailed) return;
    try {
      const n = await cacheGeneration(deps);
      if (state.epoch !== epoch) return;
      await deps.store.set(`${scope(deps.baseUrl)}${n}:${key}`, JSON.stringify(value));
      if (state.epoch === epoch) state.blocked = false;
    } catch { /* cache is best-effort; do not clear a withdrawal block */ }
  });
}
async function invalidateOriginCache(deps: ContentClientDeps): Promise<void> {
  // Block immediately, before any await. Serialize the persisted generation change
  // behind earlier writes, so their data cannot land in a newer generation.
  const state = originState(deps.baseUrl);
  state.epoch++;
  state.blocked = true;
  await queueStorage(state, async () => {
    try {
      const n = await cacheGeneration(deps);
      await deps.store.set(scope(deps.baseUrl) + "generation", String(n + 1));
      state.persistenceFailed = false;
    } catch {
      // Do not let later successful fetches unblock stale disk data after a failed
      // invalidation. A subsequent successfully persisted invalidation can recover.
      state.persistenceFailed = true;
    }
  });
}

class PublicationUnavailable extends Error {}
const TIMEOUT_MS = 10000;
async function fetchJson(fetcher: typeof fetch, baseUrl: string, path: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetcher(`${baseUrl}${path}`, { signal: controller.signal, headers: { Accept: "application/json" } });
    // A withdrawn publication or denied session is NOT an ordinary offline error.
    // 404 not_found on an individual entry remains eligible for offline fallback.
    if (!res.ok) {
      if ([401, 403, 410].includes(res.status)) throw new PublicationUnavailable("content access denied");
      if (res.status === 404) {
        try {
          const body: unknown = await res.json();
          if (body && typeof body === "object" && "error" in body &&
            body.error === "content_edition_disabled") throw new PublicationUnavailable("clinical publication disabled");
        } catch (err) {
          if (err instanceof PublicationUnavailable) throw err;
        }
      }
      throw new Error(`http ${res.status}`);
    }
    return await res.json();
  } finally { clearTimeout(timer); }
}

export interface ContentClientDeps { store: KeyValueStore; fetcher: typeof fetch; baseUrl: string }

async function fetchCached<T>(deps: ContentClientDeps, cacheKey: string, path: string, validate: (raw: unknown) => T): Promise<RemoteResult<T>> {
  const state = originState(deps.baseUrl);
  const epoch = state.epoch;
  try {
    const raw = await fetchJson(deps.fetcher, deps.baseUrl, path);
    const data = validate(raw);
    if (state.epoch !== epoch) return { status: "offline" };
    await writeCache(deps, cacheKey, data, state, epoch);
    if (state.epoch !== epoch) return { status: "offline" };
    return { status: "ok", data, fromCache: false };
  } catch (err) {
    if (err instanceof PublicationUnavailable) {
      await invalidateOriginCache(deps);
      return { status: "offline" }; // no clinical data returned; UI error label can be refined separately
    }
    const cached = await readCache<T>(deps, cacheKey, state, epoch);
    if (cached && state.epoch === epoch && !state.blocked) return { status: "ok", data: cached, fromCache: true };
    return { status: "offline" };
  }
}

export function fetchCatalogList(deps: ContentClientDeps, type?: string): Promise<RemoteResult<WorkingEntrySummary[]>> {
  const path = `/api/content/catalog${type ? `?type=${encodeURIComponent(type)}` : ""}`;
  return fetchCached(deps, `catalog:${type ?? "all"}`, path, (raw) => catalogListResponseSchema.parse(raw).items);
}

export function fetchCatalogEntry(deps: ContentClientDeps, key: string): Promise<RemoteResult<WorkingEntryShared>> {
  return fetchCached(deps, `entry:${key}`, `/api/content/catalog/${encodeURIComponent(key)}`, (raw) => catalogEntryResponseSchema.parse(raw).entry);
}

export function fetchLabDataset<T = Record<string, unknown>>(deps: ContentClientDeps, name: string): Promise<RemoteResult<T[]>> {
  return fetchCached(deps, `lab:${name}`, `/api/content/labs/${encodeURIComponent(name)}`, (raw) => labDatasetResponseSchema.parse(raw).items as T[]);
}

export function fetchCaseVisuals(deps: ContentClientDeps): Promise<RemoteResult<CaseVisuals>> {
  return fetchCached(deps, "case-visuals", "/api/content/case-visuals", (raw) => caseVisualsResponseSchema.parse(raw).data);
}

export function fetchExamTopics(deps: ContentClientDeps): Promise<RemoteResult<ExamTopicShared[]>> {
  return fetchCached(deps, "exam-topics", "/api/content/exam/topics", (raw) => examTopicsResponseSchema.parse(raw).topics);
}

export function fetchExamQuestions(deps: ContentClientDeps, ids: string[]): Promise<RemoteResult<ExamQuestionShared[]>> {
  const key = [...ids].sort().join(",");
  return fetchCached(deps, `exam-questions:${key}`, `/api/content/exam/questions?ids=${ids.map(encodeURIComponent).join(",")}`, (raw) => examQuestionsResponseSchema.parse(raw).items);
}

export function fetchPaths(deps: ContentClientDeps): Promise<RemoteResult<ResolvedPathShared[]>> {
  return fetchCached(deps, "paths", "/api/content/paths", (raw) => pathsResponseSchema.parse(raw).paths);
}

export function fetchRevisionQuestions(deps: ContentClientDeps): Promise<RemoteResult<RevisionQuestionShared[]>> {
  return fetchCached(deps, "revision-questions", "/api/content/revision/questions", (raw) => revisionQuestionsResponseSchema.parse(raw).items);
}

// The NEWS2 scoring exercises (content/working-news2-cases.json) are served through the generic,
// array-shaped /api/content/labs/[name] endpoint (labDatasetResponseSchema only checks "a
// non-empty array of records"); this is the specific News2Case shape this screen needs, so it is
// validated here rather than trusting the generic cast fetchLabDataset's own callers use for
// labs that parse their own shape ad hoc.
export function fetchNews2Cases(deps: ContentClientDeps): Promise<RemoteResult<News2Case[]>> {
  return fetchCached(deps, "lab:news2-cases", "/api/content/labs/news2-cases", (raw) => z.array(news2CaseSchema).parse(labDatasetResponseSchema.parse(raw).items));
}

export function fetchGcsCases(deps: ContentClientDeps): Promise<RemoteResult<GcsCase[]>> {
  return fetchCached(deps, "lab:gcs-cases", "/api/content/labs/gcs-cases", (raw) => z.array(gcsCaseSchema).parse(labDatasetResponseSchema.parse(raw).items));
}

export function fetchEcgExercises(deps: ContentClientDeps): Promise<RemoteResult<EcgExercise[]>> {
  return fetchCached(deps, "lab:ecg", "/api/content/labs/ecg", (raw) => z.array(ecgExerciseSchema).parse(labDatasetResponseSchema.parse(raw).items));
}

export function fetchWaveformExercises(deps: ContentClientDeps): Promise<RemoteResult<WaveformExercise[]>> {
  return fetchCached(deps, "lab:waveforms", "/api/content/labs/waveforms", (raw) => z.array(waveformExerciseSchema).parse(labDatasetResponseSchema.parse(raw).items));
}

export function fetchAlineExercises(deps: ContentClientDeps): Promise<RemoteResult<AlineExercise[]>> {
  return fetchCached(deps, "lab:aline", "/api/content/labs/aline", (raw) => z.array(alineExerciseSchema).parse(labDatasetResponseSchema.parse(raw).items));
}

export function fetchDefibExercises(deps: ContentClientDeps): Promise<RemoteResult<DefibExercise[]>> {
  return fetchCached(deps, "lab:defib", "/api/content/labs/defib", (raw) => z.array(defibExerciseSchema).parse(labDatasetResponseSchema.parse(raw).items));
}

export function fetchAbgCases(deps: ContentClientDeps): Promise<RemoteResult<AbgCase[]>> {
  return fetchCached(deps, "lab:abg", "/api/content/labs/abg", (raw) => z.array(abgCaseSchema).parse(labDatasetResponseSchema.parse(raw).items));
}

export function fetchInfusionCases(deps: ContentClientDeps): Promise<RemoteResult<InfusionCase[]>> {
  return fetchCached(deps, "lab:infusion-cases", "/api/content/labs/infusion-cases", (raw) => z.array(infusionCaseSchema).parse(labDatasetResponseSchema.parse(raw).items));
}

export function fetchTransfusionExercises(deps: ContentClientDeps): Promise<RemoteResult<TransfusionExercise[]>> {
  return fetchCached(deps, "lab:transfusion", "/api/content/labs/transfusion", (raw) => z.array(transfusionExerciseSchema).parse(labDatasetResponseSchema.parse(raw).items));
}

export function fetchCrrtData(deps: ContentClientDeps): Promise<RemoteResult<CrrtData>> {
  return fetchCached(deps, "crrt", "/api/content/crrt", (raw) => crrtResponseSchema.parse(raw).data);
}

// A fresh random draw every call - never cached, since caching would defeat the point of
// picking a new set of questions each time an exam is started.
export async function pickExamQuestions(deps: ContentClientDeps, categories: string[], count: number): Promise<RemoteResult<{ questionIds: string[]; timeLimitSeconds: number }>> {
  const state = originState(deps.baseUrl);
  const epoch = state.epoch;
  try {
    const path = `/api/content/exam/pick?categories=${categories.map(encodeURIComponent).join(",")}&count=${count}`;
    const raw = await fetchJson(deps.fetcher, deps.baseUrl, path);
    if (state.epoch !== epoch) return { status: "offline" };
    return { status: "ok", data: examPickResponseSchema.parse(raw), fromCache: false };
  } catch (err) {
    if (err instanceof PublicationUnavailable) await invalidateOriginCache(deps);
    return { status: "offline" };
  }
}
