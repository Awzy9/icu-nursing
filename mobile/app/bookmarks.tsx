import type { Href } from "expo-router";
import { H1, NavCard, P, RemoteGate, Screen } from "../src/ui/components";
import { useApp } from "../src/state/app";
import { useCatalogList } from "../src/hooks/useRemoteContent";

const ROUTE: Record<string, string> = { topics: "/topics/", skills: "/skills/", medications: "/medications/", equipment: "/equipment/", cases: "/cases/", practice: "/labs" };

export default function Bookmarks() {
  const { t, progress } = useApp();
  const all = useCatalogList();

  return (
    <Screen>
      <H1>{t("bookmarks.title")}</H1>
      {progress.bookmarks.length === 0 ? <P>{t("bookmarks.empty")}</P> : (
        <RemoteGate state={all} onRetry={all.refresh}>
          {(entries) => {
            const items = progress.bookmarks.flatMap((bk): { key: string; title: string; href: Href }[] => {
              const [kind, code] = bk.split(":") as [string, string];
              const entry = entries.find((e) => e.key === code);
              const route = ROUTE[kind];
              return entry && route ? [{ key: bk, title: entry.title, href: `${route}${code}` }] : [];
            });
            return items.length === 0 ? <P>{t("bookmarks.empty")}</P> : items.map((i) => <NavCard key={i.key} href={i.href} title={i.title} />);
          }}
        </RemoteGate>
      )}
    </Screen>
  );
}
