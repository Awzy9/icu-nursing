import { useLocalSearchParams } from "expo-router";
import { RemoteGate, Screen } from "../../src/ui/components";
import { LessonReader } from "../../src/ui/lesson-reader";
import { VisualPhoto } from "../../src/ui/visual-photo";
import { centralLineVisual } from "../../src/content/visuals";
import { useCatalogEntry } from "../../src/hooks/useRemoteContent";

const VISUALS: Record<string, typeof centralLineVisual> = { "SK-02": centralLineVisual };

export default function SkillScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const entry = useCatalogEntry(code);
  return (
    <Screen>
      <RemoteGate state={entry} onRetry={entry.refresh}>
        {(data) => <LessonReader entry={data} bookmarkKey={`skills:${data.key}`} visual={VISUALS[data.key] ? <VisualPhoto visual={VISUALS[data.key]!} /> : undefined} />}
      </RemoteGate>
    </Screen>
  );
}
