import { getTranslations, setRequestLocale } from "next-intl/server";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge, Callout } from "@/components/ui/feedback";
import { Field, Input } from "@/components/ui/form";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth";
import { isDemoMode } from "@/lib/env";
import { MAX_QUERY } from "@/lib/search";
import { askTutor, TutorError, tutorUsageRemaining } from "@/lib/tutor";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Tutor" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function TutorPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string | string[] }> }) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  if (!isDemoMode()) await requireUser(locale, "/tutor");
  const t = await getTranslations("Tutor");
  const tKinds = await getTranslations("Search.kinds");
  const tSearch = await getTranslations("Search");
  const raw = Array.isArray(sp.q) ? sp.q[0] : sp.q;
  const q = typeof raw === "string" ? raw.slice(0, MAX_QUERY) : "";

  let errorKey: TutorError["code"] | null = null;
  let answer: Awaited<ReturnType<typeof askTutor>> | null = null;
  if (q) {
    try {
      answer = await askTutor(q, locale);
    } catch (e) {
      errorKey = e instanceof TutorError ? e.code : "unavailable";
    }
  }
  const usage = await tutorUsageRemaining();

  return (
    <div className="space-y-6">
      <h1 className="flex items-center gap-2 text-3xl font-bold"><MessageCircle className="size-7" aria-hidden />{t("title")}</h1>
      <p className="max-w-prose text-muted-foreground">{t("intro")}</p>
      {isDemoMode() ? <Callout tone="info" role="note">{t("demoNotice")}</Callout> : null}
      <Callout tone="warning" role="note">{t("disclaimer")}</Callout>
      <form method="get" role="search" className="flex flex-wrap items-end gap-2">
        <Field label={t("label")} htmlFor="q"><Input id="q" name="q" type="search" defaultValue={q} maxLength={MAX_QUERY} autoComplete="off" /></Field>
        <Button type="submit"><MessageCircle className="size-4" aria-hidden />{t("button")}</Button>
      </form>
      {usage ? <p className="text-xs text-muted-foreground">{t("usage", { hour: usage.remainingThisHour, day: usage.remainingToday })}</p> : null}
      {errorKey ? <Callout tone="danger" role="alert">{t(`error.${errorKey}`)}</Callout> : null}
      {answer?.refused ? (
        <Callout tone="warning" role="alert">{t(`refusal.${answer.refusalKind}`)}</Callout>
      ) : null}
      {answer && !answer.refused ? (
        answer.hits.length ? (
          <section aria-labelledby="tutor-results" className="space-y-2">
            <h2 id="tutor-results" className="text-xl font-semibold">{t("foundIntro")}</h2>
            <ul className="divide-y divide-border border-y border-border">
              {answer.hits.map((h) => (
                <li key={h.href} className="space-y-1 py-3">
                  <p className="flex flex-wrap items-center gap-2">
                    <Link href={h.href} className="font-medium">{h.title}</Link>
                    <Badge tone="info">{tKinds(h.kind)}</Badge>
                    {h.synthetic ? <Badge tone="warning">{tSearch("sample")}</Badge> : null}
                  </p>
                  {h.summary ? <p className="max-w-prose text-sm text-muted-foreground">{h.summary.slice(0, 200)}</p> : null}
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <p role="status" aria-live="polite" className="text-sm text-muted-foreground">{t("noResults")}</p>
        )
      ) : null}
    </div>
  );
}
