import type { RefusalKind } from "./types";

/**
 * Best-effort detection of a question the tutor must refuse outright, before any retrieval runs. This is a safety
 * net on top of the real structural guarantee (see src/lib/tutor/index.ts): the tutor has no generative step, so
 * even an undetected patient-specific question can only ever get back citations to published general-education
 * material, never a fabricated personal recommendation. These patterns exist so the learner gets an honest refusal
 * message instead of a list of citations that do not actually answer what they asked.
 *
 * Deliberately conservative (biased toward refusing): a false refusal costs the learner a rephrase; a missed
 * refusal risks implying the tutor gave patient-specific advice it never gave.
 */
const PATIENT_SPECIFIC = [
  /\bmy (patient|pt\.?)\b/i,
  /\bthis patient\b/i,
  /\b(a |the )?patient (i('| a)m|is) (caring for|looking after|currently)\b/i,
  /\bshould i (give|administer|titrate|increase|decrease|stop|hold)\b/i,
  /\bcan i (give|administer)\b/i,
  /\bis it safe to give\b/i,
  /\bwhat should i (do|give|chart) for (my|this|a) patient\b/i,
];

const DOSING = [
  /\bwhat dose\b/i,
  /\bhow much\b.*\b(mg|mcg|ug|g|kg|units?|iu|meq|mmol|ml|dl)\b/i,
  /\b(mg|mcg|ug|ml)\s*\/\s*(kg|hr|hour|min)\b/i,
  /\bdose (for|of) a \d/i,
  /\btitrat(e|ion)\b.*\bto\b/i,
];

const OUT_OF_SCOPE = [
  /\bdiagnos(e|is|ing)\b/i,
  /\bprescrib(e|ing)\b/i,
  /\b(write|give) me a prescription\b/i,
  /\bwhat('s| is) wrong with (me|him|her|them)\b/i,
  /\bam i having a\b/i,
];

function matchesAny(patterns: RegExp[], q: string): boolean {
  return patterns.some((p) => p.test(q));
}

/** Returns the refusal reason, or undefined if the question may proceed to retrieval. */
export function detectRefusal(query: string): RefusalKind | undefined {
  if (query.length < 2) return "too_short";
  if (matchesAny(PATIENT_SPECIFIC, query)) return "patient_specific";
  if (matchesAny(DOSING, query)) return "dosing";
  if (matchesAny(OUT_OF_SCOPE, query)) return "out_of_scope";
  return undefined;
}
