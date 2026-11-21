import { useState } from "react";
import { Image, Linking, Pressable, Text, View, useWindowDimensions } from "react-native";
import Svg, { Polygon } from "react-native-svg";
import { licenseUrl, type Visual } from "../content/visuals";
import { imageUrl, siteBaseUrl } from "../core/remoteContent";
import { useApp } from "../state/app";
import { scalePoints } from "./geometry";
import { radius, space, type } from "./theme";

// Privacy cover matches the website's central line visual and leaves catheter parts visible.
const COVER_POINTS = "76,25 100,25 100,73 76,71 69,66 62,63 57,59 51,55 46,50 45,43 45,38 43,35 38,35 73,33";

export function VisualPhoto({ visual, width, hideTeaching = false }: { visual: Visual; width?: number; hideTeaching?: boolean }) {
  const { locale, palette } = useApp();
  const { width: screenWidth } = useWindowDimensions();
  const [failed, setFailed] = useState(false);
  const [retryToken, setRetryToken] = useState(0);
  const lang = locale === "ar" ? 1 : 0;
  const uri = imageUrl(siteBaseUrl(process.env as Record<string, string | undefined>), visual.path);
  const availableWidth = Math.max(180, Math.min(width ?? screenWidth - 72, screenWidth - 72, 440));
  const scale = Math.min(availableWidth / visual.width, 340 / visual.height);
  const imageWidth = Math.round(visual.width * scale);
  const imageHeight = Math.round(visual.height * scale);
  const original = visual.license === "Original";
  const publicDomain = visual.license === "Public domain";
  const sourceLabel = original ? visual.source : `${visual.source} · ${visual.credit} · ${publicDomain ? "Public domain" : "CC " + visual.license}`;

  return (
    <View style={{ backgroundColor: palette.surface, borderRadius: radius, overflow: "hidden", borderWidth: 1, borderColor: palette.border, marginBottom: space.md }}>
      {failed ? (
        <View style={{ padding: space.lg, gap: space.sm, backgroundColor: palette.tint }}>
          <Text style={[type.small, { color: palette.text }]}>{lang === 1 ? "تعذّر تحميل الصورة. يمكن فتحها من المصدر." : "Image could not load. You can open it on the website."}</Text>
          <Text style={[type.small, { color: palette.muted }]}>{hideTeaching
            ? (lang === 1 ? "يلزم تحميل الصورة للإجابة على هذا التدريب البصري." : "This visual exercise requires the image to load before it can be answered.")
            : visual.alt[lang]}</Text>
          <Pressable accessibilityRole="button" onPress={() => { setFailed(false); setRetryToken((n) => n + 1); }}>
            <Text style={[type.small, { color: palette.primary, fontWeight: "700" }]}>{lang === 1 ? "إعادة تحميل الصورة" : "Retry image"}</Text>
          </Pressable>
          <Pressable accessibilityRole="link" onPress={() => Linking.openURL(uri)}>
            <Text style={[type.small, { color: palette.primary, fontWeight: "700" }]}>{lang === 1 ? "عرض الصورة" : "Open image"}</Text>
          </Pressable>
        </View>
      ) : (
        <View style={{ width: imageWidth, height: imageHeight, alignSelf: "center" }}>
          <Image key={retryToken} source={{ uri, cache: "force-cache" }} accessibilityLabel={hideTeaching ? (lang === 1 ? "صورة جهاز لاختبار التعرّف البصري" : "Clinical equipment photo for visual-identification practice") : visual.alt[lang]} onError={() => setFailed(true)} style={{ width: imageWidth, height: imageHeight }} resizeMode="contain" />
          {visual.coveredForPrivacy ? (
            <Svg width={imageWidth} height={imageHeight} style={{ position: "absolute", top: 0, left: 0 }} pointerEvents="none">
              <Polygon points={scalePoints(COVER_POINTS, imageWidth, imageHeight)} fill="#1e293b" />
            </Svg>
          ) : null}
        </View>
      )}
      <View style={{ padding: space.md, gap: space.xs / 2 }}>
        {hideTeaching ? <Text style={[type.small, { color: palette.text }]}>{lang === 1 ? "افحص الصورة ثم اختر الإجابة." : "Examine the image before choosing your answer."}</Text> : <Text style={[type.small, { color: palette.text, fontWeight: "700", writingDirection: lang === 1 ? "rtl" : "ltr" }]}>{visual.label[lang]}</Text>}
        {hideTeaching ? null : <Text style={[type.small, { color: palette.muted, writingDirection: lang === 1 ? "rtl" : "ltr" }]}>{visual.detail[lang]}</Text>}
        {original ? (
          <Text style={[type.small, { color: palette.muted }]}>{sourceLabel}</Text>
        ) : (
          <Pressable accessibilityRole="link" onPress={() => Linking.openURL(publicDomain ? "https://creativecommons.org/publicdomain/" : licenseUrl(visual.license))}>
            <Text style={[type.small, { color: palette.primary }]}>{sourceLabel}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
