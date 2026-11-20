import { H1, NavCard, Screen } from "../src/ui/components";
import { useApp } from "../src/state/app";

// Every lab from the website is now built as a native screen. NEWS2, GCS, ECG, the waveform
// interpretation exercises, the arterial-line square-wave test and the shockable-rhythm
// exercises are built on button-pickers or a single SVG polyline chart (src/ui/waveform-chart.tsx);
// ABG, CRRT, infusion-rate and transfusion-reaction exercises are a plain vignette/gas-panel +
// MCQ; vent-lab and hemo-lab are slider-driven simulators using the native SliderField control
// (src/ui/components.tsx) over the ported vent-model.ts/hemodynamics.ts algorithms.
export default function Labs() {
  const { t, locale } = useApp();
  return (
    <Screen>
      <H1>{t("labs.title")}</H1>
      <NavCard href="/nursing-lab" title={locale === "ar" ? "مختبر التمريض" : "Nursing lab"} />
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
      <NavCard href="/vent-lab" title={t("vent.title")} body={t("vent.intro")} />
      <NavCard href="/hemo-lab" title={t("hemo.title")} body={t("hemo.intro")} />
    </Screen>
  );
}
