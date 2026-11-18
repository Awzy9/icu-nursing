// Thin React wiring over core/remoteContent.ts: injects AsyncStorage and the global fetch (the
// concrete dependencies remoteContent.ts's pure functions take as parameters, so that module
// stays unit-testable without a React Native runtime), and exposes loading/error/offline state
// declaratively for screens.
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";
import Constants from "expo-constants";
import {
  fetchCaseVisuals, fetchCatalogEntry, fetchCatalogList, fetchExamQuestions, fetchExamTopics, fetchLabDataset, siteBaseUrl,
  type CaseVisuals, type ContentClientDeps, type ExamQuestionShared, type ExamTopicShared, type RemoteResult, type WorkingEntryShared, type WorkingEntrySummary,
} from "../core/remoteContent";

const store = { get: (k: string) => AsyncStorage.getItem(k), set: (k: string, v: string) => AsyncStorage.setItem(k, v) };
function deps(): ContentClientDeps {
  const extra = Constants.expoConfig?.extra as { siteUrl?: string } | undefined;
  return { store, fetcher: fetch, baseUrl: siteBaseUrl(process.env as Record<string, string | undefined>, extra?.siteUrl) };
}
// For one-shot calls outside the useFetcher hook pattern below (e.g. drawing a fresh exam, which
// must not be cached/re-rendered the way a hook's steady "fetch and keep" state would be).
export const contentClientDeps = deps;

export type FetchState<T> =
  | { status: "loading" }
  | { status: "ready"; data: T; fromCache: boolean }
  | { status: "offline" };

function useFetcher<T>(run: () => Promise<RemoteResult<T>>, depsList: unknown[]): FetchState<T> & { refresh(): void } {
  const [state, setState] = useState<FetchState<T>>({ status: "loading" });
  const mounted = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);
  const load = useCallback(() => {
    setState({ status: "loading" });
    run().then((r) => {
      if (!mounted.current) return;
      setState(r.status === "ok" ? { status: "ready", data: r.data, fromCache: r.fromCache } : { status: "offline" });
    }).catch(() => mounted.current && setState({ status: "offline" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, depsList);
  useEffect(() => { load(); }, [load]);
  return { ...state, refresh: load } as FetchState<T> & { refresh(): void };
}

export const useCatalogList = (type?: string) => useFetcher<WorkingEntrySummary[]>(() => fetchCatalogList(deps(), type), [type]);
export const useCatalogEntry = (key: string | undefined) => useFetcher<WorkingEntryShared>(() => (key ? fetchCatalogEntry(deps(), key) : Promise.resolve({ status: "offline" as const })), [key]);
export const useLabDataset = <T = Record<string, unknown>>(name: string) => useFetcher<T[]>(() => fetchLabDataset<T>(deps(), name), [name]);
export const useCaseVisuals = () => useFetcher<CaseVisuals>(() => fetchCaseVisuals(deps()), []);
export const useExamTopics = () => useFetcher<ExamTopicShared[]>(() => fetchExamTopics(deps()), []);
export const useExamQuestions = (ids: string[]) => useFetcher<ExamQuestionShared[]>(() => (ids.length ? fetchExamQuestions(deps(), ids) : Promise.resolve({ status: "offline" as const })), [ids.join(",")]);
