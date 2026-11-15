import { cases } from "../../src/core/content";
import { localized } from "../../src/core/i18n";
import { H1, H2, NavCard, P, Screen } from "../../src/ui/components";
import { useApp } from "../../src/state/app";

export default function Practice() {
  const { t, locale, progress } = useApp();
  return (
    <Screen>
      <H1>{t("practice.title")}</H1>
      <NavCard href="/quiz" title={t("quiz.title")} body={t("hub.questionsBody")} badge={t("common.sample")} />
      <H2>{t("cases.title")}</H2>
      {cases.map((c) => (
        <NavCard key={c.code} href={{ pathname: "/cases/[code]", params: { code: c.code } }} title={localized(c.title, locale)} body={progress.cases[c.code] ? t("cases.score", { score: Math.round(progress.cases[c.code]!.scoreTenths / 10) }) : undefined} badge={t("common.sample")} />
      ))}
      {cases.length === 0 ? <P>{t("common.notFound")}</P> : null}
    </Screen>
  );
}
