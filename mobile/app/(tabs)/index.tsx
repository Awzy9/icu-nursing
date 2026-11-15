import { H1, NavCard, P, Screen } from "../../src/ui/components";
import { equipment } from "../../src/core/content";
import { viewedCount } from "../../src/core/progress";
import { useApp } from "../../src/state/app";

export default function LearningHub() {
  const { t, progress } = useApp();
  const total = equipment.reduce((n, m) => n + m.diagram.parts.length, 0);
  return (
    <Screen>
      <H1>{t("hub.title")}</H1>
      <P muted>{t("hub.intro")}</P>
      <NavCard href="/quiz" title={t("hub.questions")} body={t("hub.questionsBody")} badge={t("common.sample")} />
      <NavCard href="/cases/SYN-CASE-001" title={t("hub.cases")} body={t("hub.casesBody")} badge={t("common.sample")} />
      <NavCard href="/skills/SYN-SKILL-001" title={t("hub.skills")} body={t("hub.skillsBody")} badge={t("common.sample")} />
      <NavCard href="/medications/SYN-MED-001" title={t("hub.medications")} body={t("hub.medicationsBody")} badge={t("common.sample")} />
      <NavCard href="/equipment/SYN-EQ-001" title={t("hub.equipment")} body={t("hub.equipmentBody")} badge={t("common.sample")} />
      <NavCard href="/bookmarks" title={t("hub.bookmarks")} body={t("hub.progress", { viewed: viewedCount(progress), total, marked: progress.bookmarks.length })} />
    </Screen>
  );
}
