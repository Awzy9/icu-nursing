import { getTranslations } from "next-intl/server";

export async function SiteFooter() {
  const t = await getTranslations("Footer");
  const c = await getTranslations("Common");
  return (
    <footer className="mt-16 border-t border-border bg-card">
      <div className="container space-y-3 py-8 text-sm text-muted-foreground">
        <p className="max-w-3xl">{c("disclaimerShort")}</p>
        <p>{t("legalPending")}</p>
        <p>{t("rights", { year: new Date().getUTCFullYear() })}</p>
      </div>
    </footer>
  );
}
