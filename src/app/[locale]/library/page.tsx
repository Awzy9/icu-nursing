import { workingEditionEnabled, workingQuery } from "@/lib/working";
import { WorkingCatalog } from "@/components/working/catalog";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { TopicList } from "@/components/content/topic-list";
import { Link } from "@/i18n/navigation";
import { getContentRepository, LEVELS, type Level } from "@/lib/content";
import { cleanQuery } from "@/lib/search";

export default async function LibraryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string | string[]; domain?: string | string[]; level?: string | string[] }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (workingEditionEnabled()) return <WorkingCatalog query={await workingQuery(searchParams)} locale={locale} type="topics" />;
  const sp = await searchParams;
  const t = await getTranslations("Library");
  const repo = await getContentRepository();
  const domains = await repo.listDomains(locale);

  const single = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const q = cleanQuery(single(sp.q));
  const domainParam = single(sp.domain);
  const levelParam = single(sp.level);
  const domainSlug = domains.some((d) => d.slug === domainParam) ? domainParam : undefined;
  const level = (LEVELS as readonly string[]).includes(levelParam ?? "") ? (levelParam as Level) : undefined;
  const topics = await repo.listTopics({ locale, q, domainSlug, level });
  const titles = Object.fromEntries(domains.map((d) => [d.slug, d.title]));
  const active = Boolean(q || domainSlug || level);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("intro")}</p>
      </header>

      <form method="get" role="search" className="grid gap-4 rounded-lg border border-border bg-card p-4 md:grid-cols-4">
        <div className="md:col-span-2">
          <Field label={t("searchLabel")} htmlFor="q">
            <Input id="q" name="q" type="search" defaultValue={q} placeholder={t("searchPlaceholder")} maxLength={100} />
          </Field>
        </div>
        <Field label={t("domainLabel")} htmlFor="domain">
          <Select id="domain" name="domain" defaultValue={domainSlug ?? ""}>
            <option value="">{t("all")}</option>
            {domains.map((d) => <option key={d.id} value={d.slug}>{d.title}</option>)}
          </Select>
        </Field>
        <Field label={t("levelLabel")} htmlFor="level">
          <Select id="level" name="level" defaultValue={level ?? ""}>
            <option value="">{t("all")}</option>
            {LEVELS.map((l) => <option key={l} value={l}>{t(`levels.${l}`)}</option>)}
          </Select>
        </Field>
        <div className="flex gap-2 md:col-span-4">
          <Button type="submit">{t("apply")}</Button>
          {active ? <Button asChild variant="ghost"><Link href="/library">{t("reset")}</Link></Button> : null}
        </div>
      </form>

      <p role="status" aria-live="polite" className="text-sm text-muted-foreground">{t("results", { count: topics.length })}</p>
      {topics.length ? <TopicList topics={topics} domainTitles={titles} /> : <p>{t("noResults")}</p>}
    </div>
  );
}
