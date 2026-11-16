import { getTranslations, setRequestLocale } from "next-intl/server";
import { Search as SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge, Callout } from "@/components/ui/feedback";
import { Field, Input } from "@/components/ui/form";
import { Link } from "@/i18n/navigation";
import { cleanQuery, MAX_QUERY, searchEverything, SEARCH_KINDS } from "@/lib/search";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Search" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function SearchPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string | string[] }> }) {
  const { locale } = await params; const sp = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("Search");
  const q = cleanQuery(Array.isArray(sp.q) ? sp.q[0] : sp.q);
  const { hits, skipped } = await searchEverything(q, locale);
  const kinds = SEARCH_KINDS.filter((k) => hits.some((h) => h.kind === k));
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <p className="max-w-prose text-muted-foreground">{t("intro")}</p>
      <form method="get" role="search" className="flex flex-wrap items-end gap-2">
        <Field label={t("label")} htmlFor="q"><Input id="q" name="q" type="search" defaultValue={q} maxLength={MAX_QUERY} autoComplete="off" /></Field>
        <Button type="submit"><SearchIcon className="size-4" aria-hidden />{t("button")}</Button>
      </form>
      <p role="status" aria-live="polite" className="text-sm text-muted-foreground" data-testid="sr-count">
        {q.length === 0 ? "" : q.length < 2 ? t("tooShort") : hits.length === 0 ? t("none", { q }) : t("count", { n: hits.length, q })}
      </p>
      {skipped.length ? <Callout tone="info" role="note">{t("skipped")}</Callout> : null}
      {kinds.map((k) => (
        <section key={k} aria-labelledby={`sr-${k}`} className="space-y-2">
          <h2 id={`sr-${k}`} className="text-xl font-semibold">{t(`kinds.${k}`)}</h2>
          <ul className="divide-y divide-border border-y border-border">
            {hits.filter((h) => h.kind === k).map((h) => (
              <li key={h.href} className="space-y-1 py-3">
                <p className="flex flex-wrap items-center gap-2"><Link href={h.href} className="font-medium">{h.title}</Link>{h.synthetic ? <Badge tone="warning">{t("sample")}</Badge> : null}</p>
                {h.summary ? <p className="max-w-prose text-sm text-muted-foreground">{h.summary.slice(0, 200)}</p> : null}
              </li>
            ))}
          </ul>
        </section>
      ))}
      <p className="text-xs text-muted-foreground">{t("scope")}</p>
    </div>
  );
}
