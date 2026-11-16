import type { SearchHit } from "@/lib/search";

export const REFUSAL_KINDS = ["patient_specific", "dosing", "out_of_scope", "too_short"] as const;
export type RefusalKind = (typeof REFUSAL_KINDS)[number];

/**
 * The tutor's result for one question. There is no generative step: `hits` are citations to already-published
 * learning material (the same catalog `/search` already serves), never to an unpublished draft, and the answer
 * shown to the learner is composed from these citations plus fixed, translated template text - never freeform
 * text written by a model. `refused` means the question was not answered at all (no retrieval was even run).
 */
export interface TutorAnswer {
  query: string;
  refused: boolean;
  refusalKind?: RefusalKind;
  hits: SearchHit[];
}

export class TutorError extends Error {
  constructor(public code: "auth" | "limit" | "invalid" | "unavailable", message: string) {
    super(message);
  }
}
