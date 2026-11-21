import { NavGroup, RemoteGate, Screen, SectionLabel } from "../../src/ui/components";
import { useApp } from "../../src/state/app";
import { useCatalogList } from "../../src/hooks/useRemoteContent";

export default function Practice() {
  const { t, progress } = useApp();
  const cases = useCatalogList("cases");
  return (
    <Screen>
      <NavGroup items={[
        { href: "/quiz", title: t("quiz.title"), body: t("hub.questionsBody") },
        { href: "/labs", title: t("hub.labs"), body: t("hub.labsBody") },
      ]} />
      <SectionLabel>{t("type.cases")}</SectionLabel>
      <RemoteGate state={cases} onRetry={cases.refresh} empty={(items) => items.length === 0}>
        {(items) => (
          <NavGroup items={items.map((c) => ({ href: `/cases/${c.key}`, title: c.title, body: progress.cases[c.key] ? t("cases.score", { score: Math.round(progress.cases[c.key]!.scoreTenths / 10) }) : undefined }))} />
        )}
      </RemoteGate>
    </Screen>
  );
}
