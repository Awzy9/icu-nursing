import crrtData from "../../../content/working-crrt.json";

export interface CrrtComponent {
  key: string; label: [string, string]; description: [string, string]; alarms: [string, string] | [];
}

export interface CrrtAlarmExercise {
  key: string; title: [string, string]; vignette: string; componentKey: string;
  question: { prompt: string; options: string[]; answer: number; explanation: string };
}

const data = crrtData as { components: CrrtComponent[]; alarms: CrrtAlarmExercise[] };

export function allCrrtComponents(): CrrtComponent[] { return data.components; }
export function crrtComponent(key: string): CrrtComponent | undefined { return data.components.find((c) => c.key === key); }
export function allCrrtAlarms(): CrrtAlarmExercise[] { return data.alarms; }
export function crrtAlarm(key: string): CrrtAlarmExercise | undefined { return data.alarms.find((a) => a.key === key); }
