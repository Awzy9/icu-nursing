import { getTranslations, setRequestLocale } from "next-intl/server";
import { Callout } from "@/components/ui/feedback";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "AccountDeletion" });
  return { title: t("publicTitle") };
}

/** Public page (no sign-in): where a person, or a store reviewer, can read how to delete an account and what happens to the data. */
export default async function AccountDeletionInfo({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("AccountDeletion");
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">{t("publicTitle")}</h1>
      <p>{t("publicIntro")}</p>
      <section aria-labelledby="how" className="space-y-2">
        <h2 id="how" className="text-xl font-semibold">{t("howTitle")}</h2>
        <ol className="list-decimal space-y-1 ps-6">{(["s1", "s2", "s3", "s4"] as const).map((k) => <li key={k}>{t(`steps.${k}`)}</li>)}</ol>
        <p><Link href="/account/delete" className="font-medium">{t("goToDeletion")}</Link></p>
      </section>
      <section aria-labelledby="what" className="space-y-2">
        <h2 id="what" className="text-xl font-semibold">{t("whatTitle")}</h2>
        <ul className="list-disc space-y-1 ps-6">{(["w1", "w2", "w3", "w4"] as const).map((k) => <li key={k}>{t(`erased.${k}`)}</li>)}</ul>
        <h2 className="pt-2 text-xl font-semibold">{t("keptTitle")}</h2>
        <ul className="list-disc space-y-1 ps-6">{(["k1", "k2", "k3"] as const).map((k) => <li key={k}>{t(`kept.${k}`)}</li>)}</ul>
        <p className="text-sm text-muted-foreground">{t("recovery")}</p>
      </section>
      <Callout tone="info" title={t("staffTitle")} role="note">{t("staffBody")}</Callout>
    </div>
  );
}
