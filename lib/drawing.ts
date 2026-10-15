import { getStroke } from "perfect-freehand";

export type Point = number[];
export type Stroke = Point[];

export const CANVAS_SIZE = 320;

export const STROKE_OPTIONS = {
  size: 8,
  thinning: 0.5,
  smoothing: 0.5,
  streamline: 0.5,
} as const;

/** Convert perfect-freehand outline points to an SVG path `d` string. */
export function getSvgPathFromStroke(points: number[][]): string {
  if (!points.length) return "";
  let d = "";
  for (let i = 0; i < points.length; i++) {
    const [x, y] = points[i];
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    d += i === 0 || !d ? `M ${x.toFixed(2)} ${y.toFixed(2)}` : ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  return d ? `${d} Z` : "";
}

/** Map client pointer coords into canvas logical space. Returns null if rect is invalid. */
export function pointerToCanvasPoint(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
  size = CANVAS_SIZE,
  pressure = 0.5
): Point | null {
  if (!rect.width || !rect.height) return null;
  const x = ((clientX - rect.left) / rect.width) * size;
  const y = ((clientY - rect.top) / rect.height) * size;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return [x, y, Number.isFinite(pressure) && pressure > 0 ? pressure : 0.5];
}

/** Build a filled outline path for a stroke, or empty string if not drawable. */
export function strokeOutlinePath(points: Point[]): string {
  if (!points.length) return "";
  const valid = points.filter(
    (p) => Number.isFinite(p[0]) && Number.isFinite(p[1])
  );
  if (!valid.length) return "";
  const outline = getStroke(valid, STROKE_OPTIONS);
  return getSvgPathFromStroke(outline);
}

export function appendPoint(stroke: Point[] | null, point: Point): Point[] {
  return [...(stroke ?? []), point];
}

export function commitStroke(strokes: Stroke[], live: Point[] | null): Stroke[] {
  if (!live?.length) return strokes;
  return [...strokes, live];
}

export function undoStroke(strokes: Stroke[]): Stroke[] {
  return strokes.slice(0, -1);
}
