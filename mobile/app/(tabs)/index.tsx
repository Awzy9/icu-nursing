import { View } from "react-native";
import { NavGroup, SearchBar, SectionLabel, StatTile, Screen } from "../../src/ui/components";
import { viewedCount } from "../../src/core/progress";
import { space } from "../../src/ui/theme";
import { useApp } from "../../src/state/app";
import { useCatalogList } from "../../src/hooks/useRemoteContent";

const LIBRARY_TILES = ["topics", "skills", "medications", "equipment"] as const;

export default function LearningHub() {
  const { t, progress } = useApp();
  const list = useCatalogList();
  const count = (type: string): number | "loading" | undefined =>
    list.status === "ready" ? list.data.filter((i) => i.type === type).length : list.status === "loading" ? "loading" : undefined;

  return (
    <Screen>
      <SearchBar label={t("search.title")} hint={t("search.placeholder")} />

      <SectionLabel>{t("hub.sectionLibrary")}</SectionLabel>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.md }}>
        {LIBRARY_TILES.map((type) => (
          <StatTile key={type} href={{ pathname: "/(tabs)/library", params: { type } }} count={count(type)} label={t(`type.${type}`)} />
        ))}
      </View>

      <SectionLabel>{t("hub.sectionStudy")}</SectionLabel>
      <NavGroup items={[
        { href: "/paths", title: t("paths.title"), body: t("paths.intro") },
        { href: "/quiz", title: t("hub.questions"), body: t("hub.questionsBody") },
        { href: "/study", title: t("study.title"), body: t("study.intro") },
        { href: "/exam", title: t("exam.title"), body: t("exam.intro") },
      ]} />

      <SectionLabel>{t("hub.sectionPractice")}</SectionLabel>
      <NavGroup items={[
        { href: "/(tabs)/practice", title: t("hub.cases"), body: t("hub.casesBody") },
        { href: "/labs", title: t("hub.labs"), body: t("hub.labsBody") },
      ]} />

      <NavGroup items={[{ href: "/bookmarks", title: t("hub.bookmarks"), body: t("hub.progress", { viewed: viewedCount(progress), marked: progress.bookmarks.length }) }]} />
    </Screen>
  );
}
