import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Linking, TextInput, View } from "react-native";
import { CaptchaView } from "../src/auth/CaptchaView";
import { AUTH_SCHEME, CAPTCHA_REQUIRED } from "../src/auth/config";
import { useAuth } from "../src/auth/provider";
import { useApp } from "../src/state/app";
import { Button, Callout, H1, P, Screen } from "../src/ui/components";
import { MIN_TARGET, space } from "../src/ui/theme";

export default function SignUp() {
  const { t, locale, palette, rtl } = useApp();
  const { config, manager } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [captchaKey, setCaptchaKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState(false);
  const [confirmationRequired, setConfirmationRequired] = useState(true);
  const [busy, setBusy] = useState(false);
  const input = { minHeight: MIN_TARGET, borderWidth: 1.5, borderColor: palette.border, borderRadius: 10, paddingHorizontal: space.md, color: palette.text, backgroundColor: palette.surface, textAlign: rtl ? "right" : "left" } as const;
  const refreshCaptcha = () => { setToken(null); setCaptchaKey((k) => k + 1); };

  async function submit() {
    if (!manager || !config || busy) return;
    setError(null);
    if (!displayName.trim() || !email.includes("@") || password.length < 12 || password.length > 128 || (CAPTCHA_REQUIRED && !token)) { setError(t("auth.err.input")); return; }
    if (password !== confirmPassword) { setError(t("auth.passwordMismatch")); return; }
    setBusy(true);
    try {
      const response = await manager.signUp({ displayName, email, password, locale, captchaToken: token ?? undefined, redirectTo: `${AUTH_SCHEME}://auth/callback` });
      if (response.ok) {
        setPassword(""); setConfirmPassword(""); setConfirmationRequired(response.confirmationRequired);
        setCreated(true);
      } else {
        setError(t(`auth.err.${response.error}`)); refreshCaptcha();
      }
    } catch {
      setError(t("auth.err.network")); refreshCaptcha();
    } finally { setBusy(false); }
  }

  if (!config || !manager) return (
    <Screen>
      <H1>{t("auth.signUp")}</H1>
      <Callout tone="warn">{t("auth.accountMissing")}</Callout>
      <Button label={t("auth.openWebsite")} onPress={() => { void Linking.openURL(`https://icu-nursing.vercel.app/${locale}/register`); }} />
      <Button label={t("auth.guest")} variant="outline" onPress={() => router.replace("/(tabs)/home")} />
    </Screen>
  );

  if (created) return (
    <Screen>
      <H1>{t("auth.signUp")}</H1>
      <Callout>{confirmationRequired ? t("auth.checkEmail") : t("auth.verificationDone")}</Callout>
      <Button label={t("auth.signIn")} onPress={() => router.replace("/signin")} />
      <Button label={t("tab.account")} variant="outline" onPress={() => router.replace("/(tabs)/account")} />
    </Screen>
  );

  return (
    <Screen>
      <H1>{t("auth.signUp")}</H1>
      <P muted>{t("auth.accountIntro")}</P>
      <View style={{ gap: space.md }}>
        <P>{t("auth.displayName")}</P>
        <TextInput accessibilityLabel={t("auth.displayName")} value={displayName} onChangeText={setDisplayName} autoComplete="name" textContentType="name" style={input} maxLength={80} />
        <P>{t("auth.email")}</P>
        <TextInput accessibilityLabel={t("auth.email")} value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" style={input} maxLength={254} />
        <P>{t("auth.password")}</P>
        <TextInput accessibilityLabel={t("auth.password")} value={password} onChangeText={setPassword} autoCapitalize="none" autoComplete="new-password" textContentType="newPassword" secureTextEntry style={input} />
        <P muted small>{t("auth.passwordRules")}</P>
        <P>{t("auth.confirmPassword")}</P>
        <TextInput accessibilityLabel={t("auth.confirmPassword")} value={confirmPassword} onChangeText={setConfirmPassword} autoCapitalize="none" autoComplete="new-password" textContentType="newPassword" secureTextEntry style={input} />
        {CAPTCHA_REQUIRED ? <P muted small>{token ? "✓ " + t("auth.captcha") : t("auth.captchaWait")}</P> : null}
        {CAPTCHA_REQUIRED ? <CaptchaView key={captchaKey} siteOrigin={config.siteOrigin} locale={locale} onToken={setToken} onError={() => setError(t("auth.captchaFail"))} /> : null}
        {error ? <Callout tone="warn">{error}</Callout> : null}
        <Button label={t("auth.signUp")} disabled={busy || (CAPTCHA_REQUIRED && !token)} onPress={() => void submit()} />
        <Button label={t("auth.alreadyAccount")} variant="outline" onPress={() => router.replace("/signin")} />
        <Button label={t("auth.guest")} variant="outline" onPress={() => router.replace("/(tabs)/home")} />
      </View>
    </Screen>
  );
}
