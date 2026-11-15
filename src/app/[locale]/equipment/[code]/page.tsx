import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Badge, Callout } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { EquipmentExplorer } from "@/components/equipment/explorer";
import { Link } from "@/i18n/navigation";
import { localize, usedFallback } from "@/lib/content/localize";
import { getEquipment } from "@/lib/equipment";
import { requireUser } from "@/lib/auth";
import { EMPTY_STATE } from "@/lib/equipment/state";
import { getEquipmentStateService } from "@/lib/equipment/state-index";
import { resolveMode } from "@/lib/question-bank";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; code: string }> }) {
  const { locale, code } = await params;
  const t = await getTranslations({ locale, namespace: "Equipment" });
  const m = getEquipment(code);
  return { title: m ? localize(m.title, locale) : t("title"), robots: { index: false, follow: false } };
}

export default async function EquipmentDetail({ params }: { params: Promise<{ locale: string; code: string }> }) {
  const { locale, code } = await params;
  setRequestLocale(locale);
  const mode = resolveMode();
  if (mode === "disabled") notFound();
  const m = getEquipment(code);
  if (!m) notFound();
  if (mode === "database") await requireUser(locale, `/equipment/${code}`);
  const state = await getEquipmentStateService().then((svc) => svc?.get() ?? EMPTY_STATE).catch(() => EMPTY_STATE);
  const t = await getTranslations("Equipment");
  const rtl = locale.startsWith("ar");
  const fallback = usedFallback(m.title, locale);
  const list = (v: Record<string, string[]>) => v[locale] ?? v[locale.split("-")[0] ?? "en"] ?? v.en ?? [];
  return (
    <article className="space-y-8" lang={fallback ? "en" : undefined} dir={fallback ? "ltr" : undefined}>
      <nav aria-label={t("back")}><Button asChild variant="outline" size="sm"><Link href="/equipment">{t("back")}</Link></Button></nav>
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">{localize(m.title, locale)}</h1>
        <div className="flex flex-wrap gap-2 text-sm"><Badge tone="warning">{t("syntheticBadge")}</Badge><Badge>{t(`categories.${m.category}`)}</Badge></div>
        <p className="max-w-prose text-muted-foreground">{localize(m.summary, locale)}</p>
      </header>
      <Callout tone="warning" role="note">{t("fixturesBanner")}</Callout>
      <EquipmentExplorer initial={state} code={m.code} kind={m.diagram.kind} rtl={rtl} title={localize(m.title, locale)} alt={localize(m.diagram.alt, locale)}
        parts={m.diagram.parts.map((p) => ({ id: p.id, label: localize(p.label, locale), detail: localize(p.detail, locale) }))}
        labels={{ parts: t("partsHeading"), select: t("selectPart"), viewed: t("viewed"), progress: t("progress"), bookmark: t("bookmark"), bookmarked: t("bookmarkedButton"), hint: t("partsHint") }} />
      <section aria-labelledby="eq-params" className="space-y-3">
        <h2 id="eq-params" className="text-xl font-semibold">{t("parametersHeading")}</h2>
        <dl className="grid gap-3 md:grid-cols-2">
          {m.parameters.map((p) => (
            <div key={p.key} className="rounded-lg border border-border bg-card p-4">
              <dt className="font-semibold">{localize(p.name, locale)}</dt>
              <dd className="text-sm text-muted-foreground">{localize(p.meaning, locale)}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section aria-labelledby="eq-safety" className="space-y-2">
        <h2 id="eq-safety" className="text-xl font-semibold">{t("safetyHeading")}</h2>
        <ul className="list-disc space-y-1 ps-6">{list(m.safety).map((s) => <li key={s}>{s}</li>)}</ul>
      </section>
      <section aria-labelledby="eq-esc" className="space-y-2">
        <h2 id="eq-esc" className="text-xl font-semibold">{t("escalationHeading")}</h2>
        <ul className="list-disc space-y-1 ps-6">{list(m.escalation).map((s) => <li key={s}>{s}</li>)}</ul>
      </section>
      <Callout tone="info" role="note">{t("notice")}</Callout>
    </article>
  );
}
