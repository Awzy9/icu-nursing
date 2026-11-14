import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { Field, Input, Select } from "@/components/ui/form";
import { Link } from "@/i18n/navigation";
import { LEVELS } from "@/lib/content/types";
import { signUpAction } from "../actions";

export default async function RegisterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Auth");
  const lib = await getTranslations("Library");
  return (
    <AuthShell title={t("registerTitle")}>
      <AuthForm action={signUpAction} submitLabel={t("signUpButton")}>
        <Field label={t("displayName")} htmlFor="displayName"><Input id="displayName" name="displayName" autoComplete="name" required maxLength={80} /></Field>
        <Field label={t("email")} htmlFor="email"><Input id="email" name="email" type="email" autoComplete="email" required /></Field>
        <Field label={t("password")} htmlFor="password" hint={t("passwordHelp")}><Input id="password" name="password" type="password" autoComplete="new-password" required minLength={12} aria-describedby="password-hint" /></Field>
        <Field label={t("confirmPassword")} htmlFor="confirmPassword"><Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required /></Field>
        <Field label={t("experience")} htmlFor="experience" hint={t("experienceHelp")}>
          <Select id="experience" name="experience" defaultValue="" aria-describedby="experience-hint">
            <option value="">—</option>
            {LEVELS.map((l) => <option key={l} value={l}>{lib(`levels.${l}`)}</option>)}
          </Select>
        </Field>
        <Field label={t("country")} htmlFor="country"><Input id="country" name="country" autoComplete="country" maxLength={2} placeholder="SA, GB, US…" /></Field>
      </AuthForm>
      <p className="text-sm text-muted-foreground">{t("haveAccount")} <Link href="/login">{t("signInButton")}</Link></p>
    </AuthShell>
  );
}
