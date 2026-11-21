import { View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { useApp } from "../state/app";
import { radii, type AccentKey } from "./theme";

// A small family of line icons on a 24x24 grid (2px round strokes), so every screen shares one visual language.
interface IconDef { paths: string[]; circles?: { cx: number; cy: number; r: number }[] }
const ICONS = {
  book: { paths: ["M2 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2z", "M22 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z"] },
  checklist: { paths: ["M3 6l1.5 1.5L7 5", "M3 12l1.5 1.5L7 11", "M3 18l1.5 1.5L7 17", "M11 6h10", "M11 12h10", "M11 18h10"] },
  pill: { paths: ["M10.5 20.5l10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7z", "M8.5 8.5l7 7"] },
  pulse: { paths: ["M22 12h-4l-3 9L9 3l-3 9H2"] },
  heart: { paths: ["M19 14c1.5-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7z", "M3.2 12h6.3l.5-1 2 4.5 2-7 1.5 3.5h5.3"] },
  help: { paths: ["M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3", "M12 17h.01"], circles: [{ cx: 12, cy: 12, r: 10 }] },
  route: { paths: ["M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"], circles: [{ cx: 6, cy: 19, r: 3 }, { cx: 18, cy: 5, r: 3 }] },
  repeat: { paths: ["M21 12a9 9 0 1 1-3-6.7", "M21 4v5h-5"] },
  clock: { paths: ["M12 6v6l4 2"], circles: [{ cx: 12, cy: 12, r: 10 }] },
  flask: { paths: ["M9 3h6", "M10 3v6L4.5 19a1.5 1.5 0 0 0 1.3 2.2h12.4a1.5 1.5 0 0 0 1.3-2.2L14 9V3", "M7.5 14h9"] },
  bookmark: { paths: ["M6 3h12v18l-6-4-6 4z"] },
  search: { paths: ["M20 20l-4-4"], circles: [{ cx: 11, cy: 11, r: 7 }] },
  user: { paths: ["M4 21a8 8 0 0 1 16 0"], circles: [{ cx: 12, cy: 8, r: 4 }] },
  chevron: { paths: ["M9 6l6 6-6 6"] },
  play: { paths: ["M7 4l13 8-13 8z"] },
  check: { paths: ["M5 12l5 5L20 7"] },
} satisfies Record<string, IconDef>;
export type IconName = keyof typeof ICONS;

/** A decorative line icon; hidden from screen readers (the label next to it carries the meaning). `mirror` flips it for right-to-left layouts. */
export function Icon({ name, size = 22, color, strokeWidth = 2, mirror }: { name: IconName; size?: number; color: string; strokeWidth?: number; mirror?: boolean }) {
  const def: IconDef = ICONS[name];
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" accessibilityElementsHidden importantForAccessibility="no" style={mirror ? { transform: [{ scaleX: -1 }] } : undefined}>
      {def.circles?.map((c, i) => <Circle key={i} cx={c.cx} cy={c.cy} r={c.r} stroke={color} strokeWidth={strokeWidth} fill="none" />)}
      {def.paths.map((d, i) => <Path key={i} d={d} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none" />)}
    </Svg>
  );
}

/** A rounded square holding an icon in one of the app's category colours. */
export function IconTile({ name, accent, size = 44 }: { name: IconName; accent: AccentKey; size?: number }) {
  const { palette } = useApp();
  const a = palette.accents[accent];
  return (
    <View style={{ width: size, height: size, borderRadius: radii.md, backgroundColor: a.bg, alignItems: "center", justifyContent: "center" }}>
      <Icon name={name} color={a.fg} size={Math.round(size * 0.5)} />
    </View>
  );
}
