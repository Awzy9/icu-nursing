import { workingEditionEnabled, workingQuery } from "@/lib/working";
import { WorkingCatalog } from "@/components/working/catalog";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Activity, ArrowRight, BookOpenCheck, Globe2, ScrollText, ShieldCheck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/feedback";
import { getContentRepository } from "@/lib/content";

export default async function HomePage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string | string[] }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (workingEditionEnabled()) return (
    <div className="space-y-5">
      <Link href="/nursing-lab" className="group flex items-center gap-4 rounded-2xl border border-cyan-800/60 bg-gradient-to-br from-slate-950 to-cyan-950 p-5 text-slate-50 no-underline transition-colors hover:border-cyan-400 sm:px-7">
        <Activity aria-hidden className="size-7 shrink-0 text-cyan-300" />
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-bold">{locale === "ar" ? "مختبر تمريض العناية المركزة" : "ICU Nursing Lab"}</span>
          <span className="mt-1 block text-sm text-slate-300">{locale === "ar" ? "تدرّب على قرارات المناوبة وقراءة الأجهزة." : "Practise shift decisions, equipment skills and medication checks."}</span>
        </span>
        <ArrowRight aria-hidden className="size-5 shrink-0 text-cyan-300 rtl:rotate-180" />
      </Link>
      <WorkingCatalog query={await workingQuery(searchParams)} locale={locale} />
    </div>
  );
  const t = await getTranslations("Home");
  const lib = await getTranslations("Library");
  const repo = await getContentRepository();
  const domains = await repo.listDomains(locale);

  const trust = [
    { icon: ScrollText, title: t("how1Title"), body: t("how1Body") },
    { icon: ShieldCheck, title: t("how2Title"), body: t("how2Body") },
    { icon: BookOpenCheck, title: t("how3Title"), body: t("how3Body") },
    { icon: Globe2, title: t("how4Title"), body: t("how4Body") },
  ];

  return (
    <div className="space-y-16">
      <section className="grid items-center gap-8 md:grid-cols-[1.2fr_1fr]">
        <div className="space-y-5">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">{t("heroTitle")}</h1>
          <p className="max-w-prose text-lg text-muted-foreground">{t("heroBody")}</p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg"><Link href="/library">{t("ctaLibrary")}<ArrowRight className="size-4 rtl:rotate-180" aria-hidden /></Link></Button>
            <Button asChild size="lg" variant="outline"><Link href="/register">{t("ctaRegister")}</Link></Button>
          </div>
        </div>
        <div aria-hidden className="rounded-lg bg-navy p-6 text-navy-foreground">
          <p className="mb-3 text-xs uppercase tracking-widest opacity-70">Synthetic monitor illustration</p>
          <div className="grid grid-cols-3 gap-3 text-center font-mono">
            {[["HR", "—"], ["MAP", "—"], ["SpO₂", "—"]].map(([k, v]) => (
              <div key={k} className="rounded-md bg-black/30 p-3"><div className="text-xs opacity-70">{k}</div><div className="text-2xl text-teal-200">{v}</div></div>
            ))}
          </div>
          <p className="mt-3 text-xs opacity-70">No patient data. Illustration only.</p>
        </div>
      </section>

      <section aria-labelledby="domains-h" className="space-y-4">
        <div className="max-w-prose space-y-2">
          <h2 id="domains-h" className="text-2xl font-semibold">{t("domainsTitle")}</h2>
          <p className="text-muted-foreground">{t("domainsIntro")}</p>
        </div>
        <ol className="grid gap-x-8 md:grid-cols-2">
          {domains.map((d) => (
            <li key={d.id} className="border-b border-border">
              <Link href={`/library?domain=${d.slug}`} className="flex min-h-11 items-baseline gap-3 py-3 no-underline">
                <span className="w-6 shrink-0 text-sm tabular-nums text-muted-foreground">{d.sort}</span>
                <span className="space-y-0.5">
                  <span className="block font-medium text-foreground">{d.title}</span>
                  <span className="block text-sm text-muted-foreground">{d.summary}</span>
                </span>
                <span className="ms-auto shrink-0 text-xs text-muted-foreground">{lib("topicsInDomain", { count: d.topicCount })}</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="how-h" className="space-y-4">
        <h2 id="how-h" className="text-2xl font-semibold">{t("howTitle")}</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {trust.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex gap-3">
              <Icon className="mt-1 size-6 shrink-0 text-primary" aria-hidden />
              <div><h3 className="font-semibold">{title}</h3><p className="text-muted-foreground">{body}</p></div>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="road-h" className="space-y-2">
        <h2 id="road-h" className="text-xl font-semibold">{t("roadmapTitle")}</h2>
        <p className="max-w-prose text-muted-foreground">{t("roadmapBody")}</p>
      </section>

      <Callout tone="info" title={t("disclaimerTitle")}>{t("disclaimerBody")}</Callout>
    </div>
  );
}
