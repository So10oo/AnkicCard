"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  CANVAS_SIZE,
  STROKE_OPTIONS,
  appendPoint,
  commitStroke,
  pointerToCanvasPoint,
  strokeOutlinePath,
  undoStroke,
  type Point,
  type Stroke,
} from "@/lib/drawing";
import { getStroke } from "perfect-freehand";
import { Button } from "./ui/IconButton";
import { useApp } from "./providers/AppProviders";

type Props = {
  value: string;
  onChange: (dataUrl: string) => void;
  className?: string;
  /** When true, fills parent and hides outer chrome */
  embedded?: boolean;
};

function fillStrokePath(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  color: string
) {
  const d = strokeOutlinePath(points);
  if (!d) return;
  try {
    const path = new Path2D(d);
    ctx.fillStyle = color;
    ctx.fill(path);
  } catch {
    // Fallback for environments without Path2D / bad path data
    const outline = getStroke(points, STROKE_OPTIONS);
    if (!outline.length) return;
    ctx.beginPath();
    outline.forEach(([x, y], i) => {
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }
}

export function CharacterCanvas({ value, onChange, className = "", embedded }: Props) {
  const { tr } = useApp();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [current, setCurrent] = useState<Point[] | null>(null);
  const drawing = useRef(false);
  const strokesRef = useRef<Stroke[]>([]);
  const currentRef = useRef<Point[] | null>(null);
  const hydrated = useRef(false);
  const size = CANVAS_SIZE;

  useEffect(() => {
    strokesRef.current = strokes;
  }, [strokes]);

  const paintStrokes = useCallback(
    (ctx: CanvasRenderingContext2D, all: Stroke[], live: Point[] | null, withGrid: boolean) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);

      if (withGrid) {
        ctx.strokeStyle = "rgba(128,128,128,0.18)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(size / 2, 0);
        ctx.lineTo(size / 2, size);
        ctx.moveTo(0, size / 2);
        ctx.lineTo(size, size / 2);
        ctx.stroke();
      }

      const fg =
        getComputedStyle(document.documentElement).getPropertyValue("--fg").trim() || "#111";
      all.forEach((s) => fillStrokePath(ctx, s, fg));
      if (live?.length) fillStrokePath(ctx, live, fg);
    },
    [size]
  );

  const redraw = useCallback(
    (all: Stroke[], live: Point[] | null) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      paintStrokes(ctx, all, live, true);
    },
    [paintStrokes]
  );

  useEffect(() => {
    if (!value || hydrated.current || strokes.length) return;
    hydrated.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const img = new Image();
    img.onload = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
    };
    img.onerror = () => {
      // ignore broken data URLs
    };
    img.src = value;
  }, [value, strokes.length, size]);

  useEffect(() => {
    if (strokes.length || current) redraw(strokes, current);
  }, [strokes, current, redraw]);

  const emit = useCallback(
    (all: Stroke[]) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);
      all.forEach((points) => fillStrokePath(ctx, points, "#111111"));
      let dataUrl = "";
      try {
        dataUrl = all.length ? canvas.toDataURL("image/png") : "";
      } catch {
        dataUrl = "";
      }
      onChange(dataUrl);
      redraw(all, null);
    },
    [onChange, redraw, size]
  );

  const readPoint = (e: ReactPointerEvent<HTMLCanvasElement>): Point | null => {
    const rect = e.currentTarget.getBoundingClientRect();
    return pointerToCanvasPoint(e.clientX, e.clientY, rect, size, e.pressure || 0.5);
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const point = readPoint(e);
    if (!point) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // capture may fail if element is gone
    }
    drawing.current = true;
    currentRef.current = [point];
    setCurrent([point]);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    e.preventDefault();
    e.stopPropagation();
    const point = readPoint(e);
    if (!point) return;
    const next = appendPoint(currentRef.current, point);
    currentRef.current = next;
    setCurrent(next);
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!drawing.current) return;
    drawing.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    const live = currentRef.current;
    currentRef.current = null;
    const next = commitStroke(strokesRef.current, live);
    setCurrent(null);
    if (next !== strokesRef.current) {
      strokesRef.current = next;
      setStrokes(next);
      emit(next);
    }
  };

  const undo = () => {
    const next = undoStroke(strokesRef.current);
    strokesRef.current = next;
    currentRef.current = null;
    setStrokes(next);
    setCurrent(null);
    emit(next);
  };

  const clear = () => {
    strokesRef.current = [];
    currentRef.current = null;
    setStrokes([]);
    setCurrent(null);
    hydrated.current = true;
    emit([]);
  };

  const canvasEl = (
    <canvas
      ref={canvasRef}
      data-testid="character-canvas"
      className="h-full w-full touch-none"
      style={{ width: "100%", height: "100%", touchAction: "none" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    />
  );

  if (embedded) {
    return (
      <div className={`absolute inset-0 z-20 ${className}`}>
        {canvasEl}
        <div className="absolute bottom-2 left-2 right-2 z-30 flex gap-2">
          <Button className="flex-1 bg-[var(--card)]/90" onClick={undo} disabled={!strokes.length}>
            {tr("undo")}
          </Button>
          <Button
            className="flex-1 bg-[var(--card)]/90"
            onClick={clear}
            disabled={!strokes.length && !value}
          >
            {tr("clear")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="relative mx-auto aspect-square w-full max-w-[320px] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] touch-none">
        {canvasEl}
      </div>
      <div className="mt-2 flex gap-2">
        <Button onClick={undo} disabled={!strokes.length}>
          {tr("undo")}
        </Button>
        <Button onClick={clear} disabled={!strokes.length && !value}>
          {tr("clear")}
        </Button>
      </div>
    </div>
  );
}
