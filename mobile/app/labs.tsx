import { NavGroup, Screen } from "../src/ui/components";
import { useApp } from "../src/state/app";

// Every lab from the website is now built as a native screen. NEWS2, GCS, ECG, the waveform
// interpretation exercises, the arterial-line square-wave test and the shockable-rhythm
// exercises are built on button-pickers or a single SVG polyline chart (src/ui/waveform-chart.tsx);
// ABG, CRRT, infusion-rate and transfusion-reaction exercises are a plain vignette/gas-panel +
// MCQ; vent-lab and hemo-lab are slider-driven simulators using the native SliderField control
// (src/ui/components.tsx) over the ported vent-model.ts/hemodynamics.ts algorithms.
export default function Labs() {
  const { t, rtl } = useApp();
  return (
    <Screen>
      <NavGroup items={[
        { href: "/infusion-calculator", title: rtl ? "حاسبة مضخة التسريب" : "Infusion pump calculator", body: rtl ? "حساب المعدل والمدة والجرعة" : "Interactive mL/h, duration and dose calculations", icon: "pill", accent: "medications" },
        { href: "/news2", title: t("news2.title"), body: t("news2.intro"), icon: "checklist", accent: "skills" },
        { href: "/gcs", title: t("gcs.title"), body: t("gcs.intro"), icon: "checklist", accent: "skills" },
        { href: "/ecg", title: t("ecg.title"), body: t("ecg.intro"), icon: "pulse", accent: "equipment" },
        { href: "/waveforms", title: t("waveforms.title"), body: t("waveforms.intro"), icon: "pulse", accent: "equipment" },
        { href: "/aline", title: t("aline.title"), body: t("aline.intro"), icon: "pulse", accent: "equipment" },
        { href: "/defib", title: t("defib.title"), body: t("defib.intro"), icon: "heart", accent: "practice" },
        { href: "/abg", title: t("abg.title"), body: t("abg.intro"), icon: "flask", accent: "topics" },
        { href: "/crrt", title: t("crrt.title"), body: t("crrt.intro"), icon: "flask", accent: "topics" },
        { href: "/infusion", title: t("infusion.title"), body: t("infusion.intro"), icon: "pill", accent: "medications" },
        { href: "/transfusion", title: t("transfusion.title"), body: t("transfusion.intro"), icon: "heart", accent: "practice" },
        { href: "/vent-lab", title: t("vent.title"), body: t("vent.intro"), icon: "pulse", accent: "equipment" },
        { href: "/hemo-lab", title: t("hemo.title"), body: t("hemo.intro"), icon: "pulse", accent: "equipment" },
      ]} />
    </Screen>
  );
}
