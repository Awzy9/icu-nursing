import { Linking } from "react-native";
import { Button, Callout, H1, NavCard, P, Screen } from "../src/ui/components";
import { useApp } from "../src/state/app";
import { siteBaseUrl } from "../src/core/remoteContent";

// The website's remaining bespoke interactive visual labs (ABG interpretation, the ventilator
// and hemodynamics parameter panels, CRRT, arterial-line, infusion-rate practice,
// transfusion-reaction and shockable-rhythm exercises) have not been ported to native screens
// yet. Rather than silently omitting this learner-facing feature, this screen links out to the
// real, working website versions in the system browser. NEWS2, GCS and ECG are each built on a
// simple primitive (button-pickers, or a single SVG polyline chart - see
// src/ui/waveform-chart.tsx) rather than bespoke canvas drawing, so they have their own native
// screens (app/news2/*, app/gcs/*, app/ecg/*) and are linked from here instead.
export default function Labs() {
  const { t } = useApp();
  const base = siteBaseUrl(process.env as Record<string, string | undefined>);
  return (
    <Screen>
      <H1>{t("labs.title")}</H1>
      <NavCard href="/news2" title={t("news2.title")} body={t("news2.intro")} />
      <NavCard href="/gcs" title={t("gcs.title")} body={t("gcs.intro")} />
      <NavCard href="/ecg" title={t("ecg.title")} body={t("ecg.intro")} />
      <Callout tone="info">{t("labs.body")}</Callout>
      <Button label={t("labs.open")} onPress={() => Linking.openURL(`${base}/learn`)} />
      <P small muted>{base}</P>
    </Screen>
  );
}
