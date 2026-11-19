import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function SiteFooter() {
  const t = await getTranslations("Footer");
  const c = await getTranslations("Common");
  const n = await getTranslations("Nav");
  return (
    <footer className="mt-16 border-t border-border bg-card">
      <div className="container space-y-3 py-8 text-sm text-muted-foreground">
        <p className="max-w-3xl">{c("disclaimerShort")}</p>
        <p><Link href="/privacy">{t("privacy")}</Link> · <Link href="/terms">{t("terms")}</Link> · <Link href="/pricing">{n("plans")}</Link> · <Link href="/account-deletion">{t("accountDeletion")}</Link></p>
        <p>{t("rights", { year: new Date().getUTCFullYear() })}</p>
      </div>
    </footer>
  );
}
