"use client";

import { bgImageStyle } from "@/lib/bgStyle";
import type { BgLayer } from "@/lib/types";

type FrontProps = {
  character: string;
  drawingDataUrl: string;
  bg: BgLayer;
  large?: boolean;
};

export function FrontPreview({ character, drawingDataUrl, bg, large }: FrontProps) {
  return (
    <div
      className={`relative h-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] ${
        large ? "w-full" : "aspect-square w-full max-w-[320px]"
      }`}
    >
      {bg.dataUrl ? <div className="absolute inset-0" style={bgImageStyle(bg)} /> : null}
      {drawingDataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={drawingDataUrl}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-contain p-4 opacity-90"
        />
      ) : null}
      <div className="relative z-10 flex h-full items-center justify-center p-4">
        <span
          className={`font-han leading-none text-[var(--fg)] drop-shadow-sm ${
            large ? "text-7xl" : "text-6xl"
          }`}
        >
          {character || "字"}
        </span>
      </div>
    </div>
  );
}

type BackProps = {
  phrases: string;
  pinyin: string;
  translation: string;
  bg: BgLayer;
  large?: boolean;
};

export function BackPreview({ phrases, pinyin, translation, bg, large }: BackProps) {
  return (
    <div
      className={`relative h-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] ${
        large ? "w-full" : "min-h-[200px] w-full"
      }`}
    >
      {bg.dataUrl ? <div className="absolute inset-0" style={bgImageStyle(bg)} /> : null}
      <div className="relative z-10 flex h-full flex-col justify-center gap-3 p-5 text-center">
        {pinyin ? <p className="text-lg text-[var(--accent-soft)]">{pinyin}</p> : null}
        <p className="whitespace-pre-wrap text-xl leading-relaxed">{phrases || "—"}</p>
        {translation ? <p className="text-base text-[var(--muted)]">{translation}</p> : null}
      </div>
    </div>
  );
}
