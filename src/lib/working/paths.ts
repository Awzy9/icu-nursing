import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import { workingEntry } from "./index";

export interface PathDef {
  key: string;
  title: [string, string];
  audience: [string, string];
  objectives: [string, string][];
  estimatedMinutes: number;
  prerequisite?: string;
  steps: string[];
}

export interface ResolvedStep { key: string; type: string; title: string; href: string; questionCount?: number }
export interface ResolvedPath extends Omit<PathDef, "steps"> { steps: ResolvedStep[] }

// Path definitions (including module keys) live in content/, alongside working-catalog.json,
// not hardcoded in src/ - module keys stay data, never literal source code.
let defs: PathDef[] | undefined;
export function PATH_DEFS(): PathDef[] {
  defs ??= JSON.parse(readFileSync(path.join(process.cwd(), "content", "working-paths.json"), "utf8")) as PathDef[];
  return defs;
}

export function resolvePath(def: PathDef): ResolvedPath {
  const steps = def.steps.flatMap((key) => {
    const e = workingEntry(key);
    if (!e) return [];
    return [{ key: e.key, type: e.type, title: e.title, href: `/working/${e.key}`, questionCount: e.type === "questions" ? e.questionCount : undefined }];
  });
  return { ...def, steps };
}

export function resolveAllPaths(): ResolvedPath[] { return PATH_DEFS().map(resolvePath); }
export function findPath(key: string): ResolvedPath | undefined {
  const def = PATH_DEFS().find((p) => p.key === key);
  return def ? resolvePath(def) : undefined;
}
