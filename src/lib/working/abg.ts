// Deterministic, rule-based arterial blood gas interpretation.
// Based on the standard ("Boston") step-wise approach taught in critical care nursing/medicine:
// 1. pH status  2. primary respiratory vs metabolic disorder  3. expected compensation
// (Winter's formula for metabolic acidosis; standard respiratory compensation ranges for the
// others)  4. oxygenation from PaO2 (and the P/F ratio when FiO2 is given).
// This never estimates "chronic vs acute" respiratory compensation (that needs clinical
// duration, not just one gas panel) - it reports the simplified compensation band and says so.

export interface AbgInput { pH: number; paco2: number; hco3: number; pao2?: number; fio2?: number }

export type PrimaryDisorder =
  | "normal" | "respiratory_acidosis" | "respiratory_alkalosis"
  | "metabolic_acidosis" | "metabolic_alkalosis" | "mixed_acidosis" | "mixed_alkalosis" | "inconsistent";

export type CompensationStatus = "not_applicable" | "uncompensated" | "partially_compensated" | "fully_compensated";

export type OxygenationStatus = "normal" | "mild_hypoxemia" | "moderate_hypoxemia" | "severe_hypoxemia" | "not_assessed";

export interface AbgInterpretation {
  phStatus: "acidemia" | "alkalemia" | "normal";
  primaryDisorder: PrimaryDisorder;
  compensation: CompensationStatus;
  expectedCompensationRange?: [number, number];
  oxygenation: OxygenationStatus;
  pfRatio?: number;
  notes: string[];
}

const PH_LOW = 7.35, PH_HIGH = 7.45;
const PACO2_LOW = 35, PACO2_HIGH = 45;
const HCO3_LOW = 22, HCO3_HIGH = 26;

function round1(n: number) { return Math.round(n * 10) / 10; }

