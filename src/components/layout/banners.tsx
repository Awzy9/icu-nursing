import { getTranslations } from "next-intl/server";
import { Callout } from "@/components/ui/feedback";
import { isDemoMode } from "@/lib/env";

export async function SiteBanners({ locale }: { locale: string }) {
  const t = await getTranslations("Common");
  return (
    <div className="container space-y-2 pt-3">
      {isDemoMode() ? <Callout tone="warning" role="status">{t("demoBanner")}</Callout> : null}
      {locale === "ar" ? <Callout tone="info" role="status">{t("arDraftNotice")}</Callout> : null}
    </div>
  );
}
