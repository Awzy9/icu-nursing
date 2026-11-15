import { getTranslations, setRequestLocale } from "next-intl/server";
import { DeleteAccountForm } from "@/components/account/delete-account-form";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/feedback";
import { Link } from "@/i18n/navigation";
import { isRecentlyAuthenticated, RECENT_SECONDS } from "@/lib/account/deletion";
import { getRoles, requireUser, STAFF_ROLES } from "@/lib/auth";
import { isDemoMode } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "AccountDeletion" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function DeleteAccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("AccountDeletion");
  if (isDemoMode()) return <Callout tone="warning">{t("demo")}</Callout>;
  const user = await requireUser(locale, "/account/delete");
  const roles = await getRoles(user.id);
  const supabase = (await createClient())!;
  const { data } = await supabase.auth.getClaims(); // verified claims; the database checks the same thing again
  const recent = isRecentlyAuthenticated(data?.claims.amr, Math.floor(Date.now() / 1000));
  const isStaff = roles.some((r) => STAFF_ROLES.includes(r));
  const errors = Object.fromEntries(["auth", "recent", "secondFactor", "mismatch", "staff", "retained", "rate", "invalid", "generic"].map((k) => [k, t(`errors.${k}`)]));
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <Callout tone="danger" title={t("warningTitle")} role="note">{t("warningBody")}</Callout>
      <section aria-labelledby="del-what" className="space-y-2">
        <h2 id="del-what" className="text-xl font-semibold">{t("whatTitle")}</h2>
        <ul className="list-disc space-y-1 ps-6">{(["w1", "w2", "w3", "w4"] as const).map((k) => <li key={k}>{t(`erased.${k}`)}</li>)}</ul>
        <h2 className="pt-2 text-xl font-semibold">{t("keptTitle")}</h2>
        <ul className="list-disc space-y-1 ps-6">{(["k1", "k2", "k3"] as const).map((k) => <li key={k}>{t(`kept.${k}`)}</li>)}</ul>
        <p className="text-sm text-muted-foreground">{t("recovery")}</p>
      </section>
      {isStaff ? (
        <Callout tone="warning" title={t("staffTitle")}>{t("staffBody")}</Callout>
      ) : !recent ? (
        <Callout tone="info" title={t("reauthTitle")}>
          <p>{t("reauthBody", { minutes: RECENT_SECONDS / 60 })}</p>
          <p className="pt-2"><Button asChild><Link href={{ pathname: "/login", query: { next: "/account/delete" } }}>{t("reauthButton")}</Link></Button></p>
        </Callout>
      ) : (
        <section aria-labelledby="del-form" className="space-y-3">
          <h2 id="del-form" className="text-xl font-semibold">{t("formTitle")}</h2>
          <DeleteAccountForm labels={{ email: t("emailLabel"), emailHint: t("emailHint", { email: user.email ?? "" }), understand: t("understand"), submit: t("submit"), confirmQuestion: t("confirmQuestion"), errors }} />
        </section>
      )}
      <p><Link href="/account">{t("cancel")}</Link></p>
    </div>
  );
}
