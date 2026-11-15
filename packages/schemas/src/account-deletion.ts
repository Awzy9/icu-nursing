import { z } from "zod";

/** How recently the person must have signed in (seconds). The database enforces the same window; this only lets the page explain it. */
export const RECENT_SECONDS = 600;

/** Seconds since the newest authentication method in a JWT `amr` claim, or null when there is none. Mirrors private.seconds_since_authentication(). */
export function secondsSinceAuthentication(amr: unknown, nowSeconds: number): number | null {
  if (!Array.isArray(amr)) return null;
  const stamps = amr.flatMap((a) => (a && typeof a === "object" && typeof (a as { timestamp?: unknown }).timestamp === "number" && String((a as { timestamp: number }).timestamp).match(/^\d{9,12}$/) ? [(a as { timestamp: number }).timestamp] : []));
  return stamps.length ? nowSeconds - Math.max(...stamps) : null;
}
export const isRecentlyAuthenticated = (amr: unknown, nowSeconds: number): boolean => {
  const s = secondsSinceAuthentication(amr, nowSeconds);
  return s !== null && s >= -60 && s <= RECENT_SECONDS;
};

export const deletionFormSchema = z.object({
  email: z.string().trim().min(3).max(254),
  understand: z.literal("on"),
});

export type DeletionError = "auth" | "recent" | "secondFactor" | "mismatch" | "staff" | "retained" | "rate" | "invalid" | "generic";
/** Maps the database's refusal to a translated message key. Never exposes raw database text. */
export function mapDeletionError(e: { code?: string; message?: string } | null | undefined): DeletionError {
  const m = e?.message ?? "";
  switch (e?.code) {
    case "42501": return "auth";
    case "28000": return /second-factor/i.test(m) ? "secondFactor" : "recent";
    case "22023": return "mismatch";
    case "55000": return /review records/i.test(m) ? "retained" : "staff";
    default: return "generic";
  }
}
