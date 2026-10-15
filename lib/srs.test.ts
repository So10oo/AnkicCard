import { describe, expect, it } from "vitest";
import { createEmptyCard } from "./cardFactory";
import { countDue, dueCards, gradeCard, isDue } from "./srs";
import { defaultSrs } from "./types";

describe("SRS", () => {
  const now = Date.UTC(2026, 0, 1, 12, 0, 0);

  it("isDue when dueAt is in the past", () => {
    expect(isDue({ ...defaultSrs(), dueAt: now - 1 }, now)).toBe(true);
    expect(isDue({ ...defaultSrs(), dueAt: now + 1 }, now)).toBe(false);
  });

  it("grades map to 1 / 3 / 7 / 30 day intervals", () => {
    const base = defaultSrs();
    const day = 24 * 60 * 60 * 1000;
    expect(gradeCard(base, "again", now).interval).toBe(1);
    expect(gradeCard(base, "hard", now).interval).toBe(3);
    expect(gradeCard(base, "good", now).interval).toBe(7);
    expect(gradeCard(base, "easy", now).interval).toBe(30);

    expect(gradeCard(base, "good", now).dueAt).toBe(now + 7 * day);
    expect(gradeCard(base, "good", now).reps).toBe(1);
  });

  it("keeps ease above 1.3", () => {
    const srs = { ...defaultSrs(), ease: 1.3 };
    expect(gradeCard(srs, "again", now).ease).toBe(1.3);
  });

  it("counts and sorts due cards", () => {
    const a = createEmptyCard("d1");
    a.id = "a";
    a.srs = { ...defaultSrs(), dueAt: now - 2000 };
    const b = createEmptyCard("d1");
    b.id = "b";
    b.srs = { ...defaultSrs(), dueAt: now - 1000 };
    const c = createEmptyCard("d1");
    c.id = "c";
    c.srs = { ...defaultSrs(), dueAt: now + 1000 };

    expect(countDue([a, b, c], now)).toBe(2);
    expect(dueCards([a, b, c], now).map((x) => x.id)).toEqual(["a", "b"]);
  });
});
