import { equipment, medications, skills } from "../../src/core/content";
import { localized } from "../../src/core/i18n";
import { H1, H2, NavCard, Screen } from "../../src/ui/components";
import { useApp } from "../../src/state/app";

export default function Library() {
  const { t, locale } = useApp();
  return (
    <Screen>
      <H1>{t("library.title")}</H1>
      <H2>{t("equipment.title")}</H2>
      {equipment.map((m) => <NavCard key={m.code} href={{ pathname: "/equipment/[code]", params: { code: m.code } }} title={localized(m.title, locale)} body={localized(m.summary, locale)} badge={t("common.sample")} />)}
      <H2>{t("skills.title")}</H2>
      {skills.map((s) => <NavCard key={s.code} href={{ pathname: "/skills/[code]", params: { code: s.code } }} title={localized(s.title, locale)} body={localized(s.summary, locale)} badge={t("common.sample")} />)}
      <H2>{t("medications.title")}</H2>
      {medications.map((m) => <NavCard key={m.code} href={{ pathname: "/medications/[code]", params: { code: m.code } }} title={localized(m.name, locale)} body={localized(m.drugClass, locale)} badge={t("common.sample")} />)}
    </Screen>
  );
}
