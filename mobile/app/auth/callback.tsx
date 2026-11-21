import { useRouter } from "expo-router";
import { ActivityIndicator } from "react-native";
import { useAuth } from "../../src/auth/provider";
import { useApp } from "../../src/state/app";
import { Button, Callout, H1, P, Screen } from "../../src/ui/components";

export default function AuthCallback() {
  const { t, palette } = useApp();
  const { email, recoveryReady, callbackPending, notice } = useAuth();
  const router = useRouter();
  return (
    <Screen>
      <H1>{recoveryReady ? t("auth.recoveryTitle") : t("tab.account")}</H1>
      {callbackPending ? <><ActivityIndicator color={palette.primary} /><P muted>{t("auth.processingLink")}</P></> :
       notice ? <Callout tone="warn">{t("auth.callbackFailed")}</Callout> :
       email ? <Callout>{t("auth.verificationDone")}</Callout> :
       <P muted>{t("auth.processingLink")}</P>}
      {recoveryReady ? <Button label={t("auth.recoveryTitle")} onPress={() => router.replace("/reset-password")} /> : null}
      <Button variant="outline" label={t("tab.account")} onPress={() => router.replace("/(tabs)/account")} />
      {!email && !recoveryReady ? <Button label={t("auth.signIn")} onPress={() => router.replace("/signin")} /> : null}
    </Screen>
  );
}
