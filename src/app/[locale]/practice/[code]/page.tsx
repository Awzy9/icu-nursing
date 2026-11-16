import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/feedback";
import { ExerciseRunner } from "@/components/practice/exercise-runner";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth";
import { localize, usedFallback } from "@/lib/content/localize";
import { getPractice } from "@/lib/practice";
import { resolveMode } from "@/lib/question-bank";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; code: string }> }) {
  const { locale, code } = await params;
  const t = await getTranslations({ locale, namespace: "Practice" });
  const e = getPractice(code);
  return { title: e ? localize(e.title, locale) : t("title"), robots: { index: false, follow: false } };
}

export default async function PracticeExercisePage({ params }: { params: Promise<{ locale: string; code: string }> }) {
  const { locale, code } = await params;
  setRequestLocale(locale);
  const mode = resolveMode();
  if (mode === "disabled") notFound();
  const e = getPractice(code);
  if (!e) notFound();
  if (mode === "database") await requireUser(locale, `/practice/${code}`);
  const t = await getTranslations("Practice");
  const fallback = usedFallback(e.title, locale);
  return (
    <article className="space-y-6" lang={fallback ? "en" : undefined} dir={fallback ? "ltr" : undefined}>
      <nav aria-label={t("back")}><Button asChild variant="outline" size="sm"><Link href="/practice">{t("back")}</Link></Button></nav>
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">{localize(e.title, locale)}</h1>
        <p className="text-sm text-muted-foreground">{t(`areas.${e.area}`)} · {t(`kinds.${e.kind}`)}</p>
      </header>
      <Callout tone="warning" role="note">{localize(e.summary, locale)}</Callout>
      <ExerciseRunner exercise={e} locale={locale} />
    </article>
  );
}
