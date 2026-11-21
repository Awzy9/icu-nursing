import { Link } from "expo-router";
import { Linking, Text, View } from "react-native";
import { Button, Callout, Card, Chip, H1, P, Screen, SectionLabel } from "../../src/ui/components";
import { Icon } from "../../src/ui/icons";
import { space, type } from "../../src/ui/theme";
import { useApp } from "../../src/state/app";
import { useAuth } from "../../src/auth/provider";
import { siteBaseUrl } from "../../src/core/remoteContent";
import { NavCard } from "../../src/ui/components";

export default function Account() {
  const { t, locale, setLocale, themeMode, setThemeMode, palette, rtl, progress } = useApp();
  const { config, manager, email, notice, clearNotice } = useAuth();
  const base = siteBaseUrl(process.env as Record<string, string | undefined>);
  return (
    <Screen>
      <H1>{t("account.title")}</H1>
      <SectionLabel>{t("tab.account")}</SectionLabel>
      {notice ? <Callout tone="warn">{t("auth.callbackFailed")}</Callout> : null}
      {config ? (email ? (
        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
            <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: palette.tint, alignItems: "center", justifyContent: "center" }}>
              <Text style={[type.h2, { color: palette.primary }]}>{email.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}><P>{t("auth.signedInAs", { email })}</P></View>
          </View>
          <P muted>{t("auth.accountIntro")}</P>
          <P>{rtl ? "الدروس المكتملة" : "Completed lessons"}: {progress.completed.length} · {rtl ? "المحفوظات" : "Bookmarks"}: {progress.bookmarks.length}</P>
          <NavCard href="/study" title={t("study.title")} body={rtl ? "تابع المراجعة وتقدمك" : "Review your learning progress"} icon="repeat" accent="study" />
          <Button label={t("auth.signOut")} variant="outline" onPress={() => { clearNotice(); void manager?.signOut(); }} />
        </Card>
      ) : (
        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
            <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: palette.tint, alignItems: "center", justifyContent: "center" }}><Icon name="user" color={palette.primary} size={26} /></View>
            <View style={{ flex: 1 }}><P muted>{t("account.privacyBody")}</P></View>
          </View>
          <P muted>{t("auth.accountIntro")}</P>
          <Link href="/signin" asChild><Button label={t("auth.signIn")} onPress={() => undefined} /></Link>
          <Link href="/signup" asChild><Button label={t("auth.signUp")} variant="outline" onPress={() => undefined} /></Link>
        </Card>
      )) : (
        <Card>
          <Callout tone="warn">{t("auth.accountMissing")}</Callout>
          <Button label={t("auth.openWebsite")} onPress={() => { void Linking.openURL(`${base}/${locale}/register`); }} />
          <P muted small>{t("auth.guest")}</P>
        </Card>
      )}

      <SectionLabel>{rtl ? "المساعدة والبدء" : "Help & getting started"}</SectionLabel>
      <NavCard href="/onboarding" title={rtl ? "إعادة جولة التعريف بالتطبيق" : "Replay the app tutorial"}
        body={rtl ? "شرح مبسط للأقسام الرئيسية والأدوات وكيفية بدء التعلم" : "Quickly revisit Learn, Practice, Clinical Tools and Visuals"}
        icon="help" accent="study" />

      <SectionLabel>{t("account.language")}</SectionLabel>
      <Card>
        <View style={{ flexDirection: "row", gap: space.sm, flexWrap: "wrap" }}>
          <Chip label="English" selected={locale === "en"} onPress={() => setLocale("en")} />
          <Chip label="العربية" selected={locale === "ar"} onPress={() => setLocale("ar")} />
        </View>
      </Card>

      <SectionLabel>{t("account.theme")}</SectionLabel>
      <Card>
        <View style={{ flexDirection: "row", gap: space.sm, flexWrap: "wrap" }}>
          <Chip label={t("account.themeSystem")} selected={themeMode === "system"} onPress={() => setThemeMode("system")} />
          <Chip label={t("account.themeLight")} selected={themeMode === "light"} onPress={() => setThemeMode("light")} />
          <Chip label={t("account.themeDark")} selected={themeMode === "dark"} onPress={() => setThemeMode("dark")} />
        </View>
      </Card>

      <SectionLabel>{t("account.privacy")}</SectionLabel>
      <Card>
        <P muted>{t("account.privacyBody")}</P>
        <Button label={t("account.privacyLink")} variant="outline" onPress={() => Linking.openURL(`${base}/privacy`)} />
      </Card>

      <SectionLabel>{t("account.deletionInfo")}</SectionLabel>
      <Card>
        <P muted>{t("account.deletionBody")}</P>
        {!config ? <Callout>{t("auth.accountMissing")}</Callout> : email ? (
          <Link href="/delete-account" asChild><Button label={t("del.open")} variant="danger" onPress={() => undefined} /></Link>
        ) : (
          <>
            <P muted small>{t("account.deletionSignIn")}</P>
            <Link href="/signin" asChild><Button label={t("auth.signIn")} variant="outline" onPress={() => undefined} /></Link>
          </>
        )}
      </Card>
    </Screen>
  );
}
