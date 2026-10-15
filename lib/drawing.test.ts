import { describe, expect, it } from "vitest";
import {
  appendPoint,
  commitStroke,
  getSvgPathFromStroke,
  pointerToCanvasPoint,
  strokeOutlinePath,
  undoStroke,
} from "./drawing";

describe("pointerToCanvasPoint", () => {
  const rect = { left: 10, top: 20, width: 200, height: 100 };

  it("maps client coords into canvas space", () => {
    expect(pointerToCanvasPoint(10, 20, rect, 320)).toEqual([0, 0, 0.5]);
    expect(pointerToCanvasPoint(210, 120, rect, 320)).toEqual([320, 320, 0.5]);
  });

  it("returns null for zero-size rect (prevents NaN crash)", () => {
    expect(pointerToCanvasPoint(10, 20, { left: 0, top: 0, width: 0, height: 0 })).toBeNull();
  });

  it("uses provided pressure", () => {
    expect(pointerToCanvasPoint(110, 70, rect, 320, 0.8)?.[2]).toBe(0.8);
  });
});

describe("getSvgPathFromStroke", () => {
  it("returns empty string for empty input", () => {
    expect(getSvgPathFromStroke([])).toBe("");
  });

  it("builds a closed path", () => {
    const d = getSvgPathFromStroke([
      [0, 0],
      [10, 0],
      [10, 10],
    ]);
    expect(d.startsWith("M ")).toBe(true);
    expect(d.endsWith(" Z")).toBe(true);
  });

  it("skips non-finite points", () => {
    expect(getSvgPathFromStroke([[NaN, 1], [Infinity, 2]])).toBe("");
  });
});

describe("strokeOutlinePath", () => {
  it("returns a path for a multi-point stroke", () => {
    const d = strokeOutlinePath([
      [10, 10, 0.5],
      [40, 50, 0.5],
      [80, 20, 0.5],
    ]);
    expect(d.length).toBeGreaterThan(0);
  });

  it("returns empty for empty stroke", () => {
    expect(strokeOutlinePath([])).toBe("");
  });
});

describe("stroke list helpers", () => {
  it("appendPoint / commitStroke / undoStroke", () => {
    const live = appendPoint(null, [1, 2, 0.5]);
    expect(live).toEqual([[1, 2, 0.5]]);
    const next = appendPoint(live, [3, 4, 0.5]);
    const strokes = commitStroke([], next);
    expect(strokes).toHaveLength(1);
    expect(commitStroke(strokes, null)).toBe(strokes);
    expect(undoStroke(strokes)).toEqual([]);
  });
});
