import { useMemo, useState } from "react";
import { TextInput } from "react-native";
import { groupByType, ROUTE_FOR_TYPE, searchCatalog } from "../src/core/search";
import { H1, H2, NavCard, P, RemoteGate, Screen } from "../src/ui/components";
import { useApp } from "../src/state/app";
import { useCatalogList } from "../src/hooks/useRemoteContent";
import { MIN_TARGET, space } from "../src/ui/theme";

export default function Search() {
  const { t, rtl, palette } = useApp();
  const [query, setQuery] = useState("");
  const catalog = useCatalogList();
  const input = { minHeight: MIN_TARGET, borderWidth: 1.5, borderColor: palette.border, borderRadius: 10, paddingHorizontal: space.md, color: palette.text, backgroundColor: palette.surface, textAlign: rtl ? ("right" as const) : ("left" as const) };

  return (
    <Screen>
      <H1>{t("search.title")}</H1>
      <TextInput accessibilityLabel={t("search.title")} placeholder={t("search.placeholder")} placeholderTextColor={palette.muted} value={query} onChangeText={setQuery} autoCapitalize="none" autoCorrect={false} style={input} />
      <RemoteGate state={catalog} onRetry={catalog.refresh}>
        {(items) => <Results items={searchCatalog(items, query)} query={query} />}
      </RemoteGate>
    </Screen>
  );
}

function Results({ items, query }: { items: ReturnType<typeof searchCatalog>; query: string }) {
  const { t } = useApp();
  const groups = useMemo(() => groupByType(items), [items]);
  const cleaned = query.trim();

  if (cleaned.length < 2) return <P muted>{cleaned.length === 0 ? "" : t("search.tooShort")}</P>;
  if (items.length === 0) return <P muted>{t("search.empty", { q: cleaned })}</P>;

  return (
    <>
      <P small muted>{t("search.count", { n: items.length, q: cleaned })}</P>
      {[...groups.entries()].map(([type, group]) => (
        <SearchGroup key={type} type={type} items={group} />
      ))}
    </>
  );
}

function SearchGroup({ type, items }: { type: string; items: ReturnType<typeof searchCatalog> }) {
  const { t } = useApp();
  const route = ROUTE_FOR_TYPE[type];
  if (!route) return null;
  return (
    <>
      <H2>{t(`type.${type}`)}</H2>
      {items.map((e) => <NavCard key={e.key} href={`${route}${e.key}`} title={e.title} body={e.category} />)}
    </>
  );
}
