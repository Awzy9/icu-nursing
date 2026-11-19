import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SUPPORT_EMAIL, formatLegalDate } from "@/lib/support-contact";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Privacy" });
  return { title: t("title") };
}

/** Public page (no sign-in needed): the privacy policy covering both the website and the mobile app, required by both app stores before submission. */
export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Privacy");
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <p className="text-sm text-muted-foreground">{t("updated", { date: formatLegalDate(locale) })}</p>
      <p>{t("intro")}</p>

      <section aria-labelledby="local" className="space-y-2">
        <h2 id="local" className="text-xl font-semibold">{t("localTitle")}</h2>
        <p>{t("localBody")}</p>
      </section>

      <section aria-labelledby="account" className="space-y-2">
        <h2 id="account" className="text-xl font-semibold">{t("accountTitle")}</h2>
        <p>{t("accountIntro")}</p>
        <ul className="list-disc space-y-1 ps-6">{(["i1", "i2", "i3", "i4"] as const).map((k) => <li key={k}>{t(`accountItems.${k}`)}</li>)}</ul>
      </section>

      <section aria-labelledby="no-collect" className="space-y-2">
        <h2 id="no-collect" className="text-xl font-semibold">{t("noCollectTitle")}</h2>
        <ul className="list-disc space-y-1 ps-6">{(["n1", "n2", "n3", "n4"] as const).map((k) => <li key={k}>{t(`noCollectItems.${k}`)}</li>)}</ul>
      </section>

      <section aria-labelledby="who" className="space-y-2">
        <h2 id="who" className="text-xl font-semibold">{t("whoTitle")}</h2>
        <p>{t("whoBody")}</p>
      </section>

      <section aria-labelledby="children" className="space-y-2">
        <h2 id="children" className="text-xl font-semibold">{t("childrenTitle")}</h2>
        <p>{t("childrenBody")}</p>
      </section>

      <section aria-labelledby="deletion" className="space-y-2">
        <h2 id="deletion" className="text-xl font-semibold">{t("deletionTitle")}</h2>
        <p>{t("deletionBody")}</p>
        <p><Link href="/account-deletion" className="font-medium">{t("deletionLink")}</Link></p>
        <p className="text-sm text-muted-foreground">{t("backupsBody")}</p>
      </section>

      <section aria-labelledby="rights" className="space-y-2">
        <h2 id="rights" className="text-xl font-semibold">{t("rightsTitle")}</h2>
        <p>{t("rightsBody")}</p>
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
