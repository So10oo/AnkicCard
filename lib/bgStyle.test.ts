import { describe, expect, it } from "vitest";
import { bgImageStyle } from "./bgStyle";
import { defaultBg } from "./types";

describe("bgImageStyle", () => {
  it("returns empty object without image", () => {
    expect(bgImageStyle(defaultBg())).toEqual({});
  });

  it("applies opacity, contrast, blur and transform", () => {
    const style = bgImageStyle({
      dataUrl: "data:image/png;base64,aa",
      opacity: 40,
      contrast: 80,
      blur: 2,
      x: 5,
      y: -3,
      scale: 1.5,
    });
    expect(style.opacity).toBe(0.4);
    expect(style.filter).toBe("contrast(80%) blur(2px)");
    expect(style.transform).toBe("translate(5px, -3px) scale(1.5)");
    expect(style.backgroundImage).toContain("data:image/png");
  });
});
