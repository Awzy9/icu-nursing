// Typed read access to the SYNTHETIC nonclinical fixtures (packages/fixtures). Used ONLY by the
// automated test suite (tests/mobile/*.test.ts), to exercise the engine logic (case branching,
// question practice) against fixed, offline, deterministic data, matching the web app's own
// fixture-based tests. The shipped app screens read real content through core/remoteContent.ts
// instead (see docs/phase12/SHARED_SCHEMAS.md) - this module is never imported from app/.
import equipmentRaw from "@icu/fixtures/equipment.json";
import skillsRaw from "@icu/fixtures/skills.json";
import medicationsRaw from "@icu/fixtures/medications.json";
import casesRaw from "@icu/fixtures/cases.json";
import questionsRaw from "@icu/fixtures/questions.json";
import type { LocalizedText } from "./i18n";

type L = LocalizedText;
type LL = Record<string, string[]>;
export interface EquipmentModule { code: string; category: string; title: L; summary: L; diagram: { kind: "loop" | "signal" | "flow"; alt: L; parts: { id: string; label: L; detail: L }[] }; parameters: { key: string; name: L; meaning: L }[]; safety: LL; escalation: LL }
export interface Skill { code: string; category: string; title: L; summary: L; objectives: LL; sections: Record<string, LL>; checklist: { phase: string; text: L; critical: boolean }[] }
export interface Medication { code: string; category: string; highAlert: boolean; name: L; drugClass: L; summary: L; sections: Record<string, LL>; monitoring: { kind: string; text: L; critical: boolean }[] }
export interface CaseOption { text: L; points: number; next: number | null; scope: string; feedback: L; consequence?: L }
export interface CaseStep { info: L; prompt: L; observations?: { key: string; label: L; value: number | string; unit?: string }[]; options: CaseOption[] }
export interface CaseItem { code: string; domain: string; difficulty: number; title: L; vignette: L; steps: CaseStep[]; debrief?: { learning_points: LL; links: { kind: string; code: string }[] } }
export interface Question { code: string; domain: string; difficulty: number; stem: L; options: L[]; correct: number; explanations: L[]; rationale: L }

export const equipment = equipmentRaw as unknown as EquipmentModule[];
export const skills = skillsRaw as unknown as Skill[];
export const medications = medicationsRaw as unknown as Medication[];
export const cases = casesRaw as unknown as CaseItem[];
export const questions = questionsRaw as unknown as Question[];

export type Kind = "equipment" | "skill" | "medication" | "case";
export const findEquipment = (code: string) => equipment.find((x) => x.code === code);
export const findSkill = (code: string) => skills.find((x) => x.code === code);
export const findMedication = (code: string) => medications.find((x) => x.code === code);
export const findCase = (code: string) => cases.find((x) => x.code === code);
export const bookmarkKey = (kind: Kind, code: string) => `${kind}:${code}`;
