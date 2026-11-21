import { useRouter } from "expo-router";
import React, { useState } from "react";
import { TextInput, View } from "react-native";
import { CaptchaView } from "../src/auth/CaptchaView";
import { CAPTCHA_REQUIRED } from "../src/auth/config";
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

  if (!config || !manager) return <Screen><H1>{t("auth.signIn")}</H1><Callout tone="warn">{t("auth.accountMissing")}</Callout><Button label={t("tab.account")} variant="outline" onPress={() => router.replace("/(tabs)/account")} /></Screen>;
  const freshCaptcha = () => { setToken(null); setCaptchaKey((k) => k + 1); }; // tokens are single use
  const waitingForCaptcha = CAPTCHA_REQUIRED && !token;
  async function submit() {
    if (waitingForCaptcha || busy) { if (!busy) setMsg(t("auth.err.input")); return; }
    setBusy(true); setMsg(null);
    try {
      const r = await manager!.signIn(email, password, token ?? undefined);
      if (r.ok) { setPassword(""); router.replace("/(tabs)/account"); return; }
      freshCaptcha(); setMsg(t(`auth.err.${r.error}`));
    } catch { freshCaptcha(); setMsg(t("auth.err.network")); }
    finally { setBusy(false); }
  }
  async function reset() {
    if (waitingForCaptcha || busy) { if (!busy) setMsg(t("auth.err.input")); return; }
    setBusy(true); setMsg(null);
    try {
      const result = await manager!.requestPasswordReset(email, token ?? undefined, "nursingmastery://auth/callback?type=recovery");
      setMsg(t(result.ok ? "auth.resetSent" : "auth.err.generic"));
    } catch { setMsg(t("auth.err.network")); }
    finally { setBusy(false); freshCaptcha(); }
  }
  return (
    <Screen>
      <H1>{t("auth.signIn")}</H1>
      <View style={{ gap: space.md }}>
        <P>{t("auth.email")}</P>
        <TextInput accessibilityLabel={t("auth.email")} value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" style={input} />
        <P>{t("auth.password")}</P>
        <TextInput accessibilityLabel={t("auth.password")} value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoComplete="current-password" textContentType="password" style={input} />
        {CAPTCHA_REQUIRED ? <P muted small>{token ? "✓ " + t("auth.captcha") : t("auth.captchaWait")}</P> : null}
        {CAPTCHA_REQUIRED ? <CaptchaView key={captchaKey} siteOrigin={config.siteOrigin} locale={locale} onToken={setToken} onError={() => setMsg(t("auth.captchaFail"))} /> : null}
        {msg ? <Callout tone="warn">{msg}</Callout> : null}
        <Button label={t("auth.signIn")} onPress={() => void submit()} disabled={busy || waitingForCaptcha} />
        <Button label={t("auth.forgot")} variant="outline" onPress={() => void reset()} disabled={busy || waitingForCaptcha || !email} />
        <Button label={t("auth.newAccount")} variant="outline" onPress={() => router.push("/signup")} />
      </View>
    </Screen>
  );
}
