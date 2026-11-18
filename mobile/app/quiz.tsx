import { H1, NavCard, P, RemoteGate, Screen } from "../src/ui/components";
import { useApp } from "../src/state/app";
import { useCatalogList } from "../src/hooks/useRemoteContent";

export default function QuizModules() {
  const { t } = useApp();
  const modules = useCatalogList("questions");
  return (
    <Screen>
      <H1>{t("quiz.title")}</H1>
      <P muted>{t("hub.questionsBody")}</P>
      <RemoteGate state={modules} onRetry={modules.refresh} empty={(items) => items.length === 0}>
        {(items) => items.map((m) => <NavCard key={m.key} href={`/quiz/${m.key}`} title={m.title} body={`${m.questionCount} questions`} />)}
      </RemoteGate>
    </Screen>
  );
}
