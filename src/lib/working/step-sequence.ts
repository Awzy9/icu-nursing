// Pure scoring helpers for a step-ordering exercise: the learner arranges a shuffled list of
// steps (given as original-position indices) back into the correct sequence.

export function matchCount(order: readonly number[]): number {
  return order.reduce((n, originalIndex, position) => n + (originalIndex === position ? 1 : 0), 0);
}

export function isFullyOrdered(order: readonly number[]): boolean {
  return matchCount(order) === order.length;
}

// Swaps the item at `index` with its neighbour in `direction` (-1 = up, +1 = down), returning a
// new array; a swap past either end is a no-op (returns the same array unchanged).
export function moveStep(order: readonly number[], index: number, direction: -1 | 1): number[] {
  const target = index + direction;
  if (target < 0 || target >= order.length) return [...order];
  const next = [...order];
  [next[index], next[target]] = [next[target]!, next[index]!];
  return next;
}
