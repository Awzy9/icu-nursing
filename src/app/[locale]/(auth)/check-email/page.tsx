import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthShell } from "@/components/auth/auth-shell";

export default async function CheckEmailPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ email?: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { email } = await searchParams;
  const t = await getTranslations("Auth");
  const shown = (email ?? "").slice(0, 254);
  return (
    <AuthShell title={t("verifyTitle")}>
      <p role="status">{t("verifyBody", { email: shown })}</p>
    </AuthShell>
  );
}
