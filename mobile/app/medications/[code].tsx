import { useLocalSearchParams } from "expo-router";
import { RemoteGate, Screen } from "../../src/ui/components";
import { LessonReader } from "../../src/ui/lesson-reader";
import { ModuleVisuals } from "../../src/ui/module-visuals";
import { useCatalogEntry } from "../../src/hooks/useRemoteContent";

export default function MedicationScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const entry = useCatalogEntry(code);
  return (
    <Screen>
      <RemoteGate state={entry} onRetry={entry.refresh}>
        {(data) => <LessonReader entry={data} bookmarkKey={`medications:${data.key}`} visual={<ModuleVisuals moduleKey={data.key} />} />}
      </RemoteGate>
    </Screen>
  );
}
