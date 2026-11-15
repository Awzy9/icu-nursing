import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Callout } from "@/components/ui/feedback";
import { requireUser } from "@/lib/auth";
import { getSkillService } from "@/lib/skills";
import { resolveMode } from "@/lib/question-bank";
import { ChecklistRunner } from "@/components/skills/checklist-runner";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Skills" });
  return { title: t("sessionTitle"), robots: { index: false, follow: false } };
}

export default async function SkillSessionPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Skills");
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const mode = resolveMode();
  if (mode === "disabled") notFound();
  if (mode === "database") await requireUser(locale, `/skills/session/${id}`);
  const svc = await getSkillService().catch(() => null);
  if (!svc) notFound();
  const view = await svc.getSession(id).catch(() => undefined);
  if (view === undefined) return <Callout tone="danger">{t("loadError")}</Callout>;
  if (!view || view.status === "abandoned") notFound();
  return (
    <div className="space-y-4">
      {mode === "fixtures" ? <Callout tone="warning" role="note">{t("fixturesBanner")}</Callout> : null}
      <ChecklistRunner initial={view} locale={locale} />
    </div>
  );
}
