import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Callout } from "@/components/ui/feedback";
import { requireUser } from "@/lib/auth";
import { getCaseService } from "@/lib/cases";
import { resolveMode } from "@/lib/question-bank";
import { CaseRunner } from "@/components/cases/case-runner";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Cases" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function CaseAttemptPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Cases");
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const mode = resolveMode();
  if (mode === "disabled") notFound();
  if (mode === "database") await requireUser(locale, `/cases/attempt/${id}`);
  const svc = await getCaseService().catch(() => null);
  if (!svc) notFound();
  const view = await svc.get(id).catch(() => undefined);
  if (view === undefined) return <Callout tone="danger">{t("loadError")}</Callout>;
  if (!view || view.status === "abandoned") notFound();
  return (
    <div className="space-y-4">
      {mode === "fixtures" ? <Callout tone="warning" role="note">{t("fixturesBanner")}</Callout> : null}
      <CaseRunner initial={view} locale={locale} />
    </div>
  );
}