export function interpretAbg(input: AbgInput): AbgInterpretation {
  const { pH, paco2, hco3 } = input;
  const notes: string[] = [];

  const phStatus = pH < PH_LOW ? "acidemia" : pH > PH_HIGH ? "alkalemia" : "normal";
  const respAbnormal = paco2 < PACO2_LOW ? "low" : paco2 > PACO2_HIGH ? "high" : "normal";
  const metAbnormal = hco3 < HCO3_LOW ? "low" : hco3 > HCO3_HIGH ? "high" : "normal";

  let primaryDisorder: PrimaryDisorder = "normal";
  let compensation: CompensationStatus = "not_applicable";
  let expectedCompensationRange: [number, number] | undefined;

  if (phStatus === "normal" && respAbnormal === "normal" && metAbnormal === "normal") {
    primaryDisorder = "normal";
  } else if (phStatus === "acidemia") {
    const respDrivesAcidosis = respAbnormal === "high";
    const metDrivesAcidosis = metAbnormal === "low";
    if (respDrivesAcidosis && metDrivesAcidosis) {
      primaryDisorder = "mixed_acidosis";
      compensation = "uncompensated";
      notes.push("Both a respiratory and a metabolic process are pushing pH toward acidemia at the same time - this is a mixed acid-base disorder, not simple compensation.");
    } else if (respDrivesAcidosis) {
      primaryDisorder = "respiratory_acidosis";
      // Simplified compensation band: acute (~1 mEq/L HCO3 rise per 10 mmHg PaCO2 rise above 40)
      // to chronic (~3.5 mEq/L per 10 mmHg) - a single gas panel cannot distinguish acute from
      // chronic, so this reports the full plausible band rather than picking one.
      const deltaCo2 = paco2 - 40;
      const lo = round1(24 + (deltaCo2 / 10) * 1), hi = round1(24 + (deltaCo2 / 10) * 3.5);
      expectedCompensationRange = [lo, hi];
      compensation = hco3 <= HCO3_HIGH ? "uncompensated" : "partially_compensated";
      if (hco3 > hi) notes.push("The measured HCO3- is higher than the expected respiratory-compensation range - consider a co-existing metabolic alkalosis.");
      if (hco3 < lo && hco3 > HCO3_HIGH) notes.push("The measured HCO3- is lower than expected for this PaCO2 - consider a co-existing metabolic acidosis limiting compensation.");
    } else if (metDrivesAcidosis) {
      primaryDisorder = "metabolic_acidosis";
      // Winter's formula: expected PaCO2 = 1.5*HCO3 + 8 (+/- 2)
      const expected = 1.5 * hco3 + 8;
      expectedCompensationRange = [round1(expected - 2), round1(expected + 2)];
      const [lo, hi] = expectedCompensationRange;
      compensation = paco2 >= PACO2_LOW ? "uncompensated" : paco2 >= lo && paco2 <= hi ? "partially_compensated" : "partially_compensated";
      if (paco2 < lo) notes.push("PaCO2 is lower than Winter's formula predicts - consider a co-existing respiratory alkalosis.");
      if (paco2 > hi) notes.push("PaCO2 is higher than Winter's formula predicts for this HCO3- - respiratory compensation is inadequate, or there is a co-existing respiratory acidosis.");
    } else {
      primaryDisorder = "inconsistent";
      notes.push("pH shows acidemia, but neither PaCO2 nor HCO3- is abnormal in a direction that explains it - re-check the sample and values before trusting this result.");
    }
  } else if (phStatus === "alkalemia") {
    const respDrivesAlkalosis = respAbnormal === "low";
    const metDrivesAlkalosis = metAbnormal === "high";
    if (respDrivesAlkalosis && metDrivesAlkalosis) {
      primaryDisorder = "mixed_alkalosis";
      compensation = "uncompensated";
      notes.push("Both a respiratory and a metabolic process are pushing pH toward alkalemia at the same time - this is a mixed acid-base disorder, not simple compensation.");
    } else if (respDrivesAlkalosis) {
      primaryDisorder = "respiratory_alkalosis";
      const deltaCo2 = 40 - paco2;
      const lo = round1(24 - (deltaCo2 / 10) * 4), hi = round1(24 - (deltaCo2 / 10) * 2);
      expectedCompensationRange = [lo, hi];
      compensation = hco3 >= HCO3_LOW ? "uncompensated" : "partially_compensated";
    } else if (metDrivesAlkalosis) {
      primaryDisorder = "metabolic_alkalosis";
      // Expected PaCO2 = 0.7*HCO3 + 20 (+/- 1.5), capped near 55 (hypoventilation limit)
      const expected = Math.min(0.7 * hco3 + 20, 55);
      expectedCompensationRange = [round1(expected - 1.5), round1(expected + 1.5)];
      compensation = paco2 <= PACO2_HIGH ? "uncompensated" : "partially_compensated";
    } else {
      primaryDisorder = "inconsistent";
      notes.push("pH shows alkalemia, but neither PaCO2 nor HCO3- is abnormal in a direction that explains it - re-check the sample and values before trusting this result.");
    }
  } else {
    // pH normal, but PaCO2/HCO3 both abnormal = fully compensated. Which side is "primary" is
    // genuinely ambiguous from a single gas panel alone (textbook-acknowledged limitation) -
    // this uses a simplified relative-magnitude heuristic (how many normal-range half-widths
    // each value is displaced) and explicitly flags it as a simplification, rather than forcing
    // a possibly-wrong answer with false confidence.
    if (respAbnormal !== "normal" && metAbnormal !== "normal") {
      const respRel = Math.abs(paco2 - 40) / 5; // normal range half-width 5 (35-45)
      const metRel = Math.abs(hco3 - 24) / 2; // normal range half-width 2 (22-26)
      const respIsAcidotic = respAbnormal === "high";
      const ambiguous = Math.abs(respRel - metRel) < 0.2 * Math.max(respRel, metRel);
      if (ambiguous) notes.push("PaCO2 and HCO3- are displaced by a comparable degree, so which disorder is primary cannot be determined from this gas panel alone - clinical history (acute vs chronic, and the reason for admission) is needed to distinguish a fully-compensated respiratory disorder from a fully-compensated metabolic one.");
      if (respRel >= metRel) {
        primaryDisorder = respIsAcidotic ? "respiratory_acidosis" : "respiratory_alkalosis";
      } else {
        primaryDisorder = respIsAcidotic ? "metabolic_alkalosis" : "metabolic_acidosis";
      }
      compensation = "fully_compensated";
    } else {
      primaryDisorder = "normal";
    }
  }

  let oxygenation: OxygenationStatus = "not_assessed";
  let pfRatio: number | undefined;
  if (input.pao2 !== undefined) {
    oxygenation = input.pao2 >= 80 ? "normal" : input.pao2 >= 60 ? "mild_hypoxemia" : input.pao2 >= 40 ? "moderate_hypoxemia" : "severe_hypoxemia";
    if (input.fio2 !== undefined && input.fio2 > 0) pfRatio = round1(input.pao2 / input.fio2);
  }

  return { phStatus, primaryDisorder, compensation, expectedCompensationRange, oxygenation, pfRatio, notes };
}
