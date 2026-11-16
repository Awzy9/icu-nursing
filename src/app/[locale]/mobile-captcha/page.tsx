import { getTranslations, setRequestLocale } from "next-intl/server";
import { NativeCaptcha } from "@/components/auth/native-captcha";

export const dynamic = "force-dynamic";
export const metadata = { title: "Security check", robots: { index: false, follow: false } };

/** Not a content page: it exists only to host the Turnstile challenge inside the native apps' restricted WebView. */
export default async function MobileCaptcha({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("MobileCaptcha");
  return <NativeCaptcha siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} labels={{ title: t("title"), unavailable: t("unavailable"), waiting: t("waiting"), done: t("done") }} />;
}
