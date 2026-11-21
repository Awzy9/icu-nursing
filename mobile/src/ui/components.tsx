import React from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View, type StyleProp, type ViewStyle } from "react-native";
import RNSlider from "@react-native-community/slider";
import { useRouter, type Href } from "expo-router";
import { useApp } from "../state/app";
import type { FetchState } from "../hooks/useRemoteContent";
import { useProgressSync } from "../hooks/useProgressSync";
import { Icon, IconTile, type IconName } from "./icons";
import { MIN_TARGET, radii, radius, space, type, type AccentKey, type Palette } from "./theme";

/** The resting look shared by every card: white surface, soft shadow, faint outline. */
export const cardStyle = (palette: Palette): ViewStyle => ({ backgroundColor: palette.surface, borderRadius: radius, borderWidth: 1, borderColor: palette.hairline, boxShadow: palette.shadowCard });

/** Page container: scrolls, applies the language direction to everything inside, and carries the draft-content notice. */
export function Screen({ children, banner = true }: { children: React.ReactNode; banner?: boolean }) {
  const { palette, rtl } = useApp();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: palette.bg, direction: rtl ? "rtl" : "ltr" }} contentContainerStyle={{ padding: space.lg, paddingBottom: space.xxl, gap: space.lg }} keyboardShouldPersistTaps="handled">
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
      style={{ backgroundColor: palette.warnBg, borderRadius: radii.md, paddingHorizontal: space.md, paddingVertical: space.sm, gap: space.xs }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
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
export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) { const { palette } = useApp(); return <View style={[cardStyle(palette), { padding: space.lg, gap: space.sm }, style]}>{children}</View>; }

/** Meaning is never carried by colour alone: every callout is text, with a coloured edge as reinforcement. */
export function Callout({ children, tone = "info" }: { children: React.ReactNode; tone?: "info" | "warn" | "danger" | "success" }) {
  const { palette, rtl } = useApp();
  const bg = tone === "warn" ? palette.warnBg : tone === "danger" ? palette.dangerBg : tone === "success" ? palette.successBg : palette.tint;
  const fg = tone === "warn" ? palette.warnText : tone === "danger" ? palette.dangerText : tone === "success" ? palette.success : palette.text;
  const edge = tone === "info" ? palette.primary : fg;
  return <View accessibilityRole={tone === "danger" ? "alert" : undefined} style={{ backgroundColor: bg, borderRadius: radii.md, padding: space.md, borderStartWidth: 4, borderStartColor: edge }}><Text style={[type.small, { color: fg, writingDirection: rtl ? "rtl" : "ltr" }]}>{children}</Text></View>;
}
export function Button({ label, onPress, variant = "primary", disabled, hint, icon }: { label: string; onPress: () => void; variant?: "primary" | "outline" | "danger"; disabled?: boolean; hint?: string; icon?: IconName }) {
  const { palette } = useApp();
  const filled = variant === "primary";
  const fg = filled ? palette.onPrimary : variant === "danger" ? palette.dangerText : palette.primary;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityHint={hint} accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={onPress}
      style={({ pressed }) => ({ minHeight: 52, borderRadius: radii.md, paddingHorizontal: space.lg, flexDirection: "row", gap: space.sm, justifyContent: "center", alignItems: "center", backgroundColor: filled ? palette.primary : palette.surface, borderWidth: filled ? 0 : 1.5, borderColor: variant === "danger" ? palette.dangerText : palette.primary, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 })}>
      {icon ? <Icon name={icon} color={fg} size={20} /> : null}
      <Text style={[type.h3, { color: fg, textAlign: "center", flexShrink: 1 }]}>{label}</Text>
    </Pressable>
  );
}
const Chevron = () => { const { palette, rtl } = useApp(); return <Icon name="chevron" color={palette.muted} size={20} mirror={rtl} />; };

