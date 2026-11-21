import { getTranslations, setRequestLocale } from "next-intl/server";
import { Callout } from "@/components/ui/feedback";
import { Link } from "@/i18n/navigation";
import { SUPPORT_EMAIL } from "@/lib/support-contact";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Support" });
  return { title: t("title") };
}

/** Public page (no sign-in): where a person, or a store reviewer, can find how to reach support. */
export default async function Support({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Support");
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <p>{t("intro")}</p>
      <section aria-labelledby="email" className="space-y-2">
        <h2 id="email" className="text-xl font-semibold">{t("emailTitle")}</h2>
        <p>{t("emailBody", { email: SUPPORT_EMAIL })}</p>
        <p><a className="font-medium" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></p>
      </section>
      <section aria-labelledby="response" className="space-y-2">
        <h2 id="response" className="text-xl font-semibold">{t("responseTitle")}</h2>
        <p>{t("responseBody")}</p>
      </section>
      <section aria-labelledby="help" className="space-y-2">
        <h2 id="help" className="text-xl font-semibold">{t("helpTitle")}</h2>
        <ul className="list-disc space-y-1 ps-6">
          <li><Link href="/privacy">{t("helpPrivacy")}</Link></li>
          <li><Link href="/account-deletion">{t("helpDeletion")}</Link></li>
          <li><Link href="/terms">{t("helpTerms")}</Link></li>
        </ul>
      </section>
      <Callout tone="info" role="note">{t("educationNote")}</Callout>
    </div>
  );
}
