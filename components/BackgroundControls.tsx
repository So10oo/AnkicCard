"use client";

import {
  useCallback,
  useRef,
  useState,
  type ChangeEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { bgImageStyle } from "@/lib/bgStyle";
import type { BgLayer } from "@/lib/types";
import { useApp } from "./providers/AppProviders";
import { Button } from "./ui/IconButton";

type Props = {
  value: BgLayer;
  onChange: (next: BgLayer) => void;
  children?: ReactNode;
  className?: string;
  /** When true, shows draw/move toggle for layered editors */
  enableModeToggle?: boolean;
};

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function BackgroundControls({
  value,
  onChange,
  children,
  className = "",
  enableModeToggle,
}: Props) {
  const { tr } = useApp();
  const [mode, setMode] = useState<"draw" | "move">("draw");
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStart = useRef<{ dist: number; scale: number } | null>(null);
  const dragStart = useRef<{ x: number; y: number; bx: number; by: number } | null>(null);
  const moveEnabled = !enableModeToggle || mode === "move";

  const patch = useCallback(
    (partial: Partial<BgLayer>) => onChange({ ...value, ...partial }),
    [onChange, value]
  );

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      patch({
        dataUrl: String(reader.result || ""),
        x: 0,
        y: 0,
        scale: 1,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!value.dataUrl || !moveEnabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = Array.from(pointers.current.values());
      pinchStart.current = { dist: distance(a, b), scale: value.scale };
      dragStart.current = null;
    } else if (pointers.current.size === 1) {
      dragStart.current = { x: e.clientX, y: e.clientY, bx: value.x, by: value.y };
    }
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size >= 2 && pinchStart.current) {
      const [a, b] = Array.from(pointers.current.values());
      const dist = distance(a, b);
      const nextScale = Math.min(4, Math.max(0.4, (dist / pinchStart.current.dist) * pinchStart.current.scale));
      patch({ scale: Number(nextScale.toFixed(3)) });
      return;
    }

    if (dragStart.current && pointers.current.size === 1) {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      patch({
        x: dragStart.current.bx + dx,
        y: dragStart.current.by + dy,
      });
    }
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchStart.current = null;
    if (pointers.current.size === 0) dragStart.current = null;
  };

  return (
    <div className={className}>
      {enableModeToggle ? (
        <div className="mb-2 flex rounded-xl border border-[var(--border)] bg-[var(--card)] p-1">
          <button
            type="button"
            className={`min-h-touch flex-1 rounded-lg text-sm ${
              mode === "draw" ? "bg-[var(--accent)] text-white" : "text-[var(--muted)]"
            }`}
            onClick={() => setMode("draw")}
          >
            {tr("drawMode")}
          </button>
          <button
            type="button"
            className={`min-h-touch flex-1 rounded-lg text-sm ${
              mode === "move" ? "bg-[var(--accent)] text-white" : "text-[var(--muted)]"
            }`}
            onClick={() => setMode("move")}
          >
            {tr("moveBgMode")}
          </button>
        </div>
      ) : null}

      <div
        className="relative mx-auto aspect-square w-full max-w-[320px] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {value.dataUrl ? (
          <div className="absolute inset-0" style={bgImageStyle(value)} />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-[var(--muted)]">
            {tr("addBg")}
          </div>
        )}
        <div
          className={`relative z-10 h-full w-full ${
            enableModeToggle && mode === "move" ? "pointer-events-none" : ""
          }`}
        >
          {children}
        </div>
      </div>

      <p className="mt-2 text-center text-xs text-[var(--muted)]">{tr("positionHint")}</p>

      <label className="btn-secondary mt-3 w-full cursor-pointer">
        {tr("addBg")}
        <input type="file" accept="image/*" className="hidden" onChange={onFile} />
      </label>

      {value.dataUrl ? (
        <div className="mt-4 space-y-3">
          <Slider
            label={`${tr("opacity")}: ${value.opacity}%`}
            min={0}
            max={100}
            value={value.opacity}
            onChange={(opacity) => patch({ opacity })}
          />
          <Slider
            label={`${tr("contrast")}: ${value.contrast}%`}
            min={0}
            max={100}
            value={value.contrast}
            onChange={(contrast) => patch({ contrast })}
          />
          <Slider
            label={`${tr("blur")}: ${value.blur}px`}
            min={0}
            max={10}
            step={0.5}
            value={value.blur}
            onChange={(blur) => patch({ blur })}
          />
          <Button
            onClick={() =>
              patch({
                dataUrl: "",
                opacity: 40,
                contrast: 100,
                blur: 0,
                x: 0,
                y: 0,
                scale: 1,
              })
            }
          >
            {tr("clear")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function Slider({
  label,
  min,
  max,
  step = 1,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-[var(--muted)]">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-11 w-full accent-[var(--accent)]"
      />
    </label>
  );
}
