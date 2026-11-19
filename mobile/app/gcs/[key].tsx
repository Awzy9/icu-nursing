import { useState } from "react";
import { Stack, useLocalSearchParams } from "expo-router";
import { EYE_OPTIONS, gcsSeverity, gcsTotal, MOTOR_OPTIONS, VERBAL_OPTIONS } from "../../src/core/gcs";
import { SEVERITY_KEY } from "./index";
import { useGcsCases } from "../../src/hooks/useRemoteContent";
import { useProgressSync } from "../../src/hooks/useProgressSync";
import { useApp } from "../../src/state/app";
import { Button, Callout, Card, H1, P, RemoteGate, Screen } from "../../src/ui/components";
import { GcsPicker } from "../../src/ui/gcs-picker";

// Mirrors src/components/working/gcs-trainer.tsx's case-practice mode: three button pickers, no
// custom drawing. moduleKey "GCS" is not a real catalog entry - see mobile/src/core/news2.ts's
// comment on the exact same convention used there.
export default function GcsCaseScreen() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const { t } = useApp();
  const { recordAnswer } = useProgressSync();
  const cases = useGcsCases();
  const [eye, setEye] = useState<number | null>(null);
  const [verbal, setVerbal] = useState<number | null>(null);
  const [motor, setMotor] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const complete = eye !== null && verbal !== null && motor !== null;
  const total = complete ? gcsTotal(eye!, verbal!, motor!) : null;

  return (
    <Screen>
      <RemoteGate state={cases} onRetry={cases.refresh}>
        {(data) => {
          const found = data.find((c) => c.key === key);
          if (!found) return <P>{t("common.notFound")}</P>;
          const allCorrect = checked && eye === found.correctEye && verbal === found.correctVerbal && motor === found.correctMotor;

          function check() {
            if (!complete) return;
            setChecked(true);
            recordAnswer(found!.key, "GCS", 0, eye === found!.correctEye && verbal === found!.correctVerbal && motor === found!.correctMotor, Date.now());
          }

          return (
            <>
              <Stack.Screen options={{ title: t("gcs.title") }} />
              <H1>{t("gcs.title")}</H1>
              <Card><P>{found.vignette}</P></Card>
              <Card>
                <GcsPicker title={t("gcs.eye")} options={EYE_OPTIONS} value={eye} onChange={setEye} disabled={checked} />
                <GcsPicker title={t("gcs.verbal")} options={VERBAL_OPTIONS} value={verbal} onChange={setVerbal} disabled={checked} />
                <GcsPicker title={t("gcs.motor")} options={MOTOR_OPTIONS} value={motor} onChange={setMotor} disabled={checked} />
                <P>{complete ? t("gcs.total", { total: total!, severity: t(SEVERITY_KEY[gcsSeverity(total!)]!) }) : t("gcs.selectPrompt")}</P>
              </Card>
              {checked ? (
                <>
                  <Callout tone={allCorrect ? "success" : "danger"}>{allCorrect ? t("gcs.correctScoring") : t("gcs.reviewScoring")}</Callout>
                  <Card>
                    <P>{found.explanation}</P>
                    <P small>{t("gcs.correctAnswer", { eye: found.correctEye, verbal: found.correctVerbal, motor: found.correctMotor })}</P>
                  </Card>
                </>
              ) : (
                <>
                  <P small muted>{t("study.checkPrompt")}</P>
                  <Button label={t("gcs.check")} disabled={!complete} onPress={check} />
                </>
              )}
            </>
          );
        }}
      </RemoteGate>
    </Screen>
  );
}
