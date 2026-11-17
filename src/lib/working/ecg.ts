import ecgData from "../../../content/working-ecg.json";
import type { WaveformTrace } from "./waveform";

export interface EcgExercise {
  key: string; title: [string, string]; objective: [string, string]; lessonHref: string;
  accessibleDescription: string[]; trace: WaveformTrace;
  question: { prompt: string; options: string[]; answer: number; explanation: string };
  evidenceSources: string[];
}

const exercises = ecgData as EcgExercise[];
export function allEcgExercises(): EcgExercise[] { return exercises; }
export function ecgExercise(key: string): EcgExercise | undefined { return exercises.find((e) => e.key === key); }
