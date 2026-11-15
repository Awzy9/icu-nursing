import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/feedback";
import { Link } from "@/i18n/navigation";
import { billingMode } from "@/lib/billing/mode";
import { FEATURES, PLAN_CATALOG } from "@/lib/billing/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Billing" });
  return { title: t("pricingTitle") };
}

/** Public plan comparison. No price, no checkout, no card form: nothing can be bought here yet. */
export default async function PricingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Billing");
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold">{t("pricingTitle")}</h1>
      <Callout tone="warning" role="note">{t("testBanner")}</Callout>
      <p>{t("principle")}</p>
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">{t("pricingTitle")}</caption>
        <thead><tr><th scope="col" className="border border-border bg-muted p-2 text-start">{t("columns.feature")}</th><th scope="col" className="border border-border bg-muted p-2 text-start">{t("columns.free")}</th><th scope="col" className="border border-border bg-muted p-2 text-start">{t("columns.premium")}</th></tr></thead>
        <tbody>
          <tr><th scope="row" className="border border-border p-2 text-start font-medium">{t("pricing")}</th><td className="border border-border p-2">{t("priceTbd")}</td><td className="border border-border p-2">{t("priceTbd")}</td></tr>
          <tr><th scope="row" className="border border-border p-2 text-start font-medium">{t("freeIncludes")}</th><td className="border border-border p-2">{t("included")}</td><td className="border border-border p-2">{t("included")}</td></tr>
          {FEATURES.map((f) => (
            <tr key={f}><th scope="row" className="border border-border p-2 text-start font-medium">{t(`featureNames.${f}`)}</th>
              <td className="border border-border p-2">{PLAN_CATALOG.free.features.includes(f) ? t("included") : t("notIncluded")}</td>
              <td className="border border-border p-2">{PLAN_CATALOG.premium.features.includes(f) ? t("included") : t("notIncluded")}</td></tr>
          ))}
        </tbody>
      </table>
      <p className="text-sm text-muted-foreground">{t("pricingNote")}</p>
      {billingMode() === "mock" ? <Button asChild><Link href="/account/billing">{t("manage")}</Link></Button> : null}
    </div>
  );
}
