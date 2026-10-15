import type { Card, SrsState } from "./types";

export type Grade = "again" | "hard" | "good" | "easy";

const INTERVALS: Record<Grade, number> = {
  again: 1,
  hard: 3,
  good: 7,
  easy: 30,
};

const EASE_DELTA: Record<Grade, number> = {
  again: -0.2,
  hard: -0.05,
  good: 0,
  easy: 0.15,
};

export function isDue(srs: SrsState, now = Date.now()): boolean {
  return srs.dueAt <= now;
}

export function gradeCard(srs: SrsState, grade: Grade, now = Date.now()): SrsState {
  const interval = INTERVALS[grade];
  const ease = Math.max(1.3, Number((srs.ease + EASE_DELTA[grade]).toFixed(2)));
  return {
    interval,
    ease,
    reps: srs.reps + 1,
    dueAt: now + interval * 24 * 60 * 60 * 1000,
  };
}

export function countDue(cards: Card[], now = Date.now()): number {
  return cards.filter((c) => isDue(c.srs, now)).length;
}

export function dueCards(cards: Card[], now = Date.now()): Card[] {
  return cards
    .filter((c) => isDue(c.srs, now))
    .sort((a, b) => a.srs.dueAt - b.srs.dueAt);
}
