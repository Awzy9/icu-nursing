import { useTransfusionExercises } from "../../src/hooks/useRemoteContent";
import { useApp } from "../../src/state/app";
import { H1, NavCard, P, RemoteGate, Screen } from "../../src/ui/components";

export default function TransfusionList() {
  const { t, rtl: ar } = useApp();
  const exercises = useTransfusionExercises();

  return (
    <Screen>
      <H1>{t("transfusion.title")}</H1>
      <P muted>{t("transfusion.intro")}</P>
      <RemoteGate state={exercises} onRetry={exercises.refresh}>
        {(data) => (
          <>
            {data.map((e) => <NavCard key={e.key} href={`/transfusion/${e.key}`} title={e.title[ar ? 1 : 0]} body={e.vignette} />)}
          </>
        )}
      </RemoteGate>
    </Screen>
  );
}
