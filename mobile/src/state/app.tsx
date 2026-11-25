import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useColorScheme } from "react-native";
import { isRtl, translate, type Locale } from "../core/i18n";
import { emptyProgress, loadProgressStrict, saveProgress, scopedProgressStore, type KeyValueStore, type Progress } from "../core/progress";
import { orderedStorage } from "../core/orderedStorage";
import { ONBOARDING_STORAGE_KEY } from "../core/onboarding";
import { dark, light, type Palette } from "../ui/theme";

export type ThemeMode = "system" | "light" | "dark";
const store: KeyValueStore = orderedStorage({ get: (k) => AsyncStorage.getItem(k), set: (k, v) => AsyncStorage.setItem(k, v), remove: (k) => AsyncStorage.removeItem(k) });
const SETTINGS_KEY = "icu.settings.v1";

interface Ctx {
  locale: Locale; rtl: boolean; setLocale(l: Locale): void; themeMode: ThemeMode; setThemeMode(m: ThemeMode): void; palette: Palette;
  t(key: string, vars?: Record<string, string | number>): string;
  progress: Progress; update(fn: (p: Progress) => Progress): void; ready: boolean;
  onboardingSeen: boolean; finishOnboarding(): void;
  storageWarning: boolean; retryStorage(): void;
}
const AppContext = createContext<Ctx | null>(null);
export const useApp = (): Ctx => { const c = useContext(AppContext); if (!c) throw new Error("useApp outside AppProvider"); return c; };

export function AppProvider({ children, accountId = null }: { children: React.ReactNode; accountId?: string | null }) {
  const progressStore = useMemo(() => scopedProgressStore(store, accountId), [accountId]);
  const scopeId = accountId ?? "guest";
  const [loadedScope, setLoadedScope] = useState<string | null>(null);
  const [locale, setLocaleState] = useState<Locale>("en");
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");
  const [progress, setProgress] = useState<Progress>(emptyProgress());
  const [ready, setReady] = useState(false);
  const [onboardingSeen, setOnboardingSeen] = useState(false);
  const [failedScope, setFailedScope] = useState<string | null>(null);
  const [hydrationAttempt, setHydrationAttempt] = useState(0);
  const saveSequence = useRef(0);
  const system = useColorScheme();
  const latest = useRef(progress);

  useEffect(() => {
    let active = true;
    setReady(false);
    setLoadedScope(null);
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(SETTINGS_KEY);
        const s = raw ? (JSON.parse(raw) as { locale?: string; theme?: string }) : {};
        if (s.locale === "ar" || s.locale === "en") setLocaleState(s.locale);
        if (s.theme === "light" || s.theme === "dark" || s.theme === "system") setThemeModeState(s.theme);
      } catch { /* ignore corrupt settings */ }
      let loaded: Progress;
      try { loaded = await loadProgressStrict(progressStore); }
      catch {
        if (active) setFailedScope(scopeId);
        return; // no writable empty fallback; keep the original stored bytes
      }
      if (!active) return; // never show data from an account whose async storage read finished late
      setFailedScope(null);
      latest.current = loaded;
      setProgress(loaded);
      setLoadedScope(scopeId);
      try { setOnboardingSeen(await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY) === "dismissed"); }
      catch { /* never block a learner if onboarding storage is unavailable */ }
      if (active) setReady(true);
    })();
    return () => { active = false; };
  }, [progressStore, scopeId, hydrationAttempt]);

  const persistSettings = (l: Locale, m: ThemeMode) => void AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({ locale: l, theme: m })).catch(() => undefined);
  const setLocale = useCallback((l: Locale) => { setLocaleState(l); persistSettings(l, themeMode); }, [themeMode]);
  const setThemeMode = useCallback((m: ThemeMode) => { setThemeModeState(m); persistSettings(locale, m); }, [locale]);
  const finishOnboarding = useCallback(() => {
    setOnboardingSeen(true);
    void AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, "dismissed").catch(() => undefined);
  }, []);
  const scopeReady = ready && loadedScope === scopeId;
  const activeScopeRef = useRef(scopeId);
  activeScopeRef.current = scopeId;
  const persistProgress = useCallback((next: Progress) => {
    const sequence = ++saveSequence.current;
    void saveProgress(progressStore, next).then(() => {
      if (activeScopeRef.current === scopeId && saveSequence.current === sequence) setFailedScope(null);
    }).catch(() => {
      if (activeScopeRef.current === scopeId && saveSequence.current === sequence) setFailedScope(scopeId);
    });
  }, [progressStore, scopeId]);
  const update = useCallback((fn: (p: Progress) => Progress) => {
    if (!scopeReady || activeScopeRef.current !== scopeId) return;
    const next = fn(latest.current);
    if (next === latest.current) return;
    latest.current = next; setProgress(next);
    persistProgress(next);
  }, [scopeId, scopeReady, persistProgress]);
  const retryStorage = useCallback(() => {
    if (activeScopeRef.current !== scopeId) return;
    if (scopeReady) persistProgress(latest.current);
    else setHydrationAttempt(n => n + 1);
  }, [scopeId, scopeReady, persistProgress]);

  const value = useMemo<Ctx>(() => ({
    locale, rtl: isRtl(locale), setLocale, themeMode, setThemeMode, palette: (themeMode === "system" ? system : themeMode) === "dark" ? dark : light,
    t: (k, v) => translate(locale, k, v), progress: scopeReady ? progress : emptyProgress(), update, ready: scopeReady, onboardingSeen, finishOnboarding, storageWarning: failedScope === scopeId, retryStorage,
  }), [locale, setLocale, themeMode, setThemeMode, system, progress, update, scopeReady, onboardingSeen, finishOnboarding, failedScope, scopeId, retryStorage]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
