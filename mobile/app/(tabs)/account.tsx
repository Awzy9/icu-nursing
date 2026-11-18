import { Link } from "expo-router";
import { View } from "react-native";
import { Button, Callout, Card, Chip, H1, H2, P, Screen } from "../../src/ui/components";
import { useApp } from "../../src/state/app";
import { useAuth } from "../../src/auth/provider";

export default function Account() {
  const { t, locale, setLocale, themeMode, setThemeMode } = useApp();
  const { config, manager, email, notice, clearNotice } = useAuth();
  return (
    <Screen>
      <H1>{t("account.title")}</H1>
      {notice ? <Callout tone="warn">{t("auth.callbackFailed")}</Callout> : null}
      {config ? (email ? (
        <Card><P>{t("auth.signedInAs", { email })}</P>
          <Button label={t("auth.signOut")} variant="outline" onPress={() => { clearNotice(); void manager?.signOut(); }} />
          <Link href="/delete-account" asChild><Button label={t("del.open")} variant="danger" onPress={() => undefined} /></Link></Card>
      ) : <Link href="/signin" asChild><Button label={t("auth.signIn")} onPress={() => undefined} /></Link>) : null}
      <H2>{t("account.language")}</H2>
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        <Chip label="English" selected={locale === "en"} onPress={() => setLocale("en")} />
        <Chip label="العربية" selected={locale === "ar"} onPress={() => setLocale("ar")} />
      </View>
      <H2>{t("account.theme")}</H2>
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        <Chip label={t("account.themeSystem")} selected={themeMode === "system"} onPress={() => setThemeMode("system")} />
        <Chip label={t("account.themeLight")} selected={themeMode === "light"} onPress={() => setThemeMode("light")} />
        <Chip label={t("account.themeDark")} selected={themeMode === "dark"} onPress={() => setThemeMode("dark")} />
      </View>
      <H2>{t("account.privacy")}</H2>
      <Card><P>{t("account.privacyBody")}</P></Card>
      <H2>{t("account.deletionInfo")}</H2>
      <Card><P>{t("account.deletionBody")}</P>{config ? null : <Callout>{t("account.signInSoon")}</Callout>}</Card>
    </Screen>
  );
}
