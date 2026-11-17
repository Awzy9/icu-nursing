import "server-only";
import { workingContent } from "./index";
import type { RevisionQuestion } from "./revision";

let cache: RevisionQuestion[] | undefined;
export function allRevisionQuestions(): RevisionQuestion[] {
  cache ??= workingContent().filter((e) => e.type === "questions").flatMap((e) =>
    (e.questions ?? []).map((q) => ({ id: q.id, prompt: q.prompt, options: q.options, answer: q.answer, explanation: q.explanation, moduleKey: e.key, moduleTitle: e.title, moduleHref: `/working/${e.key}` })),
  );
  return cache;
}
