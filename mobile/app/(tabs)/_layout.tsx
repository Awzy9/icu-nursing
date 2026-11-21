import { Tabs } from "expo-router";
import type { ComponentProps } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { useApp } from "../../src/state/app";

const icons: Record<string, string> = {
  index: "M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  practice: "M5 4h14v4H5zM5 10h14v4H5zM5 16h9v4H5z",
  library: "M5 3h4v18H5zM11 3h4v18h-4zM17 5l3 1-4 15-3-1z",
  tools: "M5 5h14v14H5zM9 2v6M15 2v6M9 16h6M9 12h6",
  visuals: "M3 4h18v16H3zM6 16l4-5 3 3 2-2 4 4M8 8h.01",
  account: "M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zM4 21a8 8 0 0 1 16 0z",
};
const Icon = ({ name, color }: { name: string; color: import("react-native").ColorValue }) => <Svg width={24} height={24} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no"><Path d={icons[name]!} fill={color as string} /></Svg>;

/**
 * Six explicit, equally sized tabs. Using a custom bar keeps Account in sight on
 * narrow iPhones instead of burying it beneath a fifth-item "More" menu.
 */
type VisibleTabProps = Parameters<NonNullable<ComponentProps<typeof Tabs>["tabBar"]>>[0];
function VisibleTabBar({ state, navigation }: VisibleTabProps) {
  const { palette, t, rtl } = useApp();
  const { bottom } = useSafeAreaInsets();
  const names: Record<string, string> = {
    home: t("tab.home"), library: t("tab.learn"), practice: t("tab.practice"),
    tools: t("tab.tools"), visuals: t("tab.visuals"), account: t("tab.account"),
  };
  return (
    <View style={{
      flexDirection: rtl ? "row-reverse" : "row", paddingTop: 6, paddingBottom: Math.max(6, bottom),
      borderTopWidth: 1, borderTopColor: palette.hairline, backgroundColor: palette.surface,
    }}>
      {state.routes.map((route, index) => {
        const selected = state.index === index;
        const label = names[route.name] ?? route.name;
        const color = selected ? palette.primary : palette.muted;
        return (
          <Pressable key={route.key} accessibilityRole="tab" accessibilityState={{ selected }}
            accessibilityLabel={label} accessibilityHint={selected ? undefined : label}
            onPress={() => {
              const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
              if (!selected && !event.defaultPrevented) navigation.navigate(route.name, route.params);
            }}
            onLongPress={() => navigation.emit({ type: "tabLongPress", target: route.key })}
            style={{ flex: 1, minWidth: 0, minHeight: 54, alignItems: "center", justifyContent: "center", gap: 3, paddingHorizontal: 1 }}>
            <Icon name={route.name} color={color} />
            <Text adjustsFontSizeToFit numberOfLines={1} minimumFontScale={0.75}
              style={{ fontSize: 10.5, textAlign: "center", color, fontWeight: selected ? "700" : "600" }}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  const { palette, t } = useApp();
  return (
    <Tabs tabBar={(props) => <VisibleTabBar {...props} />} screenOptions={{ headerStyle: { backgroundColor: palette.bg }, headerShadowVisible: false, headerTitleStyle: { fontWeight: "700", fontSize: 20, color: palette.text }, headerTintColor: palette.text, tabBarActiveTintColor: palette.primary, tabBarInactiveTintColor: palette.muted, tabBarStyle: { backgroundColor: palette.surface, borderTopColor: palette.hairline, minHeight: 64, paddingTop: 6 }, tabBarLabelStyle: { fontSize: 12, fontWeight: "600" } }}>
      <Tabs.Screen name="home" options={{ title: t("tab.home"), tabBarIcon: ({ color }) => <Icon name="index" color={color} /> }} />
      <Tabs.Screen name="library" options={{ title: t("tab.learn"), tabBarIcon: ({ color }) => <Icon name="library" color={color} /> }} />
      <Tabs.Screen name="practice" options={{ title: t("tab.practice"), tabBarIcon: ({ color }) => <Icon name="practice" color={color} /> }} />
      <Tabs.Screen name="tools" options={{ title: t("tab.tools"), tabBarIcon: ({ color }) => <Icon name="tools" color={color} /> }} />
      <Tabs.Screen name="visuals" options={{ title: t("tab.visuals"), tabBarIcon: ({ color }) => <Icon name="visuals" color={color} /> }} />
      <Tabs.Screen name="account" options={{ title: t("tab.account"), tabBarIcon: ({ color }) => <Icon name="account" color={color} /> }} />
    </Tabs>
  );
}
