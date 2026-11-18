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
import {
  catalogEntryResponseSchema, catalogListResponseSchema, caseVisualsResponseSchema, labDatasetResponseSchema,
  type WorkingEntrySummary, type WorkingEntryShared, type CaseVisuals,
} from "@icu/schemas/working-content";

export type { WorkingEntrySummary, WorkingEntryShared, CaseVisuals } from "@icu/schemas/working-content";
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

const CACHE_PREFIX = "icu.content.v1:";
async function readCache<T>(store: KeyValueStore, key: string): Promise<T | undefined> {
  try { const raw = await store.get(CACHE_PREFIX + key); return raw ? (JSON.parse(raw) as T) : undefined; } catch { return undefined; }
}
async function writeCache<T>(store: KeyValueStore, key: string, value: T): Promise<void> {
  try { await store.set(CACHE_PREFIX + key, JSON.stringify(value)); } catch { /* cache is best-effort */ }
}

const TIMEOUT_MS = 10000;
async function fetchJson(fetcher: typeof fetch, baseUrl: string, path: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetcher(`${baseUrl}${path}`, { signal: controller.signal, headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`http ${res.status}`);
    return await res.json();
  } finally { clearTimeout(timer); }
}

export interface ContentClientDeps { store: KeyValueStore; fetcher: typeof fetch; baseUrl: string }

async function fetchCached<T>(deps: ContentClientDeps, cacheKey: string, path: string, validate: (raw: unknown) => T): Promise<RemoteResult<T>> {
  try {
    const raw = await fetchJson(deps.fetcher, deps.baseUrl, path);
    const data = validate(raw);
    await writeCache(deps.store, cacheKey, data);
    return { status: "ok", data, fromCache: false };
  } catch {
    const cached = await readCache<T>(deps.store, cacheKey);
    if (cached) return { status: "ok", data: cached, fromCache: true };
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
