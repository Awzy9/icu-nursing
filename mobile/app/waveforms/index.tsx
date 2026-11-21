import { useWaveformExercises } from "../../src/hooks/useRemoteContent";
import { useApp } from "../../src/state/app";
import { practiceHeading } from "../../src/core/quiz-presentation";
import { H1, NavCard, P, RemoteGate, Screen } from "../../src/ui/components";

export default function WaveformsList() {
  const { t, rtl: ar } = useApp();
  const exercises = useWaveformExercises();

  return (
    <Screen>
      <H1>{t("waveforms.title")}</H1>
      <P muted>{t("waveforms.intro")}</P>
      <RemoteGate state={exercises} onRetry={exercises.refresh}>
        {(data) => (
          <>
            {data.map((e) => <NavCard key={e.key} href={`/waveforms/${e.key}`} title={practiceHeading("waveforms", e.key, ar)} body={ar ? "اقرأ الضغط والتدفق والحجم قبل إظهار النمط." : "Read pressure, flow, and volume before revealing the pattern."} />)}
          </>
        )}
      </RemoteGate>
    </Screen>
  );
}
