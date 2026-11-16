import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { Field, Input } from "@/components/ui/form";
import { requireUser } from "@/lib/auth";
import { isDemoMode } from "@/lib/env";
import { updatePasswordAction } from "../actions";

export default async function ResetPasswordPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (!isDemoMode()) await requireUser(locale, "/reset-password"); // reached via the emailed recovery link
  const t = await getTranslations("Auth");
  return (
    <AuthShell title={t("newPasswordTitle")}>
      <AuthForm action={updatePasswordAction} submitLabel={t("newPasswordButton")} successMessage={t("passwordUpdated")}>
        <Field label={t("password")} htmlFor="password" hint={t("passwordHelp")}><Input id="password" name="password" type="password" autoComplete="new-password" required minLength={12} aria-describedby="password-hint" /></Field>
        <Field label={t("confirmPassword")} htmlFor="confirmPassword"><Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required /></Field>
      </AuthForm>
    </AuthShell>
  );
}
