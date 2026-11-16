import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthForm } from "@/components/auth/auth-form";
import { Field, Input, Select } from "@/components/ui/form";
import { Callout } from "@/components/ui/feedback";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth";
import { isDemoMode } from "@/lib/env";
import { LEVELS } from "@/lib/content/types";
import { createClient } from "@/lib/supabase/server";
import { updateProfileAction } from "../(auth)/actions";

export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Account");
  const auth = await getTranslations("Auth");
  const lib = await getTranslations("Library");
  if (isDemoMode()) return <Callout tone="warning">{auth("errors.demoUnavailable")}</Callout>;
  const user = await requireUser(locale, "/account");
  const supabase = await createClient();
  const { data: p } = await supabase!.from("profiles").select("display_name, country, experience_level, preferred_locale").eq("id", user.id).single();
  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <p className="text-sm text-muted-foreground">{user.email}</p>
      <AuthForm action={updateProfileAction} submitLabel={t("save")} successMessage={t("saved")}>
        <Field label={auth("displayName")} htmlFor="displayName"><Input id="displayName" name="displayName" defaultValue={p?.display_name ?? ""} required maxLength={80} /></Field>
        <Field label={auth("experience")} htmlFor="experience">
          <Select id="experience" name="experience" defaultValue={p?.experience_level ?? ""}>
            <option value="">—</option>
            {LEVELS.map((l) => <option key={l} value={l}>{lib(`levels.${l}`)}</option>)}
          </Select>
        </Field>
        <Field label={auth("country")} htmlFor="country"><Input id="country" name="country" defaultValue={p?.country ?? ""} maxLength={2} /></Field>
        <Field label={t("language")} htmlFor="locale">
          <Select id="locale" name="locale" defaultValue={p?.preferred_locale === "ar" ? "ar" : "en"}>
            <option value="en">English</option>
            <option value="ar">العربية</option>
          </Select>
        </Field>
      </AuthForm>
      <p className="border-t border-border pt-4 text-sm"><Link href="/account/delete">{t("deleteLink")}</Link></p>
    </div>
  );
}
