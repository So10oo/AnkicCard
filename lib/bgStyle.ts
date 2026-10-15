import type { CSSProperties } from "react";
import type { BgLayer } from "./types";

export function bgImageStyle(bg: BgLayer): CSSProperties {
  if (!bg.dataUrl) return {};
  return {
    backgroundImage: `url(${bg.dataUrl})`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
    backgroundSize: "cover",
    opacity: bg.opacity / 100,
    filter: `contrast(${bg.contrast}%) blur(${bg.blur}px)`,
    transform: `translate(${bg.x}px, ${bg.y}px) scale(${bg.scale})`,
    transformOrigin: "center center",
  };
}
