/**
 * Locale-aware display formatting.
 *
 * Clinical documentation must be unambiguous across countries, so dates and numbers shown in
 * clinical contexts use the Gregorian calendar and Latin (0-9) digits in every locale.
 */
const LATN = { numberingSystem: "latn", calendar: "gregory" } as const;

export function formatDate(value: string | number | Date, locale: string): string {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC", ...LATN }).format(d);
}

export function formatDateTime(value: string | number | Date, locale: string, timeZone = "UTC"): string {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone, ...LATN }).format(d);
}

export function formatNumber(value: number, locale: string, options: Intl.NumberFormatOptions = {}): string {
  return new Intl.NumberFormat(locale, { numberingSystem: "latn", ...options }).format(value);
}

export function formatMinutes(minutes: number, locale: string): string {
  return new Intl.NumberFormat(locale, { style: "unit", unit: "minute", unitDisplay: "short", numberingSystem: "latn" }).format(minutes);
}
