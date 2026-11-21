import { useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { ScrollView, View } from "react-native";
import { Chip, NavGroup, RemoteGate, Screen } from "../../src/ui/components";
import { accentForType, space } from "../../src/ui/theme";
import type { IconName } from "../../src/ui/icons";
import { useApp } from "../../src/state/app";
import { useCatalogList } from "../../src/hooks/useRemoteContent";

const TYPES = ["topics", "skills", "medications", "equipment", "cases", "practice"] as const;
const ICON: Record<string, IconName> = { topics: "book", skills: "checklist", medications: "pill", equipment: "pulse", cases: "heart", practice: "checklist" };
const ROUTE: Record<string, string> = { topics: "/topics/", skills: "/skills/", medications: "/medications/", equipment: "/equipment/", cases: "/cases/", practice: "/practice-activity/" };

export default function Library() {
  const { t, rtl } = useApp();
  const params = useLocalSearchParams<{ type?: string }>();
  const [type, setType] = useState<string>(TYPES.includes(params.type as (typeof TYPES)[number]) ? params.type! : "topics");
  const list = useCatalogList(type);

  return (
    <Screen>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ direction: rtl ? "rtl" : "ltr" }}>
        <View style={{ flexDirection: "row", gap: space.sm }}>
          {TYPES.map((candidate) => <Chip key={candidate} label={t(`type.${candidate}`)} selected={type === candidate} onPress={() => setType(candidate)} />)}
        </View>
      </ScrollView>
      <RemoteGate state={list} onRetry={list.refresh} empty={(items) => items.length === 0}>
        {(items) => <NavGroup items={items.map((entry) => ({ href: `${ROUTE[type]}${entry.key}`, title: entry.title, body: entry.category, icon: ICON[type], accent: accentForType(type) }))} />}
      </RemoteGate>
    </Screen>
  );
}
