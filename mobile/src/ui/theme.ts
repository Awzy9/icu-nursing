// Design tokens: the single source of truth for colour, type, spacing, radius and elevation.
// Contrast pairs are checked by tests/mobile/guards.test.ts (WCAG AA: 4.5:1 for text, 3:1 for control borders).
export type AccentKey = "topics" | "skills" | "medications" | "equipment" | "practice" | "study";
export interface Accent { fg: string; bg: string }

export interface Palette {
  bg: string; surface: string; text: string; muted: string; border: string; primary: string; onPrimary: string;
  warnBg: string; warnText: string; dangerText: string; success: string;
  /** Soft primary wash for selected/info areas. */
  tint: string;
  /** Decorative card outlines and dividers (not for control boundaries: use `border`, which meets 3:1). */
  hairline: string;
  dangerBg: string; successBg: string;
  /** CSS boxShadow for resting cards. */
  shadowCard: string;
  /** One colour per content area, as text/icon (fg) on its own tinted background (bg). */
  accents: Record<AccentKey, Accent>;
}

export const light: Palette = {
  bg: "#F4F7FB", surface: "#FFFFFF", text: "#0E1A2B", muted: "#52627A", border: "#7D8DA6", primary: "#0E7490", onPrimary: "#FFFFFF",
  warnBg: "#FFF4D6", warnText: "#6B4A00", dangerText: "#B42318", success: "#067647",
  tint: "#E1F2F7", hairline: "#E1E8F1", dangerBg: "#FDECEA", successBg: "#E3F5EC",
  shadowCard: "0 1px 2px rgba(14, 26, 43, 0.06), 0 6px 16px rgba(14, 26, 43, 0.06)",
  accents: {
    topics: { fg: "#1D4ED8", bg: "#E6EEFF" }, skills: { fg: "#0B7A5A", bg: "#DFF4EA" }, medications: { fg: "#6D28D9", bg: "#EEE6FF" },
    equipment: { fg: "#9A4B06", bg: "#FDEFD9" }, practice: { fg: "#BE123C", bg: "#FCE5EB" }, study: { fg: "#0E7490", bg: "#DFF2F7" },
  },
};
export const dark: Palette = {
  bg: "#0A1220", surface: "#131E31", text: "#EAF1FA", muted: "#A3B3C9", border: "#6F819B", primary: "#4FC3D9", onPrimary: "#06202A",
  warnBg: "#3A2F0B", warnText: "#FFE7A3", dangerText: "#FF9C93", success: "#6EDBA0",
  tint: "#0F2B38", hairline: "#22314A", dangerBg: "#3A1512", successBg: "#0F2E22",
  shadowCard: "0 0 0 1px #22314A",
  accents: {
    topics: { fg: "#8DB4FF", bg: "#14264A" }, skills: { fg: "#6EDBA6", bg: "#0F2E25" }, medications: { fg: "#C4A8FF", bg: "#2A1D4F" },
    equipment: { fg: "#FFC27A", bg: "#3A2A10" }, practice: { fg: "#FF9DB3", bg: "#3F1522" }, study: { fg: "#6FD3E6", bg: "#0F2E38" },
  },
};

/** Which accent colour a catalog entry type uses. */
export const accentForType = (type: string): AccentKey =>
  type === "topics" || type === "skills" || type === "medications" || type === "equipment" ? type : type === "cases" ? "practice" : "study";

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = 16; // cards
export const radii = { sm: 10, md: 14, lg: 16, xl: 24, pill: 999 } as const;
export const MIN_TARGET = 48; // dp: every tappable control is at least this tall
export const type = {
  h1: { fontSize: 30, lineHeight: 36, fontWeight: "700" as const, letterSpacing: -0.4 },
  h2: { fontSize: 20, lineHeight: 26, fontWeight: "700" as const, letterSpacing: -0.2 },
  h3: { fontSize: 17, lineHeight: 24, fontWeight: "600" as const },
  body: { fontSize: 16, lineHeight: 24 },
  small: { fontSize: 14, lineHeight: 20 },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: "600" as const, letterSpacing: 0.3 },
};
