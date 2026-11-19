import { useRouter } from "expo-router";
import React, { useState } from "react";
import { TextInput, View } from "react-native";
import { CaptchaView } from "../src/auth/CaptchaView";
import { useAuth } from "../src/auth/provider";
import { useApp } from "../src/state/app";
import { Button, Callout, H1, P, Screen } from "../src/ui/components";
import { MIN_TARGET, space } from "../src/ui/theme";

export default function SignIn() {
  const { t, locale, palette, rtl } = useApp();
  const { config, manager } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [token, setToken] = useState<string | null>(null); const [captchaKey, setCaptchaKey] = useState(0);
  const [msg, setMsg] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  const input = { minHeight: MIN_TARGET, borderWidth: 1.5, borderColor: palette.border, borderRadius: 10, paddingHorizontal: space.md, color: palette.text, backgroundColor: palette.surface, textAlign: rtl ? "right" : "left" } as const;

  if (!config || !manager) return <Screen><H1>{t("auth.signIn")}</H1><Callout>{t("auth.notConfigured")}</Callout></Screen>;
  const freshCaptcha = () => { setToken(null); setCaptchaKey((k) => k + 1); }; // tokens are single use
  async function submit() {
    if (!token) { setMsg(t("auth.err.input")); return; }
    setBusy(true);
    const r = await manager!.signIn(email, password, token);
    setBusy(false);
    if (r.ok) { setPassword(""); router.back(); return; }
    freshCaptcha(); setMsg(t(`auth.err.${r.error}`));
  }
  async function reset() {
    if (!token) { setMsg(t("auth.err.input")); return; }
    setBusy(true);
    await manager!.requestPasswordReset(email, token, "nursingmastery://auth/callback");
    setBusy(false); freshCaptcha(); setMsg(t("auth.resetSent"));
  }
  return (
    <Screen>
      <H1>{t("auth.signIn")}</H1>
      <View style={{ gap: space.md }}>
        <P>{t("auth.email")}</P>
        <TextInput accessibilityLabel={t("auth.email")} value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" style={input} />
        <P>{t("auth.password")}</P>
        <TextInput accessibilityLabel={t("auth.password")} value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoComplete="current-password" textContentType="password" style={input} />
        <P muted small>{token ? "✓ " + t("auth.captcha") : t("auth.captchaWait")}</P>
        <CaptchaView key={captchaKey} siteOrigin={config.siteOrigin} locale={locale} onToken={setToken} onError={() => setMsg(t("auth.captchaFail"))} />
        {msg ? <Callout tone="warn">{msg}</Callout> : null}
        <Button label={t("auth.signIn")} onPress={() => void submit()} disabled={busy || !token} />
        <Button label={t("auth.forgot")} variant="outline" onPress={() => void reset()} disabled={busy || !token || !email} />
      </View>
    </Screen>
  );
}
