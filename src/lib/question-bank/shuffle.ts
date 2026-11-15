import { createHash } from "node:crypto";

/**
 * Deterministic seeded ordering. The SAME algorithm runs in PostgreSQL (qb_start_attempt):
 *   order by md5(seed || scope || id) collate "C"
 * so an attempt's question order and option order are reproducible from its stored seed, and a database test compares
 * both implementations. Shuffling permutes option IDs only; the answer key refers to an option ID, so it can never change.
 */
export const seededKey = (seed: string, scope: string, id: string) => createHash("md5").update(`${seed}${scope}${id}`).digest("hex");

export function seededOrder(ids: readonly string[], seed: string, scope = ""): string[] {
  return [...ids]
    .map((id) => ({ id, k: seededKey(seed, scope, id) }))
    .sort((a, b) => (a.k < b.k ? -1 : a.k > b.k ? 1 : a.id < b.id ? -1 : 1))
    .map((x) => x.id);
}

export function newSeed(): string {
  return createHash("md5").update(`${Math.random()}${Date.now()}${Math.random()}`).digest("hex").slice(0, 16);
}
