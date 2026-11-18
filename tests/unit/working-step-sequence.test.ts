import { describe, expect, it } from "vitest";
import { matchCount, isFullyOrdered, moveStep } from "@/lib/working/step-sequence";

describe("matchCount / isFullyOrdered", () => {
  it("counts every position as a match for the identity order, and is fully ordered", () => {
    expect(matchCount([0, 1, 2, 3])).toBe(4);
    expect(isFullyOrdered([0, 1, 2, 3])).toBe(true);
  });

  it("counts zero matches for a fully reversed order of length > 2, and is not fully ordered", () => {
    expect(matchCount([3, 2, 1, 0])).toBe(0);
    expect(isFullyOrdered([3, 2, 1, 0])).toBe(false);
  });

  it("counts partial matches correctly", () => {
    // positions 0 and 2 match (0 and 2), positions 1 and 3 do not (3 and 1 swapped)
    expect(matchCount([0, 3, 2, 1])).toBe(2);
    expect(isFullyOrdered([0, 3, 2, 1])).toBe(false);
  });

  it("treats an empty order as trivially fully ordered", () => {
    expect(matchCount([])).toBe(0);
    expect(isFullyOrdered([])).toBe(true);
  });
});

describe("moveStep", () => {
  it("swaps a step with its upward neighbour", () => {
    expect(moveStep([0, 1, 2], 1, -1)).toEqual([1, 0, 2]);
  });

  it("swaps a step with its downward neighbour", () => {
    expect(moveStep([0, 1, 2], 1, 1)).toEqual([0, 2, 1]);
  });

  it("is a no-op when moving the first item up or the last item down", () => {
    expect(moveStep([0, 1, 2], 0, -1)).toEqual([0, 1, 2]);
    expect(moveStep([0, 1, 2], 2, 1)).toEqual([0, 1, 2]);
  });

  it("never mutates the input array", () => {
    const input = [0, 1, 2];
    moveStep(input, 1, -1);
    expect(input).toEqual([0, 1, 2]);
  });
});
