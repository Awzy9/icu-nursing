// The single place the owner's support/privacy contact address is defined, so the privacy
// policy and terms pages (and any future store-listing copy) never hardcode it twice.
export const SUPPORT_EMAIL = "Fawwaz5381@gmail.com";

// The date these legal pages were last substantively edited. Bump this (not the render date)
// whenever Privacy/Terms copy actually changes.
export const LEGAL_LAST_UPDATED_ISO = "2026-11-19";
export const formatLegalDate = (locale: string): string => new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(new Date(LEGAL_LAST_UPDATED_ISO));
