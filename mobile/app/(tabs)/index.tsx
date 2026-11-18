import { H1, NavCard, P, RemoteGate, Screen } from "../../src/ui/components";
import { viewedCount } from "../../src/core/progress";
import { useApp } from "../../src/state/app";
import { useCatalogList } from "../../src/hooks/useRemoteContent";

export default function LearningHub() {
  const { t, progress } = useApp();
  const list = useCatalogList();

  return (
    <Screen>
      <H1>{t("hub.title")}</H1>
      <P muted>{t("hub.intro")}</P>
      <NavCard href="/search" title={t("search.title")} body={t("search.placeholder")} />
      <RemoteGate state={list} onRetry={list.refresh}>
        {() => (
          <>
            <NavCard href="/quiz" title={t("hub.questions")} body={t("hub.questionsBody")} />
            <NavCard href="/(tabs)/practice" title={t("hub.cases")} body={t("hub.casesBody")} />
            <NavCard href={{ pathname: "/(tabs)/library", params: { type: "skills" } }} title={t("hub.skills")} body={t("hub.skillsBody")} />
            <NavCard href={{ pathname: "/(tabs)/library", params: { type: "medications" } }} title={t("hub.medications")} body={t("hub.medicationsBody")} />
            <NavCard href={{ pathname: "/(tabs)/library", params: { type: "equipment" } }} title={t("hub.equipment")} body={t("hub.equipmentBody")} />
            <NavCard href={{ pathname: "/(tabs)/library", params: { type: "topics" } }} title={t("hub.topics")} body={t("hub.topicsBody")} />
            <NavCard href="/labs" title={t("hub.labs")} body={t("hub.labsBody")} />
          </>
        )}
      </RemoteGate>
      <NavCard href="/bookmarks" title={t("hub.bookmarks")} body={t("hub.progress", { viewed: viewedCount(progress), marked: progress.bookmarks.length })} />
    </Screen>
  );
}
