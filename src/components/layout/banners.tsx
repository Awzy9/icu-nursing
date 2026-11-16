import { getTranslations } from "next-intl/server";
import { Callout } from "@/components/ui/feedback";
import { getEnv, isDemoMode } from "@/lib/env";

export async function SiteBanners({ locale }: { locale: string }) {
  const t = await getTranslations("Common");
  return (
    <div className="container space-y-2 pt-3">
      {getEnv().NEXT_PUBLIC_APP_ENV === "staging" ? <Callout tone="info" role="status">{t("stagingBanner")}</Callout> : null}
      {isDemoMode() ? <Callout tone="warning" role="status">{t("demoBanner")}</Callout> : null}
      {locale === "ar" ? <Callout tone="info" role="status">{t("arDraftNotice")}</Callout> : null}
    </div>
  );
}
