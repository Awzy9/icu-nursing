import { workingEditionEnabled, workingQuery } from "@/lib/working";
import { WorkingCatalog } from "@/components/working/catalog";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ClipboardCheck } from "lucide-react";
import { Callout } from "@/components/ui/feedback";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth";
import { localize } from "@/lib/content/localize";
import { listPractice } from "@/lib/practice";
import { PRACTICE_AREAS } from "@/lib/practice/types";
import { resolveMode } from "@/lib/question-bank";
import { ClearLocalButton, ScoreBadge } from "@/components/practice/status";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Practice" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function PracticeHub({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string | string[] }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (workingEditionEnabled()) return <WorkingCatalog query={await workingQuery(searchParams)} locale={locale} type="practice" />;
  const t = await getTranslations("Practice");
  const mode = resolveMode();
  if (mode === "disabled") {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <Callout tone="info" title={t("disabledTitle")}>{t("disabledBody")}</Callout>
      </div>
    );
  }
  if (mode === "database") await requireUser(locale, "/practice");
  const all = listPractice();
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="max-w-prose text-muted-foreground">{t("intro")}</p>
      </header>
      <Callout tone="warning" role="note">{t("fixturesBanner")}</Callout>
      <Callout tone="info" role="note">{t("noVerification")}</Callout>
      <p><Link href="/practice/competencies" className="font-medium underline">{t("competenciesLink")}</Link></p>
      {PRACTICE_AREAS.filter((a) => a !== "competency" && all.some((e) => e.area === a)).map((area) => (
        <section key={area} aria-labelledby={`area-${area}`} className="space-y-3">
          <h2 id={`area-${area}`} className="text-xl font-semibold">{t(`areas.${area}`)}</h2>
          <p className="max-w-prose text-sm text-muted-foreground">{t(`areaBody.${area}`)}</p>
          <ul className="grid gap-3 md:grid-cols-2">
            {all.filter((e) => e.area === area).map((e) => (
              <li key={e.code} className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4">
                <h3 className="flex items-center gap-2 font-semibold"><ClipboardCheck className="size-4" aria-hidden />
                  <Link href={`/practice/${e.code}`}>{localize(e.title, locale)}</Link></h3>
                <p className="text-sm text-muted-foreground">{t(`kinds.${e.kind}`)}</p>
                <ScoreBadge code={e.code} />
              </li>
            ))}
          </ul>
        </section>
      ))}
      <section aria-labelledby="px-self" className="space-y-2">
        <h2 id="px-self" className="text-xl font-semibold">{t("areas.competency")}</h2>
        <p className="max-w-prose text-sm text-muted-foreground">{t("areaBody.competency")}</p>
        <ul className="space-y-2">{all.filter((e) => e.area === "competency").map((e) => <li key={e.code}><Link href={`/practice/${e.code}`} className="font-medium underline">{localize(e.title, locale)}</Link></li>)}</ul>
      </section>
      <section aria-labelledby="px-data" className="space-y-2">
        <h2 id="px-data" className="text-xl font-semibold">{t("dataTitle")}</h2>
        <p className="max-w-prose text-sm">{t("dataBody")}</p>
        <ClearLocalButton />
      </section>
    </div>
  );
}
