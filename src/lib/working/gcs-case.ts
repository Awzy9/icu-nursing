import gcsCaseData from "../../../content/working-gcs-cases.json";

export interface GcsCase {
  key: string; vignette: string; correctEye: number; correctVerbal: number; correctMotor: number; explanation: string;
}

const cases = gcsCaseData as GcsCase[];
export function allGcsCases(): GcsCase[] { return cases; }
export function gcsCase(key: string): GcsCase | undefined { return cases.find((c) => c.key === key); }
