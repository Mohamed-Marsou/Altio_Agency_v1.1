// =============================================================================
// CHART HELPERS
// -----------------------------------------------------------------------------
// Pure maths that turns a list of numbers into SVG drawing instructions. No
// React in here, so it is easy to test and reuse.
// =============================================================================

// The chart is drawn in a 640 x 300 "virtual" canvas (the SVG scales it to any
// real size). PLOT is the inner rectangle where the lines live; the rest is
// breathing room for labels.
export const CHART_WIDTH = 640;
export const CHART_HEIGHT = 300;
export const PLOT = { left: 44, right: 520, top: 14, bottom: 262 };

export type Point = { x: number; y: number };

// Value 0-100 at position `index` of `count` points  ->  a point on the canvas.
export function toPoint(value: number, index: number, count: number): Point {
  const width = PLOT.right - PLOT.left;
  const height = PLOT.bottom - PLOT.top;
  return {
    x: PLOT.left + (index * width) / (count - 1),
    y: PLOT.bottom - (value / 100) * height,
  };
}

// A list of values -> a list of points.
export function toPoints(values: number[]): Point[] {
  return values.map((value, index) => toPoint(value, index, values.length));
}

// Points -> a smooth SVG path ("Catmull-Rom" curve converted to Bezier curves).
// Each segment is bent using its neighbours so the line flows without corners.
export function smoothPath(points: Point[]): string {
  let path = `M${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const before = points[i - 1] ?? points[i];
    const from = points[i];
    const to = points[i + 1];
    const after = points[i + 2] ?? to;
    const c1x = from.x + (to.x - before.x) / 6;
    const c1y = from.y + (to.y - before.y) / 6;
    const c2x = to.x - (after.x - from.x) / 6;
    const c2y = to.y - (after.y - from.y) / 6;
    path += ` C${c1x} ${c1y} ${c2x} ${c2y} ${to.x} ${to.y}`;
  }
  return path;
}

// Same curve, closed down to the baseline: used for the soft area fill.
export function areaPath(points: Point[]): string {
  const last = points[points.length - 1];
  const first = points[0];
  return `${smoothPath(points)} L${last.x} ${PLOT.bottom} L${first.x} ${PLOT.bottom} Z`;
}

// Canvas coordinates -> CSS percentages, to place HTML labels exactly over the
// SVG (the wrapper keeps the same aspect ratio as the canvas).
export function toPercent(point: Point): { left: string; top: string } {
  return {
    left: `${(point.x / CHART_WIDTH) * 100}%`,
    top: `${(point.y / CHART_HEIGHT) * 100}%`,
  };
}
