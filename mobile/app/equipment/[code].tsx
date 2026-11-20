import { useLocalSearchParams } from "expo-router";
import { RemoteGate, Screen } from "../../src/ui/components";
import { LessonReader } from "../../src/ui/lesson-reader";
import { EquipmentImages } from "../../src/ui/equipment-images";
import { BedsideMonitorVisual } from "../../src/ui/bedside-monitor-visual";
import { useCatalogEntry } from "../../src/hooks/useRemoteContent";

export default function EquipmentScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const entry = useCatalogEntry(code);
  return (
    <Screen>
      <RemoteGate state={entry} onRetry={entry.refresh}>
        {(data) => <LessonReader entry={data} bookmarkKey={`equipment:${data.key}`} visual={<>{data.key === "EQ-01" && <BedsideMonitorVisual />}<EquipmentImages moduleKey={data.key} /></>} />}
      </RemoteGate>
    </Screen>
  );
}
