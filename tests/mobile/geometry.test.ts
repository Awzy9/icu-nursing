import { describe, expect, it } from "vitest";
import { scalePoints } from "../../mobile/src/ui/geometry";

describe("scalePoints (central-line privacy cover)", () => {
  it("scales a percentage-based point string to pixel coordinates for the rendered image size", () => {
    expect(scalePoints("0,0 100,100", 200, 400)).toBe("0,0 200,400");
    expect(scalePoints("50,25", 200, 400)).toBe("100,100");
  });
});
