import React from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import RNSlider from "@react-native-community/slider";
import { Link, type Href } from "expo-router";
import { useApp } from "../state/app";
import type { FetchState } from "../hooks/useRemoteContent";
import { useProgressSync } from "../hooks/useProgressSync";
import { MIN_TARGET, radius, space, type } from "./theme";

/** Page container: scrolls, applies the language direction to everything inside, and carries the draft-content notice. */
export function Screen({ children, banner = true }: { children: React.ReactNode; banner?: boolean }) {
  const { palette, rtl } = useApp();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: palette.bg, direction: rtl ? "rtl" : "ltr" }} contentContainerStyle={{ padding: space.lg, gap: space.md }} keyboardShouldPersistTaps="handled">
      {banner ? <DraftNotice /> : null}
      {children}
    </ScrollView>
  );
}

/** One slim line on every screen instead of a three-line banner; tapping it reveals the full wording, so the disclaimer is always one tap away without pushing content below the fold. */
export function DraftNotice() {
  const { palette, rtl, t } = useApp();
  const [open, setOpen] = React.useState(false);
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} accessibilityHint={t("app.noticeHint")} onPress={() => setOpen((v) => !v)}
      style={{ backgroundColor: palette.warnBg, borderRadius: radius, paddingHorizontal: space.md, paddingVertical: space.sm, gap: space.xs }}>
      <View style={{ flexDirection: rtl ? "row-reverse" : "row", alignItems: "center", gap: space.sm }}>
        <Text style={[type.small, { flex: 1, color: palette.warnText, fontWeight: "600", writingDirection: rtl ? "rtl" : "ltr" }]}>{t("app.noticeShort")}</Text>
        <Text style={[type.small, { color: palette.warnText }]}>{open ? "▴" : "▾"}</Text>
      </View>
      {open ? <Text style={[type.small, { color: palette.warnText, writingDirection: rtl ? "rtl" : "ltr" }]}>{t("app.sampleBanner")}</Text> : null}
    </Pressable>
  );
}
export function H1({ children }: { children: React.ReactNode }) { const { palette, rtl } = useApp(); return <Text accessibilityRole="header" style={[type.h1, { color: palette.text, writingDirection: rtl ? "rtl" : "ltr" }]}>{children}</Text>; }
export function H2({ children }: { children: React.ReactNode }) { const { palette, rtl } = useApp(); return <Text accessibilityRole="header" style={[type.h2, { color: palette.text, marginTop: space.sm, writingDirection: rtl ? "rtl" : "ltr" }]}>{children}</Text>; }
export function P({ children, muted, small }: { children: React.ReactNode; muted?: boolean; small?: boolean }) { const { palette, rtl } = useApp(); return <Text style={[small ? type.small : type.body, { color: muted ? palette.muted : palette.text, writingDirection: rtl ? "rtl" : "ltr" }]}>{children}</Text>; }
export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) { const { palette } = useApp(); return <View style={[{ backgroundColor: palette.surface, borderColor: palette.border, borderWidth: StyleSheet.hairlineWidth * 2, borderRadius: radius, padding: space.lg, gap: space.sm }, style]}>{children}</View>; }

