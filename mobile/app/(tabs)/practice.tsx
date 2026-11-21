import { H1, NavCard, NavGroup, P, RemoteGate, Screen, SectionLabel } from "../../src/ui/components";
import { useApp } from "../../src/state/app";
import { useCatalogList } from "../../src/hooks/useRemoteContent";
import { useAccess } from "../../src/auth/useAccess";

export default function Practice() {
  const { t, progress, rtl: ar } = useApp();
  const cases = useCatalogList("cases");
  const access = useAccess();
  const label = (en: string, arabic: string) => ar ? arabic : en;
  return (
    <Screen>
      <H1>{label("Practise clinical decisions", "تدرّب على القرارات السريرية")}</H1>
      <P muted>{label("Choose questions, patient cases or visual interpretation. Check explanations after you answer.", "اختر الأسئلة أو الحالات السريرية أو تفسير الصور. راجع التوضيح بعد الإجابة.")}</P>
      <NavCard href="/nursing-lab" title={label("ICU Nursing Lab", "مختبر تمريض العناية المركزة")}
        body={label("Shift simulation, medication checks, visual skills and mistakes", "محاكاة المناوبة وفحص الأدوية والمهارات البصرية ومراجعة الأخطاء")} icon="heart" accent="practice" />
      <SectionLabel>{label("Question practice", "التدرب على الأسئلة")}</SectionLabel>
      <NavGroup items={[
        { href: "/quiz", title: t("quiz.title"), body: t("hub.questionsBody"), icon: "help", accent: "topics" },
        { href: "/exam", title: t("exam.title"), body: t("exam.intro"), icon: "clock", accent: "practice" },
        { href: "/study", title: t("study.title"), body: t("study.intro"), icon: "repeat", accent: "skills" },
      ]} />
      <SectionLabel>{label("Visual practice", "تدريب بصري")}</SectionLabel>
      <NavGroup items={[
        { href: "/ecg", title: t("ecg.title"), body: t("ecg.intro"), icon: "heart", accent: "practice" },
        { href: "/waveform-compare", title: label("Compare ventilator waveforms", "قارن منحنيات جهاز التنفس"), body: label("Pressure, flow and volume interpretation", "تفسير الضغط والتدفق والحجم"), icon: "pulse", accent: "equipment" },
        { href: "/defib", title: t("defib.title"), body: t("defib.intro"), icon: "heart", accent: "practice" },
      ]} />
      <SectionLabel>{t("type.cases")}</SectionLabel>
      <RemoteGate state={cases} onRetry={cases.refresh} empty={(items) => items.length === 0}>
        {(items) => <NavGroup items={items.map((item, index) => ({
          locked: access.lockedIndex(index),
          href: `/cases/${item.key}`,
          title: item.title,
          body: progress.cases[item.key] ? t("cases.score", { score: Math.round(progress.cases[item.key]!.scoreTenths / 10) }) : item.category,
          icon: "heart" as const, accent: "practice" as const,
        }))} />}
      </RemoteGate>
    </Screen>
  );
}
