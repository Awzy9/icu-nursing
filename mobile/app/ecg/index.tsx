import { useEcgExercises } from "../../src/hooks/useRemoteContent";
import { useApp } from "../../src/state/app";
import { H1, NavCard, P, RemoteGate, Screen } from "../../src/ui/components";

export default function EcgList() {
  const { t, rtl: ar } = useApp();
  const exercises = useEcgExercises();

  return (
    <Screen>
      <H1>{t("ecg.title")}</H1>
      <P muted>{t("ecg.intro")}</P>
      <RemoteGate state={exercises} onRetry={exercises.refresh}>
        {(data) => (
          <>
            {data.map((e) => <NavCard key={e.key} href={`/ecg/${e.key}`} title={e.title[ar ? 1 : 0]} body={e.objective[ar ? 1 : 0]} />)}
          </>
        )}
      </RemoteGate>
    </Screen>
  );
}
