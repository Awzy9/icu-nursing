import { getTranslations, setRequestLocale } from "next-intl/server";
import { Callout } from "@/components/ui/feedback";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "AccountDeletion" });
  return { title: t("deletedTitle"), robots: { index: false, follow: false } };
}

export default async function AccountDeletedPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("AccountDeletion");
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-3xl font-bold">{t("deletedTitle")}</h1>
      <Callout tone="success" role="status">{t("deletedBody")}</Callout>
      <p><Link href="/">{t("home")}</Link></p>
    </div>
  );
}
