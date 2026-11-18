import alineData from "../../../content/working-aline.json";
import type { WaveformTrace } from "./waveform";

export interface AlineExercise {
  key: string; title: [string, string]; objective: [string, string]; lessonHref: string;
  accessibleDescription: [string, string]; trace: WaveformTrace;
  question: { prompt: string; options: string[]; answer: number; explanation: string };
  evidenceSources: string[];
}

const exercises = alineData as AlineExercise[];
export function allAlineExercises(): AlineExercise[] { return exercises; }
export function alineExercise(key: string): AlineExercise | undefined { return exercises.find((e) => e.key === key); }