/** Meaning is never carried by colour alone: every callout starts with a text label. */
export function Callout({ children, tone = "info" }: { children: React.ReactNode; tone?: "info" | "warn" | "danger" | "success" }) {
  const { palette, rtl } = useApp();
  const bg = tone === "warn" ? palette.warnBg : palette.surface;
  const fg = tone === "warn" ? palette.warnText : tone === "danger" ? palette.dangerText : tone === "success" ? palette.success : palette.text;
  return <View accessibilityRole={tone === "danger" ? "alert" : undefined} style={{ backgroundColor: bg, borderRadius: radius, padding: space.md, borderWidth: StyleSheet.hairlineWidth * 2, borderColor: palette.border }}><Text style={[type.small, { color: fg, writingDirection: rtl ? "rtl" : "ltr" }]}>{children}</Text></View>;
}
export function Button({ label, onPress, variant = "primary", disabled, hint }: { label: string; onPress: () => void; variant?: "primary" | "outline" | "danger"; disabled?: boolean; hint?: string }) {
  const { palette } = useApp();
  const bg = variant === "primary" ? palette.primary : "transparent";
  const fg = variant === "primary" ? palette.onPrimary : variant === "danger" ? palette.dangerText : palette.primary;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityHint={hint} accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={onPress}
      style={({ pressed }) => ({ minHeight: MIN_TARGET, borderRadius: radius, paddingHorizontal: space.lg, justifyContent: "center", alignItems: "center", backgroundColor: bg, borderWidth: variant === "primary" ? 0 : 1.5, borderColor: variant === "danger" ? palette.dangerText : palette.primary, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 })}>
      <Text style={[type.h3, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}
/** A tappable row/card that navigates. */
export function NavCard({ href, title, body, badge }: { href: Href; title: string; body?: string; badge?: string }) {
  const { palette, rtl, t } = useApp();
  return (
    <Link href={href} asChild>
      <Pressable accessibilityRole="link" accessibilityLabel={t("a11y.openItem", { title })} style={{ minHeight: MIN_TARGET, backgroundColor: palette.surface, borderColor: palette.border, borderWidth: StyleSheet.hairlineWidth * 2, borderRadius: radius, padding: space.lg, gap: space.xs }}>
        <Text style={[type.h3, { color: palette.text, writingDirection: rtl ? "rtl" : "ltr" }]}>{title}</Text>
        {body ? <Text style={[type.small, { color: palette.muted, writingDirection: rtl ? "rtl" : "ltr" }]}>{body}</Text> : null}
        {badge ? <Text style={[type.small, { color: palette.warnText, fontWeight: "600" }]}>{badge}</Text> : null}
      </Pressable>
    </Link>
  );
}
/** A labeled slider control, mirroring the website's own <Slider> in vent-lab/hemo-lab: a
 * live-updating value readout above a drag control, never a free-text numeric input. */
export function SliderField({ label, unit, value, min, max, step, onChange }: { label: string; unit: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  const { palette, rtl } = useApp();
  return (
    <View style={{ gap: space.xs }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={[type.small, { color: palette.text, fontWeight: "600", writingDirection: rtl ? "rtl" : "ltr" }]}>{label}</Text>
        <Text style={[type.small, { color: palette.primary, fontWeight: "700" }]}>{`${value} ${unit}`}</Text>
      </View>
      <RNSlider
        accessibilityLabel={label}
        accessibilityValue={{ text: `${value} ${unit}` }}
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor={palette.primary}
        maximumTrackTintColor={palette.border}
        thumbTintColor={palette.primary}
        style={{ minHeight: MIN_TARGET }}
      />
    </View>
  );
}
export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress: () => void }) {
  const { palette } = useApp();
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: !!selected }} onPress={onPress} style={{ minHeight: MIN_TARGET, paddingHorizontal: space.lg, borderRadius: 24, justifyContent: "center", borderWidth: selected ? 2 : 1, borderColor: selected ? palette.primary : palette.border, backgroundColor: selected ? palette.surface : "transparent" }}>
      <Text style={[type.body, { color: palette.text, fontWeight: selected ? "700" : "400" }]}>{label}</Text>
    </Pressable>
  );
}
export function BulletList({ items }: { items: string[] }) { return <View style={{ gap: space.xs }}>{items.map((t, i) => <P key={i}>{`• ${t}`}</P>)}</View>; }
/** Renders the honest loading / offline (with retry) / content states for a useRemoteContent hook, instead of ever showing stale or placeholder data silently. */
export function RemoteGate<T>({ state, onRetry, empty, children }: { state: FetchState<T>; onRetry?: () => void; empty?: (data: T) => boolean; children: (data: T, fromCache: boolean) => React.ReactNode }) {
  const { t, palette } = useApp();
  if (state.status === "loading") return <View style={{ paddingVertical: space.xl, alignItems: "center" }}><ActivityIndicator color={palette.primary} /><P muted>{t("common.loading")}</P></View>;
  if (state.status === "offline") return <Card><P>{t("common.offline")}</P>{onRetry ? <Button label={t("common.retry")} variant="outline" onPress={onRetry} /> : null}</Card>;
  if (empty?.(state.data)) return <Card><P muted>{t("common.empty")}</P></Card>;
  return <>{state.fromCache ? <Callout tone="info">{t("common.cached")}</Callout> : null}{children(state.data, state.fromCache)}</>;
}
export function BookmarkButton({ itemKey }: { itemKey: string }) {
  const { progress, t } = useApp();
  const { toggleBookmark } = useProgressSync();
  const on = progress.bookmarks.includes(itemKey);
  return <Button label={on ? t("bookmark.remove") : t("bookmark.add")} variant="outline" hint={on ? t("a11y.bookmarkOn") : t("a11y.bookmarkOff")} onPress={() => toggleBookmark(itemKey)} />;
}
export function CompleteButton({ moduleKey }: { moduleKey: string }) {
  const { progress, t } = useApp();
  const { setComplete } = useProgressSync();
  const done = progress.completed.includes(moduleKey);
  return <Button label={done ? t("lesson.completed") : t("lesson.complete")} variant={done ? "primary" : "outline"} hint={done ? t("a11y.completeOn") : t("a11y.completeOff")} onPress={() => setComplete(moduleKey, !done)} />;
}
