import { getTranslations, setRequestLocale } from "next-intl/server";
import { BillingPanel } from "@/components/billing/panel";
import { Badge, Callout } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth";
import { getBillingService, billingMode } from "@/lib/billing";
import { FEATURES, FREE_STATE, type SubscriptionState } from "@/lib/billing/types";
import { resolveMode } from "@/lib/question-bank";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Billing" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function BillingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Billing");
  const mode = resolveMode();
  if (mode === "database") await requireUser(locale, "/account/billing");
  let state: SubscriptionState = FREE_STATE; let available = false; let failed = false;
  try { const svc = await getBillingService(); if (svc) { state = await svc.state(); available = true; } } catch { failed = true; }
  const fmt = (iso?: string | null) => (iso ? new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "UTC" }).format(new Date(iso)) : "");
  if (!available) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <Callout tone="info" title={t("unavailableTitle")}>{failed ? t("errors.unavailable") : t("unavailableBody")}</Callout>
        <Button asChild variant="outline"><Link href="/pricing">{t("seePlans")}</Link></Button>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <Callout tone="warning" role="note">{t("testBanner")}</Callout>
      <section aria-labelledby="bl-plan" className="space-y-3 rounded-lg border border-border bg-card p-4">
        <h2 id="bl-plan" className="text-xl font-semibold">{t("currentPlan")}</h2>
        <p className="flex flex-wrap items-center gap-2" data-testid="bl-plan">
          <b>{t(`planNames.${state.plan}`)}</b> <Badge tone={state.premium ? "success" : "info"}>{t(`status.${state.status}`)}</Badge>
        </p>
        {state.premium ? <p data-testid="bl-period" className="text-sm">{state.cancel_at_period_end ? t("cancelScheduled", { date: fmt(state.period_end) }) : t("renews", { date: fmt(state.period_end) })}</p> : null}
        <BillingPanel premium={state.premium} status={state.status} cancelAtPeriodEnd={state.cancel_at_period_end} mockTools={state.mock_payments} />
      </section>
      <section aria-labelledby="bl-feat" className="space-y-2">
        <h2 id="bl-feat" className="text-xl font-semibold">{t("features")}</h2>
        <ul className="list-disc space-y-1 ps-5">{FEATURES.map((f) => <li key={f}>{t(`featureNames.${f}`)} {state.entitlements.includes(f) ? <Badge tone="success">{t("included")}</Badge> : <Badge>{t("notIncluded")}</Badge>}</li>)}</ul>
        <p className="text-sm text-muted-foreground">{t("freeIncludes")}</p>
        <p className="text-sm">{t("principle")}</p>
      </section>
      <section aria-labelledby="bl-hist" className="space-y-2">
        <h2 id="bl-hist" className="text-xl font-semibold">{t("history")}</h2>
        {state.history.length === 0 ? <p className="text-sm text-muted-foreground">{t("noHistory")}</p> : (
          <ol className="divide-y divide-border border-y border-border" data-testid="bl-history">
            {state.history.map((e, i) => <li key={i} className="flex flex-wrap justify-between gap-2 py-2 text-sm"><span>{t(`events.${e.type}`)}</span><time dateTime={e.at}>{fmt(e.at)}</time></li>)}
          </ol>
        )}
      </section>
      <p className="text-xs text-muted-foreground">{billingMode() === "mock" ? t("pricingNote") : ""}</p>
    </div>
  );
}
