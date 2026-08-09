// MapLibre fill-pattern images are raw pixel data, not CSS — they can't reference
// theme variables, so this uses a fixed neutral-gray stroke. That's consistent with
// the quadrant fill colors in MapView.tsx, which are also fixed hex values for the
// same reason (paint expressions run outside the DOM/CSS cascade).
export const HATCH_PATTERN_ID = "out-of-scope-hatch";

export function buildHatchPatternImage(): ImageData {
  const size = 10;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  ctx.strokeStyle = "rgba(120, 118, 112, 0.55)";
  ctx.lineWidth = 1.4;
  // A single diagonal plus its two wrap-around fragments so the tile repeats seamlessly.
  const segments: Array<[number, number, number, number]> = [
    [0, size, size, 0],
    [-1, 1, 1, -1],
    [size - 1, size + 1, size + 1, size - 1],
  ];
  for (const [x1, y1, x2, y2] of segments) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  return ctx.getImageData(0, 0, size, size);
}
