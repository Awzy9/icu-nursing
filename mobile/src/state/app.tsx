import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useColorScheme } from "react-native";
import { isRtl, translate, type Locale } from "../core/i18n";
import { emptyProgress, loadProgress, saveProgress, type KeyValueStore, type Progress } from "../core/progress";
import { dark, light, type Palette } from "../ui/theme";

export type ThemeMode = "system" | "light" | "dark";
const store: KeyValueStore = { get: (k) => AsyncStorage.getItem(k), set: (k, v) => AsyncStorage.setItem(k, v), remove: (k) => AsyncStorage.removeItem(k) };
const SETTINGS_KEY = "icu.settings.v1";

interface Ctx {
  locale: Locale; rtl: boolean; setLocale(l: Locale): void; themeMode: ThemeMode; setThemeMode(m: ThemeMode): void; palette: Palette;
  t(key: string, vars?: Record<string, string | number>): string;
  progress: Progress; update(fn: (p: Progress) => Progress): void; ready: boolean;
}
const AppContext = createContext<Ctx | null>(null);
export const useApp = (): Ctx => { const c = useContext(AppContext); if (!c) throw new Error("useApp outside AppProvider"); return c; };

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");
  const [progress, setProgress] = useState<Progress>(emptyProgress());
  const [ready, setReady] = useState(false);
  const system = useColorScheme();
  const latest = useRef(progress); latest.current = progress;

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(SETTINGS_KEY);
        const s = raw ? (JSON.parse(raw) as { locale?: string; theme?: string }) : {};
        if (s.locale === "ar" || s.locale === "en") setLocaleState(s.locale);
        if (s.theme === "light" || s.theme === "dark" || s.theme === "system") setThemeModeState(s.theme);
      } catch { /* ignore corrupt settings */ }
      setProgress(await loadProgress(store));
      setReady(true);
    })();
  }, []);

  const persistSettings = (l: Locale, m: ThemeMode) => void AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({ locale: l, theme: m })).catch(() => undefined);
  const setLocale = useCallback((l: Locale) => { setLocaleState(l); persistSettings(l, themeMode); }, [themeMode]);
  const setThemeMode = useCallback((m: ThemeMode) => { setThemeModeState(m); persistSettings(locale, m); }, [locale]);
  const update = useCallback((fn: (p: Progress) => Progress) => { const next = fn(latest.current); latest.current = next; setProgress(next); void saveProgress(store, next).catch(() => undefined); }, []);

  const value = useMemo<Ctx>(() => ({
    locale, rtl: isRtl(locale), setLocale, themeMode, setThemeMode, palette: (themeMode === "system" ? system : themeMode) === "dark" ? dark : light,
    t: (k, v) => translate(locale, k, v), progress, update, ready,
  }), [locale, setLocale, themeMode, setThemeMode, system, progress, update, ready]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
