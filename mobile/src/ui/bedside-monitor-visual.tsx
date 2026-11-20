import { useState } from "react";
import { Image, Linking, Pressable, Text, View } from "react-native";
import { bedsideMonitorVisual, licenseUrl } from "../content/visuals";
import { imageUrl, siteBaseUrl } from "../core/remoteContent";
import { useApp } from "../state/app";
import { radius, space, type } from "./theme";

function Feature({ title, description }: { title: string; description: string }) {
  const { palette } = useApp();
  const [open, setOpen] = useState(false);
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen((v) => !v)}
      style={{ borderWidth: 1, borderColor: palette.border, borderRadius: radius, padding: space.md, gap: space.xs }}>
      <Text style={[type.body, { color: palette.text, fontWeight: "700", writingDirection: "ltr" }]}>{title}</Text>
      {open ? <Text style={[type.small, { color: palette.muted, writingDirection: "ltr" }]}>{description}</Text> : null}
    </Pressable>
  );
}

/** Native port of src/components/working/bedside-monitor-visual.tsx (EQ-01): the demo-mode photo plus three expandable feature callouts (ECG/heart rate, SpO2/pulse waveform, alarm priority). */
export function BedsideMonitorVisual() {
  const { locale, palette } = useApp();
  const lang = locale === "ar" ? 1 : 0;
  const uri = imageUrl(siteBaseUrl({ EXPO_PUBLIC_SITE_URL: process.env.EXPO_PUBLIC_SITE_URL }), bedsideMonitorVisual.path);
  const width = 320;
  const height = (bedsideMonitorVisual.height / bedsideMonitorVisual.width) * width;

  return (
    <View style={{ gap: space.md, marginBottom: space.md }}>
      <View style={{ backgroundColor: palette.surface, borderRadius: radius, overflow: "hidden", borderWidth: 1, borderColor: palette.border }}>
        <Image source={{ uri }} accessibilityLabel={bedsideMonitorVisual.alt[lang]} style={{ width, height, alignSelf: "center" }} resizeMode="contain" />
        <View style={{ padding: space.md }}>
          <Pressable accessibilityRole="link" onPress={() => Linking.openURL(licenseUrl(bedsideMonitorVisual.license))}>
            <Text style={[type.small, { color: palette.primary }]}>{`${bedsideMonitorVisual.source} · ${bedsideMonitorVisual.credit} · CC ${bedsideMonitorVisual.license}`}</Text>
          </Pressable>
        </View>
      </View>
      {bedsideMonitorVisual.features.map((f) => <Feature key={f.title[0]} title={f.title[lang]} description={f.description[lang]} />)}
    </View>
  );
}
