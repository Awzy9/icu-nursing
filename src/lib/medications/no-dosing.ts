/** Mirrors private.medication_text_violation() in migration 0013. The library never stores dose, concentration, infusion-rate, titration or compatibility content. */
const quantity = /\b\d+([.,]\d+)?\s*(mcg|µg|ug|mg|g|kg|units?|iu|meq|mmol|mol|ml|dl)\b/i;
const percent = /\d\s*%/;
const rate = /(mcg|mg|g|units?|meq|mmol|ml)\s*(\/|per)\s*(kg|ml|l|min|h|hr|hour|minute|day|dl)/i;
const words = /(y-site|compatib|incompatib|diluent|dilute|dilution|reconstitut|loading dose|maintenance dose|infusion rate|titrat|bolus dose|mix with|syringe driver setting)/i;

export function medicationTextViolation(text: string): string | null {
  if (quantity.test(text) || percent.test(text)) return "a numeric quantity with a unit (dose, concentration or rate)";
  if (rate.test(text)) return "a dose or rate expression";
  if (words.test(text)) return "dosing, titration, preparation or compatibility wording";
  return null;
}
