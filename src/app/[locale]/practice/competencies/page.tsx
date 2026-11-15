import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/feedback";
import { CompetencyTracker } from "@/components/practice/status";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth";
import { localize } from "@/lib/content/localize";
import { loadSkillFixtures } from "@/lib/skills/fixtures";
import { resolveMode } from "@/lib/question-bank";
import { getBillingService } from "@/lib/billing";
import { hasEntitlement } from "@/lib/billing/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Practice" });
  return { title: t("competenciesTitle"), robots: { index: false, follow: false } };
}

/** A self-assessment map over the (synthetic) skills list. Nothing here is verified, scored, certified or sent to a server. */
export default async function Competencies({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Practice");
  const mode = resolveMode();
  if (mode === "disabled") return <div className="space-y-4"><h1 className="text-3xl font-bold">{t("competenciesTitle")}</h1><Callout tone="info" title={t("disabledTitle")}>{t("disabledBody")}</Callout></div>;
  if (mode === "database") await requireUser(locale, "/practice/competencies");
  const canExport = await getBillingService().then((svc) => svc?.state()).then((st) => (st ? hasEntitlement(st, "progress_export") : false)).catch(() => false);
  const skills = loadSkillFixtures().map((s) => ({ code: s.code, title: localize(s.title, locale) }));
  return (
    <div className="space-y-6">
      <nav aria-label={t("back")}><Button asChild variant="outline" size="sm"><Link href="/practice">{t("back")}</Link></Button></nav>
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">{t("competenciesTitle")}</h1>
        <p className="max-w-prose text-muted-foreground">{t("competenciesIntro")}</p>
      </header>
      <Callout tone="warning" role="note">{t("fixturesBanner")}</Callout>
      <Callout tone="info" role="note">{t("noVerification")}</Callout>
      <CompetencyTracker skills={skills} canExport={canExport} />
    </div>
  );
}
