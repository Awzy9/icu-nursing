import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { NavGroup, SearchBar, SectionLabel, StatTile, Screen } from "../../src/ui/components";
import { Icon, IconTile } from "../../src/ui/icons";
import { viewedCount } from "../../src/core/progress";
import { ROUTE_FOR_TYPE } from "../../src/core/search";
import { radii, space, type } from "../../src/ui/theme";
import { useApp } from "../../src/state/app";
import { useCatalogList } from "../../src/hooks/useRemoteContent";

const LIBRARY_TILES = [
  { type: "topics", icon: "book" },
  { type: "skills", icon: "checklist" },
  { type: "medications", icon: "pill" },
  { type: "equipment", icon: "pulse" },
] as const;

/** The big card at the top: picks up the last lesson opened, or invites a first-time learner onto a guided path. */
function Hero({ caption, title, onPress }: { caption: string; title: string; onPress: () => void }) {
  const { palette, rtl, t } = useApp();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${caption}. ${title}`}
      style={({ pressed }) => ({ backgroundColor: palette.primary, borderRadius: radii.xl, padding: space.xl, gap: space.md, opacity: pressed ? 0.9 : 1 })}>
      <Text style={[type.caption, { color: palette.onPrimary, opacity: 0.85, textTransform: "uppercase", writingDirection: rtl ? "rtl" : "ltr" }]}>{caption}</Text>
      <Text numberOfLines={3} style={[type.h2, { color: palette.onPrimary, writingDirection: rtl ? "rtl" : "ltr" }]}>{title}</Text>
      <View style={{ flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: space.sm, backgroundColor: palette.onPrimary, borderRadius: radii.pill, paddingVertical: space.sm, paddingHorizontal: space.lg, minHeight: 44 }}>
        <Text style={[type.h3, { color: palette.primary }]}>{t("hub.continue")}</Text>
        <Icon name="chevron" color={palette.primary} size={18} mirror={rtl} />
      </View>
    </Pressable>
  );
}

export default function LearningHub() {
  const { t, progress, rtl, palette } = useApp();
  const router = useRouter();
  const list = useCatalogList();
  const count = (type: string): number | "loading" | undefined =>
    list.status === "ready" ? list.data.filter((i) => i.type === type).length : list.status === "loading" ? "loading" : undefined;
  const lastKey = progress.viewed[progress.viewed.length - 1];
  const last = list.status === "ready" && lastKey ? list.data.find((i) => i.key === lastKey) : undefined;
  const lastRoute = last ? ROUTE_FOR_TYPE[last.type] : undefined;

  return (
    <Screen>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
        <IconTile name="heart" accent="study" size={48} />
        <View style={{ flex: 1 }}>
          <Text accessibilityRole="header" style={[type.h2, { color: palette.text, writingDirection: rtl ? "rtl" : "ltr" }]}>{t("app.name")}</Text>
          <Text style={[type.small, { color: palette.muted, writingDirection: rtl ? "rtl" : "ltr" }]}>{t("hub.tagline")}</Text>
        </View>
      </View>

      {last && lastRoute
        ? <Hero caption={t("hub.heroContinue")} title={last.title} onPress={() => router.push(`${lastRoute}${last.key}` as never)} />
        : <Hero caption={t("hub.heroStart")} title={t("hub.heroStartBody")} onPress={() => router.push("/paths")} />}

      <SearchBar label={t("search.title")} hint={t("search.placeholder")} />

      <SectionLabel>{t("hub.sectionLibrary")}</SectionLabel>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.md }}>
        {LIBRARY_TILES.map(({ type: kind, icon }) => (
          <StatTile key={kind} href={{ pathname: "/(tabs)/library", params: { type: kind } }} count={count(kind)} label={t(`type.${kind}`)} icon={icon} accent={kind} />
        ))}
      </View>

      <SectionLabel>{t("hub.sectionStudy")}</SectionLabel>
      <NavGroup items={[
        { href: "/paths", title: t("paths.title"), body: t("paths.intro"), icon: "route", accent: "study" },
        { href: "/quiz", title: t("hub.questions"), body: t("hub.questionsBody"), icon: "help", accent: "topics" },
        { href: "/study", title: t("study.title"), body: t("study.intro"), icon: "repeat", accent: "skills" },
        { href: "/exam", title: t("exam.title"), body: t("exam.intro"), icon: "clock", accent: "practice" },
      ]} />

      <SectionLabel>{t("hub.sectionPractice")}</SectionLabel>
      <NavGroup items={[
        { href: "/nursing-lab", title: rtl ? "مختبر التمريض" : "Interactive Nursing Lab", body: rtl ? "محاكاة المناوبة ومراجعة الأخطاء" : "Shift simulator and visual learning", icon: "heart", accent: "practice" },
        { href: "/infusion-calculator", title: rtl ? "حاسبة مضخة التسريب" : "Infusion pump calculator", body: rtl ? "معدل التسريب والمدة وحساب الجرعة" : "Rate, duration and weight-based dosage math", icon: "pill", accent: "medications" },
        { href: "/vent-lab", title: t("vent.title"), body: t("vent.intro"), icon: "pulse", accent: "equipment" },
        { href: "/hemo-lab", title: t("hemo.title"), body: t("hemo.intro"), icon: "heart", accent: "practice" },
        { href: "/(tabs)/practice", title: t("hub.cases"), body: t("hub.casesBody"), icon: "heart", accent: "practice" },
        { href: "/labs", title: t("hub.labs"), body: t("hub.labsBody"), icon: "flask", accent: "equipment" },
      ]} />

      <NavGroup items={[{ href: "/bookmarks", title: t("hub.bookmarks"), body: t("hub.progress", { viewed: viewedCount(progress), marked: progress.bookmarks.length }), icon: "bookmark", accent: "study" }]} />
    </Screen>
  );
}
