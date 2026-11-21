import { useLocalSearchParams } from "expo-router";
import { NavCard, RemoteGate, Screen } from "../../src/ui/components";
import { LessonReader } from "../../src/ui/lesson-reader";
import { BedsideMonitorVisual } from "../../src/ui/bedside-monitor-visual";
import { ModuleVisuals } from "../../src/ui/module-visuals";
import { EquipmentTeaching } from "../../src/ui/equipment-teaching";
import { useCatalogEntry } from "../../src/hooks/useRemoteContent";

export default function EquipmentScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const entry = useCatalogEntry(code);
  return (
    <Screen>
      <RemoteGate state={entry} onRetry={entry.refresh}>
        {(data) => <LessonReader entry={data} bookmarkKey={`equipment:${data.key}`} sectionVisual={(title) => title === "Parameters" ? <EquipmentTeaching moduleKey={data.key} /> : null} visual={<>{data.key === "EQ-01" ? <BedsideMonitorVisual /> : null}<ModuleVisuals moduleKey={data.key} /></>}
          children={data.key === "EQ-04" ? <NavCard href="/infusion-calculator" title="Open infusion pump calculator" body="Practise infusion rate, duration and dose-to-rate calculations" icon="pill" accent="medications" /> : data.key === "EQ-02" ? <NavCard href="/vent-lab" title="Open ventilator simulator" body="Adjust ventilator mechanics and inspect pressure, flow and volume traces" icon="pulse" accent="equipment" /> : data.key === "EQ-03" ? <NavCard href="/aline" title="Practise arterial-line square-wave tests" body="Interpret arterial pressure waveform damping" icon="pulse" accent="equipment" /> : undefined} />}
      </RemoteGate>
    </Screen>
  );
}
