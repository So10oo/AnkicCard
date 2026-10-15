import { describe, expect, it } from "vitest";
import { messages, t } from "./messages";

describe("i18n", () => {
  it("defaults Russian for known keys", () => {
    expect(t("ru", "appName")).toBe("AnkiCard");
    expect(t("ru", "study")).toBe("Изучать");
  });

  it("returns English translations", () => {
    expect(t("en", "study")).toBe("Study");
    expect(t("en", "drawMode")).toBe("Draw");
  });

  it("keeps ru/en key sets in sync", () => {
    expect(Object.keys(messages.ru).sort()).toEqual(Object.keys(messages.en).sort());
  });
});
