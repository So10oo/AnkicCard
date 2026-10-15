import "@testing-library/jest-dom/vitest";
import "fake-indexeddb/auto";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});

class Path2DMock {
  d: string;
  constructor(d = "") {
    this.d = d;
  }
}

// jsdom lacks canvas / Path2D
vi.stubGlobal("Path2D", Path2DMock);

HTMLCanvasElement.prototype.getContext = vi.fn(function getContext() {
  const ctx = {
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    drawImage: vi.fn(),
    fillStyle: "#000",
    strokeStyle: "#000",
    lineWidth: 1,
  };
  return ctx as unknown as CanvasRenderingContext2D;
}) as typeof HTMLCanvasElement.prototype.getContext;

HTMLCanvasElement.prototype.toDataURL = vi.fn(() => "data:image/png;base64,TEST");

HTMLCanvasElement.prototype.getBoundingClientRect = vi.fn(() => ({
  x: 0,
  y: 0,
  top: 0,
  left: 0,
  bottom: 320,
  right: 320,
  width: 320,
  height: 320,
  toJSON: () => ({}),
}));

if (!HTMLElement.prototype.setPointerCapture) {
  HTMLElement.prototype.setPointerCapture = vi.fn();
}
if (!HTMLElement.prototype.releasePointerCapture) {
  HTMLElement.prototype.releasePointerCapture = vi.fn();
}

// jsdom does not implement PointerEvent
if (typeof globalThis.PointerEvent === "undefined") {
  class PointerEventPolyfill extends MouseEvent {
    pointerId: number;
    pointerType: string;
    pressure: number;
    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params);
      this.pointerId = params.pointerId ?? 1;
      this.pointerType = params.pointerType ?? "mouse";
      this.pressure = params.pressure ?? 0.5;
    }
  }
  vi.stubGlobal("PointerEvent", PointerEventPolyfill);
}
