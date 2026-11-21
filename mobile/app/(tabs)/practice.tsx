import { NavCard, NavGroup, RemoteGate, Screen, SectionLabel } from "../../src/ui/components";
import { useApp } from "../../src/state/app";
import { useCatalogList } from "../../src/hooks/useRemoteContent";

export default function Practice() {
  const { t, progress } = useApp();
  const cases = useCatalogList("cases");
  return (
    <Screen>
      <NavCard href="/quiz" title={t("quiz.title")} body={t("hub.questionsBody")} icon="help" accent="topics" />
      <NavCard href="/labs" title={t("hub.labs")} body={t("hub.labsBody")} icon="flask" accent="equipment" />
      <SectionLabel>{t("type.cases")}</SectionLabel>
      <RemoteGate state={cases} onRetry={cases.refresh} empty={(items) => items.length === 0}>
        {(items) => (
          <NavGroup items={items.map((c) => ({ href: `/cases/${c.key}`, title: c.title, body: progress.cases[c.key] ? t("cases.score", { score: Math.round(progress.cases[c.key]!.scoreTenths / 10) }) : undefined, icon: "heart" as const, accent: "practice" as const }))} />
        )}
      </RemoteGate>
    </Screen>
  );
}
