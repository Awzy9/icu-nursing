import { useState } from "react";
import { EYE_OPTIONS, gcsSeverity, gcsTotal, MOTOR_OPTIONS, VERBAL_OPTIONS } from "../../src/core/gcs";
import { useGcsCases } from "../../src/hooks/useRemoteContent";
import { useApp } from "../../src/state/app";
import { Card, H1, H2, NavCard, P, RemoteGate, Screen } from "../../src/ui/components";
import { GcsPicker } from "../../src/ui/gcs-picker";

export const SEVERITY_KEY: Record<string, string> = { severe: "gcs.severitySevere", moderate: "gcs.severityModerate", mild: "gcs.severityMild" };

export default function GcsIndex() {
  const { t } = useApp();
  const cases = useGcsCases();
  const [eye, setEye] = useState<number | null>(null);
  const [verbal, setVerbal] = useState<number | null>(null);
  const [motor, setMotor] = useState<number | null>(null);
  const complete = eye !== null && verbal !== null && motor !== null;
  const total = complete ? gcsTotal(eye!, verbal!, motor!) : null;

  return (
    <Screen>
      <H1>{t("gcs.title")}</H1>
      <P muted>{t("gcs.intro")}</P>
      <Card>
        <GcsPicker title={t("gcs.eye")} options={EYE_OPTIONS} value={eye} onChange={setEye} />
        <GcsPicker title={t("gcs.verbal")} options={VERBAL_OPTIONS} value={verbal} onChange={setVerbal} />
        <GcsPicker title={t("gcs.motor")} options={MOTOR_OPTIONS} value={motor} onChange={setMotor} />
        <P>{complete ? t("gcs.total", { total: total!, severity: t(SEVERITY_KEY[gcsSeverity(total!)]!) }) : t("gcs.selectPrompt")}</P>
      </Card>
      <H2>{t("gcs.practiceTitle")}</H2>
      <RemoteGate state={cases} onRetry={cases.refresh}>
        {(data) => (
          <>
            {data.map((c) => <NavCard key={c.key} href={`/gcs/${c.key}`} title={c.key} body={c.vignette} />)}
          </>
        )}
      </RemoteGate>
    </Screen>
  );
}
