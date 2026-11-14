"use client";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { locales, localeNames, type Locale } from "@/i18n/routing";

export function LocaleSwitcher() {
  const t = useTranslations("Common");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="locale-switcher" className="sr-only">{t("language")}</label>
      <select
        id="locale-switcher"
        value={locale}
        onChange={(e) => router.replace(pathname, { locale: e.target.value as Locale })}
        className="min-h-11 rounded-md border border-input bg-card px-2 text-sm"
      >
        {locales.map((l) => (
          <option key={l} value={l} lang={l}>{localeNames[l]}</option>
        ))}
      </select>
    </div>
  );
}
