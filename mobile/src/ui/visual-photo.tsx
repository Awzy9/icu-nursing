import { Image, Linking, Pressable, Text, View } from "react-native";
import Svg, { Polygon } from "react-native-svg";
import { licenseUrl, type Visual } from "../content/visuals";
import { imageUrl, siteBaseUrl } from "../core/remoteContent";
import { useApp } from "../state/app";
import { scalePoints } from "./geometry";
import { radius, space, type } from "./theme";

// Same coordinates as the website's privacy cover (src/components/working/equipment-visual.tsx)
// over the central-line photo, kept over the breast area while leaving the catheter visible.
const COVER_POINTS = "76,25 100,25 100,73 76,71 69,66 62,63 57,59 51,55 46,50 45,43 45,38 43,35 38,35 73,33";

export function VisualPhoto({ visual, width = 280 }: { visual: Visual; width?: number }) {
  const { locale, palette } = useApp();
  const ar = locale === "ar";
  const lang = ar ? 1 : 0;
  const uri = imageUrl(siteBaseUrl(process.env as Record<string, string | undefined>), visual.path);
  const height = (visual.height / visual.width) * width;

  return (
    <View style={{ backgroundColor: palette.surface, borderRadius: radius, overflow: "hidden", borderWidth: 1, borderColor: palette.border, marginBottom: space.md }}>
      <View style={{ width, height, alignSelf: "center" }}>
        <Image source={{ uri }} accessibilityLabel={visual.alt[lang]} style={{ width, height }} resizeMode="contain" />
        {visual.coveredForPrivacy ? (
          <Svg width={width} height={height} style={{ position: "absolute", top: 0, left: 0 }} pointerEvents="none">
            {/* COVER_POINTS are percentages of a 100x100 box; scaled to the rendered image size. */}
            <Polygon points={scalePoints(COVER_POINTS, width, height)} fill="#1e293b" />
          </Svg>
        ) : null}
      </View>
      <View style={{ padding: space.md, gap: space.xs / 2 }}>
        <Text style={[type.small, { color: palette.text, fontWeight: "700", writingDirection: ar ? "rtl" : "ltr" }]}>{visual.label[lang]}</Text>
        <Text style={[type.small, { color: palette.muted, writingDirection: ar ? "rtl" : "ltr" }]}>{visual.detail[lang]}</Text>
        <Pressable accessibilityRole="link" onPress={() => Linking.openURL(licenseUrl(visual.license))}>
          <Text style={[type.small, { color: palette.primary }]}>{`${visual.source} · ${visual.credit} · CC ${visual.license}${visual.coveredForPrivacy ? " · Shown with a privacy cover" : ""}`}</Text>
        </Pressable>
      </View>
    </View>
  );
}
