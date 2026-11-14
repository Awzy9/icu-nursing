import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { Field, Input } from "@/components/ui/form";
import { Link } from "@/i18n/navigation";
import { safeRedirectPath } from "@/lib/utils";
import { signInAction } from "../actions";

export default async function LoginPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ next?: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { next } = await searchParams;
  const t = await getTranslations("Auth");
  return (
    <AuthShell title={t("loginTitle")}>
      <AuthForm action={signInAction} captcha submitLabel={t("signInButton")} hidden={{ next: safeRedirectPath(next) }}>
        <Field label={t("email")} htmlFor="email"><Input id="email" name="email" type="email" autoComplete="email" required /></Field>
        <Field label={t("password")} htmlFor="password"><Input id="password" name="password" type="password" autoComplete="current-password" required /></Field>
      </AuthForm>
      <p className="text-sm"><Link href="/forgot-password">{t("forgot")}</Link></p>
      <p className="text-sm text-muted-foreground">{t("noAccount")} <Link href="/register">{t("signUpButton")}</Link></p>
    </AuthShell>
  );
}
