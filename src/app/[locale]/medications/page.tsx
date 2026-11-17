import { workingEditionEnabled, workingQuery } from "@/lib/working";
import { WorkingCatalog } from "@/components/working/catalog";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Badge, Callout } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth";
import { localize } from "@/lib/content/localize";
import { getMedicationService } from "@/lib/medications";
import { resolveMode } from "@/lib/question-bank";
import { MEDICATION_CATEGORIES, medicationFilterSchema, type MedicationCard, type MedicationProgress } from "@/lib/medications/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Medications" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function MedicationsPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  if (workingEditionEnabled()) return <WorkingCatalog query={await workingQuery(searchParams)} locale={locale} type="medications" />;
  const t = await getTranslations("Medications");
  const mode = resolveMode();
  if (mode === "disabled") {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <Callout tone="info" title={t("disabledTitle")}>{t("disabledBody")}</Callout>
      </div>
    );
  }
  if (mode === "database") await requireUser(locale, "/medications");

  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const parsed = medicationFilterSchema.safeParse({ query: one(sp.q) || undefined, category: one(sp.category) || undefined, bookmarked: one(sp.bookmarked) === "1" ? true : undefined, highAlert: one(sp.highAlert) === "1" ? true : undefined });
  const filter = parsed.success ? parsed.data : {};
  const filtered = Boolean(filter.query || filter.category || filter.bookmarked || filter.highAlert);

  let progress: MedicationProgress | null = null;
  let list: MedicationCard[] = [];
  let failed = false;
  try {
    const svc = await getMedicationService();
    if (svc) [progress, list] = await Promise.all([svc.progress(), svc.list(filter)]);
  } catch {
    failed = true;
  }
  const groups = MEDICATION_CATEGORIES.map((c) => ({ c, items: list.filter((m) => m.category === c) })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="max-w-prose text-muted-foreground">{t("intro")}</p>
      </header>
      {mode === "fixtures" ? <Callout tone="warning" role="note">{t("fixturesBanner")}</Callout> : null}
      <Callout tone="info" role="note">{t("noDosingNotice")}</Callout>
      {failed ? <Callout tone="danger">{t("loadError")}</Callout> : null}

      {progress ? (
        <>
          <section aria-labelledby="md-stats">
            <h2 id="md-stats" className="sr-only">{t("title")}</h2>
            <dl className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              {[[t("statAvailable"), progress.available], [t("statHighAlert"), progress.high_alert], [t("statBookmarked"), progress.bookmarked]].map(([label, value]) => (
                <div key={String(label)} className="rounded-lg border border-border bg-card p-4">
                  <dt className="text-sm text-muted-foreground">{label}</dt>
                  <dd className="mt-1 text-2xl font-bold tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-labelledby="md-find" className="space-y-3">
            <h2 id="md-find" className="sr-only">{t("searchLabel")}</h2>
            <form method="get" role="search" className="grid gap-3 rounded-lg border border-border bg-card p-4 md:grid-cols-[1fr_16rem] md:items-end">
              <div className="space-y-1">
                <label htmlFor="md-q" className="text-sm font-medium">{t("searchLabel")}</label>
                <input id="md-q" name="q" type="search" maxLength={80} defaultValue={filter.query ?? ""} placeholder={t("searchPlaceholder")} className="min-h-11 w-full rounded-md border border-border bg-background px-3" />
              </div>
              <div className="space-y-1">
                <label htmlFor="md-cat" className="text-sm font-medium">{t("categoryLabel")}</label>
                <select id="md-cat" name="category" defaultValue={filter.category ?? ""} className="min-h-11 w-full rounded-md border border-border bg-background px-3">
                  <option value="">{t("allCategories")}</option>
                  {MEDICATION_CATEGORIES.map((c) => <option key={c} value={c}>{t(`categories.${c}`)}</option>)}
                </select>
              </div>
              <div className="flex flex-wrap items-center gap-4 md:col-span-2">
                <label className="inline-flex min-h-11 items-center gap-2"><input type="checkbox" name="highAlert" value="1" defaultChecked={Boolean(filter.highAlert)} className="size-4" />{t("highAlertOnly")}</label>
                <label className="inline-flex min-h-11 items-center gap-2"><input type="checkbox" name="bookmarked" value="1" defaultChecked={Boolean(filter.bookmarked)} className="size-4" />{t("bookmarkedOnly")}</label>
                <Button type="submit">{t("apply")}</Button>
                {filtered ? <Button asChild variant="outline"><Link href="/medications">{t("clear")}</Link></Button> : null}
              </div>
            </form>
            <nav aria-label={t("browse")} className="flex flex-wrap gap-2">
              {MEDICATION_CATEGORIES.map((c) => (
                <Link key={c} href={{ pathname: "/medications", query: { category: c } }} aria-current={filter.category === c ? "true" : undefined}
                  className={`inline-flex min-h-11 items-center rounded-full border px-3 text-sm no-underline hover:bg-muted ${filter.category === c ? "border-primary bg-muted font-semibold" : "border-border"}`}>{t(`categories.${c}`)}</Link>
              ))}
            </nav>
          </section>

          {list.length === 0 ? (filtered ? <Callout tone="info">{t("noMatches")}</Callout> : <Callout tone="info" title={t("emptyTitle")}>{t("emptyBody")}</Callout>) : (
            <div className="space-y-8">
              <p role="status" className="text-sm text-muted-foreground">{t("resultsCount", { n: list.length })}</p>
              {groups.map((g) => (
                <section key={g.c} aria-labelledby={`cat-${g.c}`} className="space-y-3">
                  <h2 id={`cat-${g.c}`} className="text-xl font-semibold">{t(`categories.${g.c}`)}</h2>
                  <ul className="grid gap-4 md:grid-cols-2">
                    {g.items.map((m) => (
                      <li key={m.id} className="space-y-3 rounded-lg border border-border bg-card p-4">
                        <div className="space-y-1">
                          <h3 className="text-lg font-semibold">{localize(m.name, locale)}</h3>
                          <div className="flex flex-wrap items-center gap-2 text-sm">
                            {m.synthetic ? <Badge tone="warning">{t("syntheticBadge")}</Badge> : null}
                            {m.high_alert ? <Badge tone="danger">{t("highAlertBadge")}</Badge> : null}
                            {m.bookmarked ? <Badge tone="success">{t("bookmarked")}</Badge> : null}
                            <span className="text-muted-foreground">{localize(m.drug_class, locale)}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{localize(m.summary, locale)}</p>
                        </div>
                        <Button asChild variant="outline"><Link href={`/medications/${m.code}`}>{t("view")}<span className="sr-only"> — {localize(m.name, locale)}</span></Link></Button>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
