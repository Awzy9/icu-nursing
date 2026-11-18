import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../src/auth/provider";
import { AppProvider, useApp } from "../src/state/app";

function Shell() {
  const { palette, t, themeMode } = useApp();
  return (
    <>
      <StatusBar style={palette.bg === "#ffffff" ? "dark" : "light"} key={themeMode + palette.bg} />
      <Stack screenOptions={{ headerStyle: { backgroundColor: palette.bg }, headerTintColor: palette.text, contentStyle: { backgroundColor: palette.bg }, headerBackTitle: t("common.back") }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="signin" options={{ title: t("auth.signIn") }} />
        <Stack.Screen name="delete-account" options={{ title: t("del.title") }} />
        <Stack.Screen name="quiz" options={{ title: t("quiz.title") }} />
        <Stack.Screen name="quiz/[key]" options={{ title: t("quiz.title") }} />
        <Stack.Screen name="bookmarks" options={{ title: t("bookmarks.title") }} />
        <Stack.Screen name="labs" options={{ title: t("labs.title") }} />
        <Stack.Screen name="prototype" options={{ title: t("prototype.title"), headerShown: true }} />
        <Stack.Screen name="topics/[key]" options={{ title: t("topic.title") }} />
        <Stack.Screen name="equipment/[code]" options={{ title: t("equipment.title") }} />
        <Stack.Screen name="skills/[code]" options={{ title: t("skills.title") }} />
        <Stack.Screen name="medications/[code]" options={{ title: t("medications.title") }} />
        <Stack.Screen name="cases/[code]" options={{ title: t("cases.title") }} />
      </Stack>
    </>
  );
}
export default function RootLayout() { return <AppProvider><AuthProvider><Shell /></AuthProvider></AppProvider>; }
