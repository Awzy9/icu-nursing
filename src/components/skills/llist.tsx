import { usedFallback } from "@/lib/content/localize";

type LL = Record<string, string[]>;
const pick = (v: LL | undefined, locale: string): string[] => (v ? (v[locale] ?? v[locale.split("-")[0] ?? locale] ?? v.en ?? []) : []);
const fellBack = (v: LL | undefined, locale: string) => Boolean(v) && locale !== "en" && usedFallback(v as Record<string, unknown> as Record<string, string>, locale);

/** A localized list; an English fallback on a right-to-left page is marked lang/dir so it is pronounced and laid out correctly. */
export function LList({ value, locale, className }: { value: LL | undefined; locale: string; className?: string }) {
  const items = pick(value, locale);
  if (items.length === 0) return null;
  const fb = fellBack(value, locale);
  return (
    <ul className={className ?? "list-disc space-y-1 ps-5"} {...(fb ? { lang: "en", dir: "ltr" } : {})}>
      {items.map((x, i) => <li key={i}>{x}</li>)}
    </ul>
  );
}
export { pick as pickList };
