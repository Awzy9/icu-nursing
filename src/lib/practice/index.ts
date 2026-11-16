import synthetic from "@icu/fixtures/practice.json";
import { practiceListSchema, type PracticeExercise } from "./types";

/**
 * Practical-education content source. Only synthetic, nonclinical exercises (SYN-PX-nnn) are ever served here.
 * The real practical drafts (content/drafts/practice) are never imported: the schema requires synthetic: true.
 */
export function listPractice(): PracticeExercise[] { return practiceListSchema.parse(synthetic); }
export function getPractice(code: string): PracticeExercise | null { return listPractice().find((e) => e.code === code) ?? null; }
