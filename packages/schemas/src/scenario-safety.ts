// Pilot educational safety review rubric, derived from existing authored case feedback.
// Not an independently clinically validated critical-error classification.
// Match the case, position AND exact option text, never the option index alone.
// Revised choices intentionally lose their flag until the rubric is reviewed.
export const scenarioSafetyRules = [
  { caseKey:"SC-10", position:1, text:"Wait and recheck the glucose at the next routine time.", category:"Delayed emergency response" },
  { caseKey:"SC-10", position:2, text:"Give food and drink by mouth to bring the patient round.", category:"Unsafe oral administration" },
  { caseKey:"SC-13", position:1, text:"Fetch the defibrillator first and start compressions when you return.", category:"Delayed resuscitation" },
  { caseKey:"SC-13", position:1, text:"Wait for a senior to arrive before doing anything.", category:"Delayed resuscitation" },
  { caseKey:"SC-13", position:2, text:"Stop compressions until the defibrillator has charged.", category:"Avoidable CPR interruption" },
  { caseKey:"SC-13", position:3, text:"Deliver the shock while a colleague continues manual compressions, wearing gloves.", category:"Defibrillation safety" },
  { caseKey:"SC-13", position:3, text:"Shout 'clear' once without looking around the bed.", category:"Defibrillation safety" },
  { caseKey:"SC-14", position:1, text:"Slow the transfusion and recheck in an hour.", category:"Continued suspected trigger" },
  { caseKey:"SC-14", position:1, text:"Give a medicine for the fever yourself and continue the transfusion.", category:"Continued suspected trigger" },
  { caseKey:"SC-19", position:1, text:"Slow the infusion and see whether the symptoms settle.", category:"Continued suspected trigger" },
  { caseKey:"SC-19", position:1, text:"Give an antihistamine from the ward stock and continue the infusion.", category:"Continued suspected trigger" },
  { caseKey:"SC-19", position:3, text:"Restart the antibiotic at a slower speed once the symptoms have gone.", category:"Suspected trigger re-exposure" },
] as const;

export function scenarioSafetyCategory(caseKey: string, position: number, option: { text: string; points: number } | undefined): string | undefined {
  if (!option || option.points !== 0) return undefined;
  return scenarioSafetyRules.find(rule => rule.caseKey === caseKey && rule.position === position && rule.text === option.text)?.category;
}
