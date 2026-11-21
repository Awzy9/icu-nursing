import { Tabs } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { useApp } from "../../src/state/app";

const icons: Record<string, string> = {
  index: "M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  practice: "M5 4h14v4H5zM5 10h14v4H5zM5 16h9v4H5z",
  library: "M5 3h4v18H5zM11 3h4v18h-4zM17 5l3 1-4 15-3-1z",
  account: "M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zM4 21a8 8 0 0 1 16 0z",
};
const Icon = ({ name, color }: { name: string; color: import("react-native").ColorValue }) => <Svg width={24} height={24} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no"><Path d={icons[name]!} fill={color as string} /></Svg>;

export default function TabsLayout() {
  const { palette, t } = useApp();
  return (
    <Tabs screenOptions={{ headerStyle: { backgroundColor: palette.bg }, headerShadowVisible: false, headerTitleStyle: { fontWeight: "700", fontSize: 20, color: palette.text }, headerTintColor: palette.text, tabBarActiveTintColor: palette.primary, tabBarInactiveTintColor: palette.muted, tabBarStyle: { backgroundColor: palette.surface, borderTopColor: palette.hairline, minHeight: 64, paddingTop: 6 }, tabBarLabelStyle: { fontSize: 12, fontWeight: "600" } }}>
      <Tabs.Screen name="index" options={{ title: t("tab.learn"), tabBarIcon: ({ color }) => <Icon name="index" color={color} /> }} />
      <Tabs.Screen name="practice" options={{ title: t("tab.practice"), tabBarIcon: ({ color }) => <Icon name="practice" color={color} /> }} />
      <Tabs.Screen name="library" options={{ title: t("tab.library"), tabBarIcon: ({ color }) => <Icon name="library" color={color} /> }} />
      <Tabs.Screen name="account" options={{ title: t("tab.account"), tabBarIcon: ({ color }) => <Icon name="account" color={color} /> }} />
    </Tabs>
  );
}
