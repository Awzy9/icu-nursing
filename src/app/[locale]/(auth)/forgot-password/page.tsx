import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { Field, Input } from "@/components/ui/form";
import { requestPasswordResetAction } from "../actions";

export default async function ForgotPasswordPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Auth");
  return (
    <AuthShell title={t("resetTitle")}>
      <p className="text-muted-foreground">{t("resetBody")}</p>
      <AuthForm action={requestPasswordResetAction} submitLabel={t("resetButton")} successMessage={t("resetSent")}>
        <Field label={t("email")} htmlFor="email"><Input id="email" name="email" type="email" autoComplete="email" required /></Field>
      </AuthForm>
    </AuthShell>
  );
}
