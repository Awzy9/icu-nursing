import { defineRouting } from "next-intl/routing";

export const locales = ["en", "ar"] as const;
export type Locale = (typeof locales)[number];
export const rtlLocales: readonly string[] = ["ar", "he", "fa", "ur"];

export const routing = defineRouting({
  locales,
  defaultLocale: "en",
  localePrefix: "always",
});

export const localeNames: Record<Locale, string> = { en: "English", ar: "العربية" };
export const isRtl = (locale: string) => rtlLocales.includes(locale);
