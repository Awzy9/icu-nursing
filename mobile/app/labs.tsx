import { Linking } from "react-native";
import { Button, Callout, H1, NavCard, P, Screen } from "../src/ui/components";
import { useApp } from "../src/state/app";
import { siteBaseUrl } from "../src/core/remoteContent";

// The website's remaining labs (ABG interpretation, the interactive ventilator parameter panel
// at /vent-lab with live sliders and a simulated model, CRRT, infusion-rate and
// transfusion-reaction exercises) have not been ported to native screens yet. Rather than
// silently omitting this learner-facing feature, this screen links out to the real, working
// website versions in the system browser. NEWS2, GCS, ECG, the waveform interpretation
// exercises, the arterial-line square-wave test and the shockable-rhythm exercises are each
// built on a simple primitive (button-pickers, or a single SVG polyline chart - see
// src/ui/waveform-chart.tsx) rather than bespoke canvas drawing or a live interactive model, so
// they have their own native screens (app/news2/*, app/gcs/*, app/ecg/*, app/waveforms/*,
// app/aline/*, app/defib/*) and are linked from here instead.
export default function Labs() {
  const { t } = useApp();
  const base = siteBaseUrl(process.env as Record<string, string | undefined>);
  return (
    <Screen>
      <H1>{t("labs.title")}</H1>
      <NavCard href="/news2" title={t("news2.title")} body={t("news2.intro")} />
      <NavCard href="/gcs" title={t("gcs.title")} body={t("gcs.intro")} />
      <NavCard href="/ecg" title={t("ecg.title")} body={t("ecg.intro")} />
      <NavCard href="/waveforms" title={t("waveforms.title")} body={t("waveforms.intro")} />
      <NavCard href="/aline" title={t("aline.title")} body={t("aline.intro")} />
      <NavCard href="/defib" title={t("defib.title")} body={t("defib.intro")} />
      <Callout tone="info">{t("labs.body")}</Callout>
      <Button label={t("labs.open")} onPress={() => Linking.openURL(`${base}/learn`)} />
      <P small muted>{base}</P>
    </Screen>
  );
}
