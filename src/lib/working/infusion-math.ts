// Pure, independently-tested infusion-rate arithmetic for weight-based (mcg/kg/min) and
// non-weight-based (mg/hr) continuous IV infusions - the standard dosage-calculation formulas
// taught in nursing pharmacology. This is a PRACTICE-PROBLEM engine only: it never accepts a
// free-form "patient's actual dose" input from a user and presents a computed rate back as
// something to administer. Every number it produces here is checked against a closed set of
// multiple-choice options in a practice exercise, never offered as a standalone bedside tool.

export interface WeightBasedOrder {
  kind: "mcg/kg/min";
  doseOrdered: number; // mcg/kg/min
  weightKg: number;
  concentrationMcgPerMl: number; // mcg per mL of the prepared infusion
}

export interface SimpleOrder {
  kind: "mg/hr";
  doseOrdered: number; // mg/hr
  concentrationMgPerMl: number; // mg per mL of the prepared infusion
}

export type InfusionOrder = WeightBasedOrder | SimpleOrder;

export function infusionRateMlPerHour(order: InfusionOrder): number {
  if (order.kind === "mcg/kg/min") {
    const { doseOrdered, weightKg, concentrationMcgPerMl } = order;
    return (doseOrdered * weightKg * 60) / concentrationMcgPerMl;
  }
  return order.doseOrdered / order.concentrationMgPerMl;
}

export function round1(n: number): number { return Math.round(n * 10) / 10; }
