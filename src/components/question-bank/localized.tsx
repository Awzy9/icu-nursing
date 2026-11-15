import { localize, usedFallback } from "@/lib/content/localize";
import type { Localized } from "@/lib/question-bank/types";

/**
 * Renders question content in the interface language, falling back to English. A fallback is marked with lang/dir so
 * screen readers pronounce it correctly and right-to-left pages do not mangle English punctuation.
 */
export function LText({ value, locale, as: Tag = "span", className }: { value: Localized | null | undefined; locale: string; as?: "span" | "p" | "div" | "h2"; className?: string }) {
  if (!value) return null;
  const fallback = locale !== "en" && usedFallback(value, locale);
  return (
    <Tag className={className} {...(fallback ? { lang: "en", dir: "ltr" } : {})}>
      {localize(value, locale)}
    </Tag>
  );
}

export const hasFallback = (value: Localized | null | undefined, locale: string) => Boolean(value) && locale !== "en" && usedFallback(value, locale);
