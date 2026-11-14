import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { isFutureFeature } from "@/components/layout/nav-items";

export default async function ComingSoon({ params }: { params: Promise<{ locale: string; feature: string }> }) {
  const { locale, feature } = await params;
  setRequestLocale(locale);
  if (!isFutureFeature(feature)) notFound();
  const nav = await getTranslations("Nav");
  const t = await getTranslations("ComingSoon");
  return (
    <div className="mx-auto max-w-prose space-y-4 py-8">
      <h1 className="text-3xl font-bold">{t("title", { feature: nav(feature) })}</h1>
      <p className="text-muted-foreground">{t("body")}</p>
      <Button asChild variant="outline"><Link href="/library">{t("back")}</Link></Button>
    </div>
  );
}
