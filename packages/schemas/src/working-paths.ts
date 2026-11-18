import { z } from "zod";

// Mirrors src/lib/working/paths.ts's PathDef/ResolvedStep/ResolvedPath - guided learning paths
// that group related catalog entries into a suggested order. Title/audience/objectives are kept
// as the website's own [en, ar] tuples (content/working-paths.json's own shape), rather than
// converted to the LocalizedText object other working-content schemas use, so this stays a
// faithful mirror of the source file native clients read from.

export const localizedPairSchema = z.tuple([z.string(), z.string()]);

export const resolvedStepSchema = z.object({
  key: z.string(),
  type: z.string(),
  title: z.string(),
  href: z.string(),
  questionCount: z.number().int().optional(),
});
export type ResolvedStepShared = z.infer<typeof resolvedStepSchema>;

export const resolvedPathSchema = z.object({
  key: z.string(),
  title: localizedPairSchema,
  audience: localizedPairSchema,
  objectives: z.array(localizedPairSchema),
  estimatedMinutes: z.number().int(),
  prerequisite: z.string().optional(),
  steps: z.array(resolvedStepSchema),
});
export type ResolvedPathShared = z.infer<typeof resolvedPathSchema>;

export const pathsResponseSchema = z.object({ version: z.string(), paths: z.array(resolvedPathSchema) });
export type PathsResponse = z.infer<typeof pathsResponseSchema>;
