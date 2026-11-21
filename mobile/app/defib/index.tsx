import { useDefibExercises } from "../../src/hooks/useRemoteContent";
import { useApp } from "../../src/state/app";
import { practiceHeading } from "../../src/core/quiz-presentation";
import { H1, NavCard, P, RemoteGate, Screen } from "../../src/ui/components";

export default function DefibList() {
  const { t, rtl: ar } = useApp();
  const exercises = useDefibExercises();

  return (
    <Screen>
      <H1>{t("defib.title")}</H1>
      <P muted>{t("defib.intro")}</P>
      <RemoteGate state={exercises} onRetry={exercises.refresh}>
        {(data) => (
          <>
            {data.map((e) => <NavCard key={e.key} href={`/defib/${e.key}`} title={practiceHeading("defib", e.key, ar)} body={ar ? "حدد إن كان النظم قابلاً للصدمات قبل إظهار التشخيص." : "Decide whether the rhythm is shockable before revealing the diagnosis."} />)}
          </>
        )}
      </RemoteGate>
    </Screen>
  );
}
