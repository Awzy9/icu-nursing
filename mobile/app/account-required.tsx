import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";
import { safeNext } from "../src/core/access";
import { useApp } from "../src/state/app";
import { Button, H1, P, Screen } from "../src/ui/components";
import { Icon } from "../src/ui/icons";
import { space } from "../src/ui/theme";

/** Shown instead of a locked item: explains the guest limit and offers sign-up or sign-in, returning to the item afterwards. */
export default function AccountRequired() {
  const { t, palette } = useApp();
  const router = useRouter();
  const params = useLocalSearchParams<{ next?: string }>();
  const next = safeNext(params.next);
  const signInHref = next ? `/signin?next=${encodeURIComponent(next)}` : "/signin";
  return (
    <Screen>
      <View style={{ alignItems: "center", gap: space.md, paddingTop: space.xl }}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: palette.tint, alignItems: "center", justifyContent: "center" }}>
          <Icon name="lock" color={palette.primary} size={34} />
        </View>
        <H1>{t("gate.title")}</H1>
      </View>
      <P muted>{t("gate.body")}</P>
      <Button label={t("auth.signUp")} onPress={() => router.replace("/signup")} />
      <Button label={t("auth.signIn")} variant="outline" onPress={() => router.replace(signInHref as never)} />
      <Button label={t("gate.back")} variant="outline" onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)/home"))} />
    </Screen>
  );
}
