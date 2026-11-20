import { Link, type Href } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { H1, H2, NavCard, P, Screen } from "../../src/ui/components";
import { useApp } from "../../src/state/app";

export default function LearningHub() {
  const { locale, palette, t } = useApp();
  const ar = locale === "ar";
  const library = { pathname: "/(tabs)/library", params: { type: "topics" } } as const;
  const shortcuts: { href: Href; title: string }[] = [
    { href: library, title: t("tab.library") },
    { href: "/quiz", title: t("hub.questions") },
    { href: "/labs", title: t("hub.labs") },
    { href: "/bookmarks", title: ar ? "المحفوظات" : "Saved items" },
  ];

  return (
    <Screen banner={false}>
      <H1>Nursing Mastery</H1>
      <P muted>{ar ? "تعلّم تمريض العناية المركّزة وتدرّب عليه." : "Learn and practise critical care nursing."}</P>
      <NavCard href="/search" title={t("search.title")} body={t("search.placeholder")} />
      <Link href="/paths" asChild>
        <Pressable accessibilityRole="link" style={({ pressed }) => [
          styles.feature, { backgroundColor: palette.primary, opacity: pressed ? 0.88 : 1 },
        ]}>
          <Text style={[styles.featureTitle, { color: palette.onPrimary }]}>
            {ar ? "ابدأ مسارًا تعليميًا" : "Start a guided path"}
          </Text>
          <Text style={[styles.featureBody, { color: palette.onPrimary }]}>
            {ar ? "تابع الدروس والتمارين خطوة بخطوة." : "Follow a sequence of ICU lessons and exercises."}
          </Text>
        </Pressable>
      </Link>
      <H2>{ar ? "تصفّح" : "Explore"}</H2>
      <View style={styles.grid}>
        {shortcuts.map(({ href, title }) => (
          <Link key={title} href={href} asChild>
            <Pressable accessibilityRole="link" style={({ pressed }) => [
              styles.tile, { backgroundColor: palette.surface, borderColor: palette.border, opacity: pressed ? 0.82 : 1 },
            ]}>
              <Text style={[styles.tileTitle, { color: palette.text }]}>{title}</Text>
            </Pressable>
          </Link>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  feature: { borderRadius: 18, padding: 22, gap: 8 },
  featureTitle: { fontSize: 24, fontWeight: "700" },
  featureBody: { fontSize: 16, lineHeight: 23 },
  grid: { flexDirection: "row", flexWrap: "wrap", columnGap: 12, rowGap: 12 },
  tile: { flexBasis: "45%", flexGrow: 1, borderRadius: 14, borderWidth: 1, minHeight: 70, padding: 14, justifyContent: "center" },
  tileTitle: { fontSize: 17, fontWeight: "600" },
});
