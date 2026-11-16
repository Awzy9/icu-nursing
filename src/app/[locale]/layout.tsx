import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing, isRtl } from "@/i18n/routing";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteBanners } from "@/components/layout/banners";
import "../globals.css";

// Pages are rendered per request so Next.js can stamp the per-request CSP nonce on its inline scripts.
export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Meta" });
  return { title: { default: t("title"), template: `%s · ${t("title")}` }, description: t("description"), robots: { index: true, follow: true } };
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("Common");
  const bare = (await headers()).get("x-bare-page") === "1";
  if (bare) return (
    <html lang={locale} dir={isRtl(locale) ? "rtl" : "ltr"}>
      <body className="p-3"><NextIntlClientProvider><main id="main" tabIndex={-1}>{children}</main></NextIntlClientProvider></body>
    </html>
  );
  return (
    <html lang={locale} dir={isRtl(locale) ? "rtl" : "ltr"}>
      <body className="flex min-h-dvh flex-col">
        <NextIntlClientProvider>
          <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:start-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2">
            {t("skipToContent")}
          </a>
          <SiteHeader />
          <SiteBanners locale={locale} />
          <main id="main" className="container flex-1 py-8" tabIndex={-1}>{children}</main>
          <SiteFooter />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
