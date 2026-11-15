import { equipment, findCase, findEquipment, findMedication, findSkill } from "../src/core/content";
import { localized } from "../src/core/i18n";
import { H1, NavCard, P, Screen } from "../src/ui/components";
import { useApp } from "../src/state/app";
import type { Href } from "expo-router";

export default function Bookmarks() {
  const { t, locale, progress } = useApp();
  const items = progress.bookmarks.flatMap((key): { key: string; title: string; href: Href }[] => {
    const [kind, code] = key.split(":") as [string, string];
    if (kind === "equipment") { const x = findEquipment(code); return x ? [{ key, title: localized(x.title, locale), href: { pathname: "/equipment/[code]", params: { code } } }] : []; }
    if (kind === "skill") { const x = findSkill(code); return x ? [{ key, title: localized(x.title, locale), href: { pathname: "/skills/[code]", params: { code } } }] : []; }
    if (kind === "medication") { const x = findMedication(code); return x ? [{ key, title: localized(x.name, locale), href: { pathname: "/medications/[code]", params: { code } } }] : []; }
    const x = findCase(code); return x ? [{ key, title: localized(x.title, locale), href: { pathname: "/cases/[code]", params: { code } } }] : [];
  });
  void equipment;
  return (
    <Screen>
      <H1>{t("bookmarks.title")}</H1>
      {items.length === 0 ? <P>{t("bookmarks.empty")}</P> : items.map((i) => <NavCard key={i.key} href={i.href} title={i.title} badge={t("common.sample")} />)}
    </Screen>
  );
}
