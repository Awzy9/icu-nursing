import { NavCard, NavGroup, H1, P, Screen, SectionLabel } from "../../src/ui/components";
import { useApp } from "../../src/state/app";

/** One discoverable home for interactive bedside-learning tools, separate from MCQ practice. */
export default function ClinicalTools() {
  const { rtl: ar, t } = useApp();
  const l = (en: string, arabic: string) => ar ? arabic : en;
  return (
    <Screen>
      <H1>{l("Clinical tools", "الأدوات السريرية")}</H1>
      <P muted>{l("Calculators, physiological simulations and structured interpretation exercises. Educational use only.", "الحاسبات والمحاكاة وتمارين التفسير المنظم، للاستخدام التعليمي فقط.")}</P>
      <SectionLabel>{l("Calculate", "احسب")}</SectionLabel>
      <NavCard href="/infusion-calculator" icon="pill" accent="medications"
        title={l("Infusion pump calculator", "حاسبة مضخة التسريب")}
        body={l("Volume rate, infusion duration and dose-to-rate examples", "معدل التسريب والمدة وحساب المعدل من الجرعة")} />
      <NavCard href="/hemo-lab" icon="heart" accent="practice" title={t("hemo.title")} body={t("hemo.intro")} />
      <SectionLabel>{l("Interpret", "فسّر")}</SectionLabel>
      <NavGroup items={[
        { href: "/abg", title: t("abg.title"), body: t("abg.intro"), icon: "flask", accent: "topics" },
        { href: "/gcs", title: t("gcs.title"), body: t("gcs.intro"), icon: "checklist", accent: "skills" },
        { href: "/news2", title: t("news2.title"), body: t("news2.intro"), icon: "checklist", accent: "skills" },
        { href: "/aline", title: t("aline.title"), body: t("aline.intro"), icon: "pulse", accent: "equipment" },
        { href: "/crrt", title: t("crrt.title"), body: t("crrt.intro"), icon: "flask", accent: "equipment" },
      ]} />
      <SectionLabel>{l("Simulate", "حاكِ")}</SectionLabel>
      <NavGroup items={[
        { href: "/vent-lab", title: t("vent.title"), body: t("vent.intro"), icon: "pulse", accent: "equipment" },
        { href: "/waveform-compare", title: l("Compare ventilator waveforms", "قارن منحنيات جهاز التنفس"), body: l("Compare two traces on the same time axis", "قارن منحنيين على المقياس الزمني نفسه"), icon: "pulse", accent: "equipment" },
        { href: "/nursing-lab", title: l("ICU shift and equipment simulation", "محاكاة المناوبة والأجهزة"), body: l("Prioritisation, medication checks and visual skills", "تحديد الأولويات وفحص الأدوية والمهارات البصرية"), icon: "heart", accent: "practice" },
      ]} />
    </Screen>
  );
}
