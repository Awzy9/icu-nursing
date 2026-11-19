import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../src/auth/provider";
import { useProgressPullOnSignIn } from "../src/hooks/useProgressSync";
import { AppProvider, useApp } from "../src/state/app";

function Shell() {
  const { palette, t, themeMode } = useApp();
  useProgressPullOnSignIn();
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
        <Stack.Screen name="search" options={{ title: t("search.title") }} />
        <Stack.Screen name="exam/index" options={{ title: t("exam.title") }} />
        <Stack.Screen name="exam/[id]/index" options={{ title: t("exam.title"), headerBackVisible: false }} />
        <Stack.Screen name="exam/[id]/results" options={{ title: t("exam.complete") }} />
        <Stack.Screen name="paths/index" options={{ title: t("paths.title") }} />
        <Stack.Screen name="paths/[key]" options={{ title: t("paths.title") }} />
        <Stack.Screen name="study" options={{ title: t("study.title") }} />
        <Stack.Screen name="news2/index" options={{ title: t("news2.title") }} />
        <Stack.Screen name="news2/[key]" options={{ title: t("news2.title") }} />
        <Stack.Screen name="gcs/index" options={{ title: t("gcs.title") }} />
        <Stack.Screen name="gcs/[key]" options={{ title: t("gcs.title") }} />
        <Stack.Screen name="ecg/index" options={{ title: t("ecg.title") }} />
        <Stack.Screen name="ecg/[key]" options={{ title: t("ecg.title") }} />
        <Stack.Screen name="waveforms/index" options={{ title: t("waveforms.title") }} />
        <Stack.Screen name="waveforms/[key]" options={{ title: t("waveforms.title") }} />
        <Stack.Screen name="aline/index" options={{ title: t("aline.title") }} />
        <Stack.Screen name="aline/[key]" options={{ title: t("aline.title") }} />
        <Stack.Screen name="defib/index" options={{ title: t("defib.title") }} />
        <Stack.Screen name="defib/[key]" options={{ title: t("defib.title") }} />
        <Stack.Screen name="labs" options={{ title: t("labs.title") }} />
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
