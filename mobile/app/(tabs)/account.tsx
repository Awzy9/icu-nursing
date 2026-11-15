import { Link } from "expo-router";
import { View } from "react-native";
import { Button, Callout, Card, Chip, H1, H2, P, Screen } from "../../src/ui/components";
import { useApp } from "../../src/state/app";

export default function Account() {
  const { t, locale, setLocale, themeMode, setThemeMode } = useApp();
  return (
    <Screen>
      <H1>{t("account.title")}</H1>
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
      <Card><P>{t("account.deletionBody")}</P><Callout>{t("account.signInSoon")}</Callout></Card>
      <Link href="/prototype" asChild><Button label={t("prototype.title")} variant="outline" onPress={() => undefined} /></Link>
    </Screen>
  );
}
