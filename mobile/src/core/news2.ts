// Pure NEWS2 (National Early Warning Score 2) scoring, mirroring src/lib/working/news2.ts
// exactly (same thresholds, same formulas - the Royal College of Physicians' standardised
// aggregate scoring system, Chart 1/2 of the RCP 2017 NEWS2 report, which states there is no
// copyright restriction on the content; this does not reproduce RCP's own graphic chart).
// NEWS2 is an aid to clinical assessment, not a substitute for judgement.
import { z } from "zod";

export type News2Scale = "1" | "2";
export type News2Consciousness = "alert" | "cvpu";

export interface News2Input {
  respiratoryRate: number;
  spo2: number;
  scale: News2Scale;
  onOxygen: boolean;
  systolicBp: number;
  pulse: number;
  consciousness: News2Consciousness;
  temperature: number;
}

export interface News2Scores { respiration: number; spo2: number; oxygen: number; bp: number; pulse: number; consciousness: number; temperature: number }

export function respirationScore(rr: number): number {
  if (rr <= 8) return 3;
  if (rr <= 11) return 1;
  if (rr <= 20) return 0;
  if (rr <= 24) return 2;
  return 3;
}
export function spo2Scale1Score(spo2: number): number {
  if (spo2 <= 91) return 3;
  if (spo2 <= 93) return 2;
  if (spo2 <= 95) return 1;
  return 0;
}
export function spo2Scale2Score(spo2: number, onOxygen: boolean): number {
  if (spo2 <= 83) return 3;
  if (spo2 <= 85) return 2;
  if (spo2 <= 87) return 1;
  if (spo2 <= 92) return 0;
  if (!onOxygen) return 0;
  if (spo2 <= 94) return 1;
  if (spo2 <= 96) return 2;
  return 3;
}
export const oxygenScore = (onOxygen: boolean): number => (onOxygen ? 2 : 0);
export function bpScore(sbp: number): number {
  if (sbp <= 90) return 3;
  if (sbp <= 100) return 2;
  if (sbp <= 110) return 1;
  if (sbp <= 219) return 0;
  return 3;
}
export function pulseScore(hr: number): number {
  if (hr <= 40) return 3;
  if (hr <= 50) return 1;
  if (hr <= 90) return 0;
  if (hr <= 110) return 1;
  if (hr <= 130) return 2;
  return 3;
}
export const consciousnessScore = (c: News2Consciousness): number => (c === "alert" ? 0 : 3);
export function temperatureScore(t: number): number {
  if (t <= 35.0) return 3;
  if (t <= 36.0) return 1;
  if (t <= 38.0) return 0;
  if (t <= 39.0) return 1;
  return 2;
}

export function news2Scores(input: News2Input): News2Scores {
  return {
    respiration: respirationScore(input.respiratoryRate),
    spo2: input.scale === "1" ? spo2Scale1Score(input.spo2) : spo2Scale2Score(input.spo2, input.onOxygen),
    oxygen: oxygenScore(input.onOxygen),
    bp: bpScore(input.systolicBp),
    pulse: pulseScore(input.pulse),
    consciousness: consciousnessScore(input.consciousness),
    temperature: temperatureScore(input.temperature),
  };
}
export function news2Total(input: News2Input): number {
  const s = news2Scores(input);
  return s.respiration + s.spo2 + s.oxygen + s.bp + s.pulse + s.consciousness + s.temperature;
}
export function hasSingleRedScore(input: News2Input): boolean {
  const s = news2Scores(input);
  return [s.respiration, s.spo2, s.bp, s.pulse, s.consciousness, s.temperature].some((v) => v === 3);
}
export type News2Band = "low" | "low-medium" | "medium" | "high";
export function news2Band(total: number, singleRed: boolean): News2Band {
  if (total >= 7) return "high";
  if (total >= 5) return "medium";
  if (singleRed) return "low-medium";
  return "low";
}

// content/working-news2-cases.json's shape, served via the existing /api/content/labs/news2-cases
// endpoint (labDatasetResponseSchema already validates "a non-empty array of records" at that
// layer; this is the specific shape this screen parses client-side, same precedent as the
// website's own lib/working/* loaders).
export const news2CaseSchema = z.object({
  key: z.string(),
  vignette: z.string(),
  scale: z.enum(["1", "2"]),
  respiratoryRate: z.number(),
  spo2: z.number(),
  onOxygen: z.boolean(),
  systolicBp: z.number(),
  pulse: z.number(),
  consciousness: z.enum(["alert", "cvpu"]),
  temperature: z.number(),
  options: z.array(z.string()),
  answer: z.number().int(),
  explanation: z.string(),
});
export type News2Case = z.infer<typeof news2CaseSchema>;

export const news2CaseTotal = (c: News2Case): number => news2Total(c);
export const news2CaseBand = (c: News2Case): News2Band => news2Band(news2CaseTotal(c), hasSingleRedScore(c));
