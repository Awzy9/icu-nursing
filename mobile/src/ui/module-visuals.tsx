import { View } from "react-native";
import { visualsForModule } from "../content/equipment-visuals";
import { VisualPhoto } from "./visual-photo";

/** Shared visuals for the exact same module keys as the website's equipment gallery. */
export function ModuleVisuals({ moduleKey }: { moduleKey: string }) {
  const visuals = visualsForModule(moduleKey);
  if (!visuals.length) return null;
  return <View>{visuals.map((visual) => <VisualPhoto key={visual.path} visual={visual} />)}</View>;
}
