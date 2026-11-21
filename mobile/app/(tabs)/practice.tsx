import { NavCard, NavGroup, RemoteGate, Screen, SectionLabel } from "../../src/ui/components";
import { useApp } from "../../src/state/app";
import { useCatalogList } from "../../src/hooks/useRemoteContent";

export default function Practice() {
  const { t, progress, rtl } = useApp();
  const cases = useCatalogList("cases");
  return (
    <Screen>
      <NavCard href="/nursing-lab" title={rtl ? "مختبر التمريض التفاعلي" : "Interactive Nursing Lab"} body={rtl ? "القرارات السريرية، فحص الأدوية والمهارات البصرية" : "Shift decisions, medication safety, visual skills and mistake review"} icon="heart" accent="practice" />
      <NavCard href="/infusion-calculator" title={rtl ? "حاسبة مضخة التسريب" : "Infusion pump calculator"} body={rtl ? "حساب المعدل والمدة والجرعة للتدريب" : "Calculate mL/h, duration and dose-based rates"} icon="pill" accent="medications" />
      <NavCard href="/vent-lab" title={t("vent.title")} body={t("vent.intro")} icon="pulse" accent="equipment" />
      <NavCard href="/hemo-lab" title={t("hemo.title")} body={t("hemo.intro")} icon="heart" accent="practice" />
      <NavCard href="/quiz" title={t("quiz.title")} body={t("hub.questionsBody")} icon="help" accent="topics" />
      <NavCard href="/labs" title={t("hub.labs")} body={t("hub.labsBody")} icon="flask" accent="equipment" />
      <SectionLabel>{t("type.cases")}</SectionLabel>
      <RemoteGate state={cases} onRetry={cases.refresh} empty={(items) => items.length === 0}>
        {(items) => (
          <NavGroup items={items.map((c) => ({ href: `/cases/${c.key}`, title: c.title, body: progress.cases[c.key] ? t("cases.score", { score: Math.round(progress.cases[c.key]!.scoreTenths / 10) }) : undefined, icon: "heart" as const, accent: "practice" as const }))} />
        )}
      </RemoteGate>
    </Screen>
  );
}
