import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import { NavGroup, SearchBar, SectionLabel, Screen } from "../../src/ui/components";
import { Icon, IconTile, type IconName } from "../../src/ui/icons";
import { useApp } from "../../src/state/app";
import { useCatalogList } from "../../src/hooks/useRemoteContent";
import { ROUTE_FOR_TYPE } from "../../src/core/search";
import { shouldAutoStartOnboarding } from "../../src/core/onboarding";
import { radii, space, type, type AccentKey } from "../../src/ui/theme";

function Destination({ href, title, subtitle, icon, accent }: {
  href: Href; title: string; subtitle: string; icon: IconName; accent: AccentKey;
}) {
  const { palette, rtl } = useApp();
  const router = useRouter();
  return (
    <Pressable accessibilityRole="link" accessibilityLabel={title} accessibilityHint={subtitle} onPress={() => router.push(href)}
      style={({ pressed }) => ({
        flexBasis: "47%", flexGrow: 1, minHeight: 132, backgroundColor: palette.surface,
        borderColor: palette.hairline, borderWidth: 1, borderRadius: radii.lg,
        padding: space.md, gap: space.sm, opacity: pressed ? 0.85 : 1,
      })}>
      <IconTile name={icon} accent={accent} size={43} />
      <Text style={[type.h3, { color: palette.text, writingDirection: rtl ? "rtl" : "ltr" }]}>{title}</Text>
      <Text style={[type.small, { color: palette.muted, writingDirection: rtl ? "rtl" : "ltr" }]}>{subtitle}</Text>
    </Pressable>
  );
}

export default function LearningHub() {
  const { t, progress, rtl: ar, palette, ready, onboardingSeen } = useApp();
  const router = useRouter();
  useEffect(() => {
    if (shouldAutoStartOnboarding(ready, onboardingSeen, progress)) router.replace("/onboarding");
  }, [ready, onboardingSeen, progress, router]);
  const catalog = useCatalogList();
  const lastKey = progress.viewed[progress.viewed.length - 1];
  const last = catalog.status === "ready" && lastKey ? catalog.data.find((item) => item.key === lastKey) : undefined;
  const lastRoute = last ? ROUTE_FOR_TYPE[last.type] : undefined;
  const next = last && lastRoute ? (`${lastRoute}${last.key}` as Href) : "/paths";
  const title = last?.title ?? t("hub.heroStartBody");
  const label = (en: string, arabic: string) => ar ? arabic : en;

  return (
    <Screen>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
        <IconTile name="heart" accent="study" size={48} />
        <View style={{ flex: 1 }}>
          <Text accessibilityRole="header" style={[type.h2, { color: palette.text, writingDirection: ar ? "rtl" : "ltr" }]}>{t("app.name")}</Text>
          <Text style={[type.small, { color: palette.muted, writingDirection: ar ? "rtl" : "ltr" }]}>{t("hub.tagline")}</Text>
        </View>
      </View>

      <Pressable accessibilityRole="link" accessibilityLabel={`${t("hub.continue")}: ${title}`} onPress={() => router.push(next)}
        style={({ pressed }) => ({ backgroundColor: palette.primary, borderRadius: radii.xl, padding: space.xl, gap: space.md, opacity: pressed ? 0.86 : 1 })}>
        <Text style={[type.caption, { color: palette.onPrimary, opacity: 0.9 }]}>{last ? t("hub.heroContinue") : t("hub.heroStart")}</Text>
        <Text numberOfLines={3} style={[type.h2, { color: palette.onPrimary }]}>{title}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
          <Text style={[type.h3, { color: palette.onPrimary }]}>{t("hub.continue")}</Text>
          <Icon name="chevron" color={palette.onPrimary} size={19} mirror={ar} />
        </View>
      </Pressable>

      <SearchBar label={t("search.title")} hint={t("search.placeholder")} />
      <SectionLabel>{label("Explore", "استكشف")}</SectionLabel>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
        <Destination href="/(tabs)/library" icon="book" accent="topics"
          title={label("Learn", "تعلّم")} subtitle={label("Topics, skills and medications", "المواضيع والمهارات والأدوية")} />
        <Destination href="/(tabs)/practice" icon="checklist" accent="practice"
          title={label("Practice", "تدرّب")} subtitle={label("Questions, cases and exams", "الأسئلة والحالات والاختبارات")} />
        <Destination href="/(tabs)/tools" icon="flask" accent="equipment"
          title={label("Clinical tools", "الأدوات السريرية")} subtitle={label("Calculators and simulators", "الحاسبات والمحاكاة")} />
        <Destination href="/(tabs)/visuals" icon="pulse" accent="study"
          title={label("Visual library", "المكتبة البصرية")} subtitle={label("Equipment, imaging and waveforms", "الأجهزة والصور والمنحنيات")} />
      </View>

      <SectionLabel>{label("Your learning", "تقدّمك")}</SectionLabel>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
        {[
          [progress.viewed.length, label("Opened", "مفتوح")],
          [progress.completed.length, label("Completed", "مكتمل")],
          [progress.bookmarks.length, label("Bookmarked", "محفوظ")],
        ].map(([number, heading]) => (
          <View key={String(heading)} style={{ minWidth: "29%", flexGrow: 1, borderWidth: 1, borderColor: palette.hairline, borderRadius: radii.md, backgroundColor: palette.surface, padding: space.md, gap: 3 }}>
            <Text style={[type.h2, { color: palette.primary, fontVariant: ["tabular-nums"] }]}>{number}</Text>
            <Text style={[type.small, { color: palette.muted }]}>{heading}</Text>
          </View>
        ))}
      </View>

      <SectionLabel>{label("Keep learning", "واصل التعلم")}</SectionLabel>
      <NavGroup items={[
        { href: "/onboarding", title: ar ? "جولة سريعة في التطبيق" : "New here? Take the app tour", body: ar ? "تعرّف على الأقسام في خطوات قصيرة" : "Find Learn, Practice, Tools and Visuals in a few steps", icon: "help", accent: "study" },
        { href: "/paths", title: t("paths.title"), body: t("paths.intro"), icon: "route", accent: "study" },
        { href: "/study", title: t("study.title"), body: t("study.intro"), icon: "repeat", accent: "skills" },
        { href: "/bookmarks", title: t("hub.bookmarks"), body: label("Saved lessons and activities", "الدروس والأنشطة المحفوظة"), icon: "bookmark", accent: "study" },
      ]} />
    </Screen>
  );
}
