import transfusionData from "../../../content/working-transfusion.json";

export interface TransfusionExercise {
  key: string; title: [string, string]; vignette: string;
  question: { prompt: string; options: string[]; answer: number; explanation: string };
}

const exercises = transfusionData as TransfusionExercise[];
export function allTransfusionExercises(): TransfusionExercise[] { return exercises; }
export function transfusionExercise(key: string): TransfusionExercise | undefined { return exercises.find((e) => e.key === key); }
