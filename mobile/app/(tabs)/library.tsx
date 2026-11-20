import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { TextInput, View } from "react-native";
import { Chip, H1, NavCard, P, RemoteGate, Screen } from "../../src/ui/components";
import { space } from "../../src/ui/theme";
import { useApp } from "../../src/state/app";
import { useCatalogList } from "../../src/hooks/useRemoteContent";

const TYPES = ["topics", "skills", "medications", "equipment", "cases"] as const;
const ROUTE: Record<string, string> = { topics: "/topics/", skills: "/skills/", medications: "/medications/", equipment: "/equipment/", cases: "/cases/" };

export default function Library() {
  const { t, rtl, locale, palette } = useApp();
  const params = useLocalSearchParams<{ type?: string }>();
  const [type, setType] = useState<string>(TYPES.includes(params.type as (typeof TYPES)[number]) ? params.type! : "topics");
  const [query, setQuery] = useState("");
  const ar = locale === "ar";
  const searchLabel = ar ? "ابحث في هذه الفئة" : "Search this category";
  useEffect(() => {
    if (TYPES.includes(params.type as (typeof TYPES)[number])) {
      setType(params.type!);
      setQuery("");
    }
  }, [params.type]);
  const list = useCatalogList(type);

  return (
    <Screen banner={false}>
      <H1>{t("library.title")}</H1>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
          {TYPES.map((candidate) => <Chip key={candidate} label={t(`type.${candidate}`)} selected={type === candidate} onPress={() => { setType(candidate); setQuery(""); }} />)}
      </View>
      <TextInput value={query} onChangeText={setQuery} accessibilityLabel={searchLabel}
        placeholder={searchLabel} placeholderTextColor={palette.muted} returnKeyType="search"
        style={{ minHeight: 48, paddingHorizontal: 14, fontSize: 16, color: palette.text, textAlign: rtl ? "right" : "left",
          backgroundColor: palette.surface, borderColor: palette.border, borderWidth: 1, borderRadius: 12 }} />
      <RemoteGate state={list} onRetry={list.refresh} empty={(items) => items.length === 0}>
        {(items) => {
          const term = query.trim().toLocaleLowerCase();
          const results = items.filter(({ title, category }) => `${title} ${category}`.toLocaleLowerCase().includes(term));
          return results.length ? results.map((entry) => (
          <NavCard key={entry.key} href={`${ROUTE[type]}${entry.key}`} title={entry.title} body={entry.category} />
          )) : <P muted>{ar ? "لا توجد نتائج مطابقة." : "No matching items."}</P>;
        }}
      </RemoteGate>
    </Screen>
  );
}
