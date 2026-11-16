export const FUTURE_FEATURES = ["simulation"] as const;
export type FutureFeature = (typeof FUTURE_FEATURES)[number];
export const isFutureFeature = (v: string): v is FutureFeature => (FUTURE_FEATURES as readonly string[]).includes(v);
