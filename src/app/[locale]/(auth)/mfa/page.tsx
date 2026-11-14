import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthShell } from "@/components/auth/auth-shell";
import { MfaPanel } from "@/components/auth/mfa-panel";
import { requireUser } from "@/lib/auth";
import { isDemoMode } from "@/lib/env";
import { safeRedirectPath } from "@/lib/utils";

export default async function MfaPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ next?: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { next } = await searchParams;
  if (!isDemoMode()) await requireUser(locale, "/mfa");
  const t = await getTranslations("Auth");
  return (
    <AuthShell title={t("mfaTitle")}>
      {!isDemoMode() ? <MfaPanel next={safeRedirectPath(next, "/admin")} /> : null}
    </AuthShell>
  );
}