/** A tappable card that navigates: optional icon tile, title, an optional description (clamped to two lines so long copy cannot make lists endless) and a chevron. */
export function NavCard({ href, title, body, badge, icon, accent = "study" }: { href: Href; title: string; body?: string; badge?: string; icon?: IconName; accent?: AccentKey }) {
  const { palette, rtl, t } = useApp();
  const router = useRouter();
  const dir = { writingDirection: rtl ? "rtl" : "ltr" } as const;
  return (
    <Pressable onPress={() => router.push(href)} accessibilityRole="link" accessibilityLabel={t("a11y.openItem", { title })}
      style={({ pressed }) => ({ ...cardStyle(palette), minHeight: MIN_TARGET, flexDirection: "row", alignItems: "center", gap: space.md, paddingVertical: space.md, paddingHorizontal: space.lg, opacity: pressed ? 0.85 : 1 })}>
      {icon ? <IconTile name={icon} accent={accent} /> : null}
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[type.h3, dir, { color: palette.text }]}>{title}</Text>
        {body ? <Text numberOfLines={2} style={[type.small, dir, { color: palette.muted }]}>{body}</Text> : null}
        {badge ? <Text style={[type.small, { color: palette.warnText, fontWeight: "600" }]}>{badge}</Text> : null}
      </View>
      <Chevron />
    </Pressable>
  );
}

/** Several related destinations as one rounded card with hairline dividers (like a settings screen): far denser than a stack of separate cards, so long lists stay scannable. */
export function NavGroup({ items }: { items: { href: Href; title: string; body?: string; icon?: IconName; accent?: AccentKey }[] }) {
  const { palette, rtl, t } = useApp();
  const router = useRouter();
  const dir = { writingDirection: rtl ? "rtl" : "ltr" } as const;
  return (
    <View style={[cardStyle(palette), { overflow: "hidden" }]}>
      {items.map((item, i) => (
        <Pressable key={i} onPress={() => router.push(item.href)} accessibilityRole="link" accessibilityLabel={t("a11y.openItem", { title: item.title })}
          style={({ pressed }) => ({ minHeight: MIN_TARGET, flexDirection: "row", alignItems: "center", gap: space.md, paddingVertical: space.md, paddingHorizontal: space.lg, borderTopWidth: i ? 1 : 0, borderTopColor: palette.hairline, backgroundColor: pressed ? palette.tint : "transparent" })}>
          {item.icon ? <IconTile name={item.icon} accent={item.accent ?? "study"} size={40} /> : null}
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[type.h3, dir, { color: palette.text }]}>{item.title}</Text>
            {item.body ? <Text numberOfLines={2} style={[type.small, dir, { color: palette.muted }]}>{item.body}</Text> : null}
          </View>
          <Chevron />
        </Pressable>
      ))}
    </View>
  );
}

/** A small uppercase label that names a group of items. */
export function SectionLabel({ children }: { children: React.ReactNode }) {
  const { palette, rtl } = useApp();
  return <Text accessibilityRole="header" style={[type.caption, { color: palette.muted, textTransform: "uppercase", letterSpacing: 0.8, marginTop: space.sm, writingDirection: rtl ? "rtl" : "ltr" }]}>{children}</Text>;
}

/** A big-number tile in a category colour that links into a part of the library; the count shows "..." while loading and a dash when unavailable. */
export function StatTile({ href, count, label, icon, accent = "study" }: { href: Href; count: number | "loading" | undefined; label: string; icon?: IconName; accent?: AccentKey }) {
  const { palette, rtl, t } = useApp();
  const router = useRouter();
  const a = palette.accents[accent];
  return (
    <Pressable onPress={() => router.push(href)} accessibilityRole="link" accessibilityLabel={typeof count === "number" ? t("hub.tileLabel", { label, count }) : label}
      style={({ pressed }) => ({ flexGrow: 1, flexBasis: "45%", minHeight: 116, justifyContent: "space-between", gap: space.md, backgroundColor: a.bg, borderRadius: radii.xl, padding: space.lg, opacity: pressed ? 0.85 : 1 })}>
      {icon ? <Icon name={icon} color={a.fg} size={26} /> : null}
      <View>
        <Text style={[type.h1, { color: a.fg, fontVariant: ["tabular-nums"] }]}>{count === "loading" ? "…" : count ?? "–"}</Text>
        <Text style={[type.small, { color: palette.text, fontWeight: "600", writingDirection: rtl ? "rtl" : "ltr" }]}>{label}</Text>
      </View>
    </Pressable>
  );
}

