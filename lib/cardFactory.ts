import { uid } from "./db";
import { defaultBg, defaultSrs, type Card } from "./types";

export function createEmptyCard(deckId: string): Card {
  const now = Date.now();
  return {
    id: uid("card"),
    deckId,
    character: "",
    drawingDataUrl: "",
    frontBg: defaultBg(),
    phrases: "",
    pinyin: "",
    translation: "",
    backBg: defaultBg(),
    srs: defaultSrs(),
    createdAt: now,
    updatedAt: now,
  };
}
