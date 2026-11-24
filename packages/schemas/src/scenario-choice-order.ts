// Display order only: always retain authored indices for scoring and stored decisions.
// A stable key and checkpoint produce identical permutations on web and native,
// including after refresh/resume. This is educational variety, not secure randomization.
export function scenarioChoiceOrder(caseKey: string, position: number, count: number): number[] {
  if (!Number.isSafeInteger(count) || count < 0 || count > 100) return [];
  const indices = Array.from({ length: count }, (_, i) => i);
  const key = JSON.stringify([caseKey, position]);
  let state = 2166136261;
  for (let i = 0; i < key.length; i++) state = Math.imul(state ^ key.charCodeAt(i), 16777619);
  // Mix adjacent keys and use an unsigned 32-bit generator.
  state = (state ^ (state >>> 16)) >>> 0;
  for (let i = indices.length - 1; i > 0; i--) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const j = Math.floor((state / 4294967296) * (i + 1));
    [indices[i], indices[j]] = [indices[j]!, indices[i]!];
  }
  return indices;
}
