import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { TextInput, View } from "react-native";
import { useAuth } from "../src/auth/provider";
import { useApp } from "../src/state/app";
import { Button, Callout, H1, P, Screen } from "../src/ui/components";
import { MIN_TARGET, space } from "../src/ui/theme";

export default function DeleteAccount() {
  const { t, palette, rtl } = useApp();
  const { manager, email } = useAuth();
  const router = useRouter();
  const [typed, setTyped] = useState(""); const [recent, setRecent] = useState<boolean | null>(null);
  const [msg, setMsg] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  useEffect(() => { void manager?.recentlyAuthenticated().then(setRecent); }, [manager, email]);
  if (!manager || !email) return <Screen><H1>{t("del.title")}</H1><Callout>{t("auth.notConfigured")}</Callout></Screen>;
  const matches = typed.trim().toLowerCase() === email.toLowerCase();
  async function go() {
    setBusy(true); setMsg(null);
    const r = await manager!.deleteAccount(typed);
    setBusy(false);
    if (r.ok) { router.replace("/"); return; }
    setMsg(r.error === "recent" ? t("del.recent") : r.error === "secondFactor" ? t("del.mfa") : r.error === "mismatch" ? t("del.err.mismatch") : r.error === "staff" ? t("del.err.staff") : t("del.err.generic"));
  }
  return (
    <Screen>
      <H1>{t("del.title")}</H1>
      <Callout tone="danger">{t("del.body")}</Callout>
      <P>{t("del.backups")}</P>
      {recent === false ? <Callout tone="warn">{t("del.recent")}</Callout> : null}
      <P>{t("del.confirmLabel")}</P>
      <View style={{ gap: space.md }}>
        <TextInput accessibilityLabel={t("del.confirmLabel")} value={typed} onChangeText={setTyped} autoCapitalize="none" keyboardType="email-address" style={{ minHeight: MIN_TARGET, borderWidth: 1.5, borderColor: palette.border, borderRadius: 10, paddingHorizontal: space.md, color: palette.text, textAlign: rtl ? "right" : "left" }} />
        {msg ? <Callout tone="warn">{msg}</Callout> : null}
        <Button label={t("del.confirmBtn")} variant="danger" onPress={() => void go()} disabled={busy || !matches || recent === false} />
      </View>
    </Screen>
  );
}
