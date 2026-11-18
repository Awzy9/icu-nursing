import defibData from "../../../content/working-defib.json";
import { ecgExercise } from "./ecg";
import type { WaveformTrace } from "./waveform";

export interface DefibExercise {
  key: string; title: [string, string]; vignette: string; traceKey: string;
  question: { prompt: string; options: string[]; answer: number; explanation: string };
}

const exercises = defibData as DefibExercise[];
export function allDefibExercises(): DefibExercise[] { return exercises; }
export function defibExercise(key: string): DefibExercise | undefined { return exercises.find((e) => e.key === key); }

// Reuses the trace data already authored for the ECG rhythm lab - never duplicated.
export function defibTrace(exercise: DefibExercise): WaveformTrace {
  const ecg = ecgExercise(exercise.traceKey);
  if (!ecg) throw new Error(`defib exercise ${exercise.key} references unknown ECG trace ${exercise.traceKey}`);
  return ecg.trace;
}
