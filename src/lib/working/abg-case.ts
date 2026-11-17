import abgCaseData from "../../../content/working-abg.json";
import type { AbgInput } from "./abg";

export interface AbgCase {
  key: string; title: [string, string]; vignette: string; gases: AbgInput; lessonHref: string;
  question: { prompt: string; options: string[]; answer: number; explanation: string };
  oxygenationNote: string | null;
  evidenceSources: string[];
}

const cases = abgCaseData as AbgCase[];
export function allAbgCases(): AbgCase[] { return cases; }
export function abgCase(key: string): AbgCase | undefined { return cases.find((c) => c.key === key); }
