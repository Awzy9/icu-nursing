import { Stack, useLocalSearchParams } from "expo-router";
import { RemoteGate, Screen } from "../../src/ui/components";
import { LessonReader } from "../../src/ui/lesson-reader";
import { ModuleVisuals } from "../../src/ui/module-visuals";
import { useApp } from "../../src/state/app";
import { useCatalogEntry } from "../../src/hooks/useRemoteContent";

export default function TopicScreen() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const { t } = useApp();
  const entry = useCatalogEntry(key);
  return (
    <Screen>
      <Stack.Screen options={{ title: t("topic.title") }} />
      <RemoteGate state={entry} onRetry={entry.refresh}>
        {(data) => <LessonReader entry={data} bookmarkKey={`topics:${data.key}`} visual={<ModuleVisuals moduleKey={data.key} />} />}
      </RemoteGate>
    </Screen>
  );
}
