import { H1, H2, NavCard, RemoteGate, Screen } from "../../src/ui/components";
import { useApp } from "../../src/state/app";
import { useCatalogList } from "../../src/hooks/useRemoteContent";

export default function Practice() {
  const { t, progress } = useApp();
  const cases = useCatalogList("cases");
  return (
    <Screen banner={false}>
      <H1>{t("practice.title")}</H1>
      <NavCard href="/quiz" title={t("quiz.title")} body={t("hub.questionsBody")} />
      <NavCard href="/labs" title={t("hub.labs")} body={t("hub.labsBody")} />
      <NavCard href="/study" title={t("study.title")} />
      <NavCard href="/exam" title={t("exam.title")} />
      <H2>{t("cases.title")}</H2>
      <RemoteGate state={cases} onRetry={cases.refresh} empty={(items) => items.length === 0}>
        {(items) => items.map((c) => (
          <NavCard key={c.key} href={`/cases/${c.key}`} title={c.title} body={progress.cases[c.key] ? t("cases.score", { score: Math.round(progress.cases[c.key]!.scoreTenths / 10) }) : undefined} />
        ))}
      </RemoteGate>
    </Screen>
  );
}
