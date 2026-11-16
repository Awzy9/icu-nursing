import type { LocalizedText } from "./types";

/** Resolve a localized value with fallback to English, then to any available language. */
export function localize(value: LocalizedText | string | null | undefined, locale: string): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  const base = locale.split("-")[0] ?? locale;
  return value[locale] ?? value[base] ?? value.en ?? Object.values(value)[0] ?? "";
}

/** True when the requested locale had no translation and an English fallback was used. */
export function usedFallback(value: LocalizedText | null | undefined, locale: string): boolean {
  if (!value) return false;
  const base = locale.split("-")[0] ?? locale;
  return !(locale in value) && !(base in value);
}

export function matchesQuery(haystack: string[], q: string | undefined): boolean {
  const needle = (typeof q === "string" ? q : "").trim().toLocaleLowerCase();
  if (!needle) return true;
  return haystack.some((h) => h.toLocaleLowerCase().includes(needle));
}
