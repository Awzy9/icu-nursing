import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export default async function NotFound() {
  const t = await getTranslations("Common");
  return (
    <div className="mx-auto max-w-prose space-y-4 py-12">
      <h1 className="text-3xl font-bold">{t("notFoundTitle")}</h1>
      <p className="text-muted-foreground">{t("notFoundBody")}</p>
      <Button asChild><Link href="/">{t("goHome")}</Link></Button>
    </div>
  );
}
