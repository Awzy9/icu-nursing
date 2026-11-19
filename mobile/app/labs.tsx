import { Linking } from "react-native";
import { Button, Callout, H1, NavCard, P, Screen } from "../src/ui/components";
import { useApp } from "../src/state/app";
import { siteBaseUrl } from "../src/core/remoteContent";

// The website's ventilator and hemodynamics parameter panels (/vent-lab, /hemo-lab) are live
// slider-driven simulators the app has no native screens for yet - mobile has no slider control
// dependency installed. Rather than silently omitting this learner-facing feature, this screen
// links out to the real, working website versions in the system browser. Every other lab (NEWS2,
// GCS, ECG, the waveform interpretation exercises, the arterial-line square-wave test, the
// shockable-rhythm exercises, ABG interpretation, CRRT, infusion-rate and transfusion-reaction
// exercises) is built on a simple primitive (button-pickers, a single SVG polyline chart - see
// src/ui/waveform-chart.tsx - or a plain vignette/gas-panel + MCQ) rather than bespoke canvas
// drawing or a live interactive model, so each has its own native screens (app/news2/*,
// app/gcs/*, app/ecg/*, app/waveforms/*, app/aline/*, app/defib/*, app/abg/*, app/crrt/*,
// app/infusion/*, app/transfusion/*) and is linked from here instead.
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
      <NavCard href="/abg" title={t("abg.title")} body={t("abg.intro")} />
      <NavCard href="/crrt" title={t("crrt.title")} body={t("crrt.intro")} />
      <NavCard href="/infusion" title={t("infusion.title")} body={t("infusion.intro")} />
      <NavCard href="/transfusion" title={t("transfusion.title")} body={t("transfusion.intro")} />
      <Callout tone="info">{t("labs.body")}</Callout>
      <Button label={t("labs.open")} onPress={() => Linking.openURL(`${base}/learn`)} />
      <P small muted>{base}</P>
    </Screen>
  );
}
