import infusionCaseData from "../../../content/working-infusion-cases.json";
import type { InfusionOrder } from "./infusion-math";

export interface InfusionCase {
  key: string; drugRef: string; vignette: string; order: InfusionOrder;
  options: number[]; answerIndex: number; explanation: string;
}

const cases = infusionCaseData as InfusionCase[];
export function allInfusionCases(): InfusionCase[] { return cases; }
export function infusionCase(key: string): InfusionCase | undefined { return cases.find((c) => c.key === key); }
