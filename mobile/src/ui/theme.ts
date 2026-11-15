// Design tokens. Contrast pairs are checked by tests/mobile/theme.test.ts (WCAG AA: 4.5:1 for text, 3:1 for graphics and borders).
export interface Palette { bg: string; surface: string; text: string; muted: string; border: string; primary: string; onPrimary: string; warnBg: string; warnText: string; dangerText: string; success: string }
export const light: Palette = { bg: "#ffffff", surface: "#f2f5f8", text: "#14181c", muted: "#4a5560", border: "#8794a1", primary: "#1d4ed8", onPrimary: "#ffffff", warnBg: "#fff3cd", warnText: "#5c4400", dangerText: "#a11d1d", success: "#17653a" };
export const dark: Palette = { bg: "#111418", surface: "#1d232a", text: "#f3f5f7", muted: "#b3bdc7", border: "#7d8995", primary: "#8db4ff", onPrimary: "#0b1220", warnBg: "#3b3000", warnText: "#ffe9a3", dangerText: "#ff9a9a", success: "#7fd9a2" };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;
export const radius = 10;
export const MIN_TARGET = 48; // dp: every tappable control is at least this tall
export const type = { h1: { fontSize: 28, lineHeight: 34, fontWeight: "700" as const }, h2: { fontSize: 20, lineHeight: 26, fontWeight: "600" as const }, h3: { fontSize: 17, lineHeight: 23, fontWeight: "600" as const }, body: { fontSize: 16, lineHeight: 23 }, small: { fontSize: 14, lineHeight: 20 } };
