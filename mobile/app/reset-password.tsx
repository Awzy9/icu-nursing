import { useRouter } from "expo-router";
import { useState } from "react";
import { TextInput, View } from "react-native";
import { useAuth } from "../src/auth/provider";
import { useApp } from "../src/state/app";
import { Button, Callout, H1, P, Screen } from "../src/ui/components";
import { MIN_TARGET, space } from "../src/ui/theme";

export default function ResetPassword() {
  const { t, palette, rtl } = useApp();
  const { manager, recoveryReady, clearRecovery } = useAuth();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = { minHeight: MIN_TARGET, borderWidth: 1.5, borderColor: palette.border, borderRadius: 10, paddingHorizontal: space.md, color: palette.text, backgroundColor: palette.surface, textAlign: rtl ? "right" : "left" } as const;
  async function submit() {
    if (!manager || !recoveryReady || busy) return;
    if (password !== confirm) { setError(t("auth.passwordMismatch")); return; }
    setError(null); setBusy(true);
    try {
      const result = await manager.updatePassword(password);
      if (!result.ok) { setError(t(`auth.err.${result.error}`)); return; }
      setPassword(""); setConfirm(""); clearRecovery();
      router.replace("/(tabs)/account");
    } catch { setError(t("auth.err.network")); }
    finally { setBusy(false); }
  }
  return (
    <Screen>
      <H1>{t("auth.recoveryTitle")}</H1>
      {!recoveryReady ? <Callout tone="warn">{t("auth.callbackFailed")}</Callout> :
      <View style={{ gap: space.md }}>
        <P muted>{t("auth.passwordRules")}</P>
        <P>{t("auth.newPassword")}</P>
        <TextInput accessibilityLabel={t("auth.newPassword")} autoCapitalize="none" autoComplete="new-password" textContentType="newPassword" secureTextEntry value={password} onChangeText={setPassword} style={input} />
        <P>{t("auth.confirmPassword")}</P>
        <TextInput accessibilityLabel={t("auth.confirmPassword")} autoCapitalize="none" secureTextEntry value={confirm} onChangeText={setConfirm} style={input} />
        {error ? <Callout tone="warn">{error}</Callout> : null}
        <Button label={t("auth.recoveryTitle")} disabled={busy || password.length < 12 || password !== confirm} onPress={() => void submit()} />
      </View>}
      <Button variant="outline" label={t("tab.account")} onPress={() => router.replace("/(tabs)/account")} />
    </Screen>
  );
}
