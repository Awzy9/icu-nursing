import abgCaseData from "../../../content/working-abg.json";

interface AbgPanel { pH: number; paco2: number; hco3: number; pao2?: number; fio2?: number }

export interface AbgCase {
  key: string; title: [string, string]; vignette: string; gases: AbgPanel; lessonHref: string;
  question: { prompt: string; options: string[]; answer: number; explanation: string };
  oxygenationNote: string | null;
  evidenceSources: string[];
}

const cases = abgCaseData as AbgCase[];
export function allAbgCases(): AbgCase[] { return cases; }
export function abgCase(key: string): AbgCase | undefined { return cases.find((c) => c.key === key); }