/** A search field that opens the search screen: looks like an input, behaves like a button. */
export function SearchBar({ label, hint }: { label: string; hint: string }) {
  const { palette, rtl } = useApp();
  const router = useRouter();
  return (
    <Pressable onPress={() => router.push("/search")} accessibilityRole="search" accessibilityLabel={label} accessibilityHint={hint}
      style={({ pressed }) => ({ ...cardStyle(palette), minHeight: 52, borderRadius: radii.pill, flexDirection: "row", alignItems: "center", gap: space.md, paddingHorizontal: space.lg, opacity: pressed ? 0.85 : 1 })}>
      <Icon name="search" color={palette.muted} size={20} />
      <Text numberOfLines={1} style={[type.small, { flex: 1, color: palette.muted, writingDirection: rtl ? "rtl" : "ltr" }]}>{hint}</Text>
    </Pressable>
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
    <Pressable accessibilityRole="button" accessibilityState={{ selected: !!selected }} onPress={onPress}
      style={{ minHeight: MIN_TARGET, paddingHorizontal: space.lg, borderRadius: radii.pill, justifyContent: "center", borderWidth: 1.5, borderColor: selected ? palette.primary : `${palette.border}99`, backgroundColor: selected ? palette.primary : palette.surface }}>
      <Text style={[type.body, { color: selected ? palette.onPrimary : palette.text, fontWeight: selected ? "700" : "500" }]}>{label}</Text>
    </Pressable>
  );
}
export function BulletList({ items }: { items: string[] }) { return <View style={{ gap: space.xs }}>{items.map((t, i) => <P key={i}>{`• ${t}`}</P>)}</View>; }
/** Renders the honest loading / offline (with retry) / content states for a useRemoteContent hook, instead of ever showing stale or placeholder data silently. */
export function RemoteGate<T>({ state, onRetry, empty, children }: { state: FetchState<T>; onRetry?: () => void; empty?: (data: T) => boolean; children: (data: T, fromCache: boolean) => React.ReactNode }) {
  const { t, palette } = useApp();
  if (state.status === "loading") return <View style={{ paddingVertical: space.xl, alignItems: "center", gap: space.sm }}><ActivityIndicator color={palette.primary} /><P muted>{t("common.loading")}</P></View>;
  if (state.status === "offline") return <Card><P>{t("common.offline")}</P>{onRetry ? <Button label={t("common.retry")} variant="outline" onPress={onRetry} /> : null}</Card>;
  if (empty?.(state.data)) return <Card><P muted>{t("common.empty")}</P></Card>;
  return <>{state.fromCache ? <Callout tone="info">{t("common.cached")}</Callout> : null}{children(state.data, state.fromCache)}</>;
}
export function BookmarkButton({ itemKey }: { itemKey: string }) {
  const { progress, t } = useApp();
  const { toggleBookmark } = useProgressSync();
  const on = progress.bookmarks.includes(itemKey);
  return <Button icon="bookmark" label={on ? t("bookmark.remove") : t("bookmark.add")} variant="outline" hint={on ? t("a11y.bookmarkOn") : t("a11y.bookmarkOff")} onPress={() => toggleBookmark(itemKey)} />;
}
export function CompleteButton({ moduleKey }: { moduleKey: string }) {
  const { progress, t } = useApp();
  const { setComplete } = useProgressSync();
  const done = progress.completed.includes(moduleKey);
  return <Button icon="check" label={done ? t("lesson.completed") : t("lesson.complete")} variant={done ? "primary" : "outline"} hint={done ? t("a11y.completeOn") : t("a11y.completeOff")} onPress={() => setComplete(moduleKey, !done)} />;
}
