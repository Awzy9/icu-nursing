import { getTranslations, setRequestLocale } from "next-intl/server";
import { SUPPORT_EMAIL, formatLegalDate } from "@/lib/support-contact";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Terms" });
  return { title: t("title") };
}

/** Public page (no sign-in needed): terms of use covering both the website and the mobile app. */
export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Terms");
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <p className="text-sm text-muted-foreground">{t("updated", { date: formatLegalDate(locale) })}</p>
      <p>{t("intro")}</p>

      <section aria-labelledby="purpose" className="space-y-2">
        <h2 id="purpose" className="text-xl font-semibold">{t("purposeTitle")}</h2>
        <p>{t("purposeBody")}</p>
      </section>

      <section aria-labelledby="accounts" className="space-y-2">
        <h2 id="accounts" className="text-xl font-semibold">{t("accountsTitle")}</h2>
        <p>{t("accountsBody")}</p>
      </section>

      <section aria-labelledby="conduct" className="space-y-2">
        <h2 id="conduct" className="text-xl font-semibold">{t("conductTitle")}</h2>
        <p>{t("conductBody")}</p>
      </section>

      <section aria-labelledby="content" className="space-y-2">
        <h2 id="content" className="text-xl font-semibold">{t("contentTitle")}</h2>
        <p>{t("contentBody")}</p>
      </section>

      <section aria-labelledby="billing" className="space-y-2">
        <h2 id="billing" className="text-xl font-semibold">{t("billingTitle")}</h2>
        <p>{t("billingBody")}</p>
      </section>

      <section aria-labelledby="warranty" className="space-y-2">
        <h2 id="warranty" className="text-xl font-semibold">{t("warrantyTitle")}</h2>
        <p>{t("warrantyBody")}</p>
      </section>

      <section aria-labelledby="changes" className="space-y-2">
        <h2 id="changes" className="text-xl font-semibold">{t("changesTitle")}</h2>
        <p>{t("changesBody")}</p>
      </section>

      <section aria-labelledby="contact" className="space-y-2">
        <h2 id="contact" className="text-xl font-semibold">{t("contactTitle")}</h2>
        <p>{t("contactBody", { email: SUPPORT_EMAIL })}</p>
      </section>
    </div>
  );
}
