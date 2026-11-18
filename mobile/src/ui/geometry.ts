// Pure geometry helpers for native SVG overlays. No React Native imports, so it is unit tested
// from the repository root like the rest of core/*.
export function scalePoints(points: string, width: number, height: number): string {
  return points.split(" ").map((pair) => {
    const [x, y] = pair.split(",").map(Number);
    return `${((x ?? 0) / 100) * width},${((y ?? 0) / 100) * height}`;
  }).join(" ");
}
