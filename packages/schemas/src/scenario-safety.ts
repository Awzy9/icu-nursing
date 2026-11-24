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
  { caseKey:"SC-01", position:1, text:"Repeat the observations in an hour and see whether the score changes.", category:"Delayed escalation" },
  { caseKey:"SC-01", position:2, text:"Disconnect the infusion briefly to flush the line when it seems slow.", category:"Vasopressor delivery safety" },
  { caseKey:"SC-01", position:3, text:"Slow the infusion and recheck in an hour.", category:"Suspected extravasation" },
  { caseKey:"SC-01", position:3, text:"Massage the area to disperse the drug.", category:"Suspected extravasation" },
  { caseKey:"SC-02", position:1, text:"Write the readings in the chart and recheck at the usual time.", category:"Delayed shock escalation" },
  { caseKey:"SC-02", position:1, text:"Turn up the inotrope infusion yourself to bring the pressure back.", category:"Unauthorized infusion change" },
  { caseKey:"SC-02", position:2, text:"Silence the alarm because the beats are probably movement artefact.", category:"Unassessed unstable rhythm" },
  { caseKey:"SC-03", position:1, text:"Leave things as they are because the saturation is near the target.", category:"Unassessed respiratory deterioration" },
  { caseKey:"SC-03", position:2, text:"Wait for one more set of observations first.", category:"Delayed escalation" },
  { caseKey:"SC-04", position:1, text:"Silence the alarm and finish the task you were doing.", category:"Unresolved ventilator alarm" },
  { caseKey:"SC-04", position:1, text:"Widen the alarm limits so the alarm stops.", category:"Alarm-limit safety" },
  { caseKey:"SC-04", position:2, text:"Keep troubleshooting the machine on your own.", category:"Delayed ventilation rescue" },
  { caseKey:"SC-04", position:2, text:"Change the ventilator mode yourself to see if the patient improves.", category:"Unauthorized ventilator change" },
  { caseKey:"SC-05", position:1, text:"Reposition the probe and leave to see whether the number improves.", category:"Unassessed hypoxaemia" },
  { caseKey:"SC-05", position:1, text:"Silence the alarm because the patient is talking and probably fine.", category:"Unassessed hypoxaemia" },
  { caseKey:"SC-05", position:2, text:"Suction repeatedly until the saturation reaches its usual level.", category:"Suction safety" },
  { caseKey:"SC-05", position:3, text:"Reset the alarm limits so the alarm stops sounding while the team treats the patient.", category:"Alarm-limit safety" },
  { caseKey:"SC-06", position:1, text:"Push the tube back in to where it was.", category:"Airway device manipulation" },
  { caseKey:"SC-06", position:1, text:"Leave the bedside to find a doctor.", category:"Interrupted airway support" },
  { caseKey:"SC-06", position:2, text:"Try to reintubate the patient yourself.", category:"Unauthorized airway procedure" },
  { caseKey:"SC-06", position:2, text:"Switch off the monitor to reduce the alarms and concentrate.", category:"Interrupted emergency monitoring" },
  { caseKey:"SC-07", position:1, text:"Check the blood pressure again and leave the patient to rest.", category:"Delayed neurological escalation" },
  { caseKey:"SC-07", position:1, text:"Give a prescribed as-needed sedative so the patient can settle, and plan to review later.", category:"Masked neurological deterioration" },
  { caseKey:"SC-07", position:3, text:"Give the extra sedative to keep the patient quiet and note that you did so.", category:"Unauthorized sedation" },
] as const;

export function scenarioSafetyCategory(caseKey: string, position: number, option: { text: string; points: number } | undefined): string | undefined {
  if (!option || option.points !== 0) return undefined;
  return scenarioSafetyRules.find(rule => rule.caseKey === caseKey && rule.position === position && rule.text === option.text)?.category;
}
