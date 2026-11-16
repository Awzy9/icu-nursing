import { getTranslations, setRequestLocale } from "next-intl/server";
import { Callout } from "@/components/ui/feedback";
import { EquipmentList } from "@/components/equipment/equipment-list";
import { localize } from "@/lib/content/localize";
import { listEquipment } from "@/lib/equipment";
import { requireUser } from "@/lib/auth";
import { EMPTY_STATE } from "@/lib/equipment/state";
import { getEquipmentStateService } from "@/lib/equipment/state-index";
import { resolveMode } from "@/lib/question-bank";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Equipment" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function EquipmentPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Equipment");
  const mode = resolveMode();
  if (mode === "disabled") {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <Callout tone="info" title={t("disabledTitle")}>{t("disabledBody")}</Callout>
      </div>
    );
  }
  if (mode === "database") await requireUser(locale, "/equipment");
  const state = await getEquipmentStateService().then((svc) => svc?.get() ?? EMPTY_STATE).catch(() => EMPTY_STATE);
  const items = listEquipment().map((m) => ({
    code: m.code, category: m.category, categoryLabel: t(`categories.${m.category}`), title: localize(m.title, locale), summary: localize(m.summary, locale),
    parts: m.diagram.parts.map((p) => p.id), synthetic: m.synthetic,
  }));
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="max-w-prose text-muted-foreground">{t("intro")}</p>
      </header>
      <Callout tone="warning" role="note">{t("fixturesBanner")}</Callout>
      <Callout tone="info" role="note">{t("notice")}</Callout>
      <EquipmentList state={state} items={items} labels={{ onlyBookmarked: t("onlyBookmarked"), view: t("view"), bookmarked: t("bookmarked"), explored: t("explored"), none: t("noBookmarks"), synthetic: t("syntheticBadge"), partsDone: t("partsDone"), stats: t("stats") }} />
    </div>
  );
}
