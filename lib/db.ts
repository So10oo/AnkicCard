import Dexie, { type Table } from "dexie";
import type { AppSettings, Card, Deck } from "./types";

export class AnkiCardDB extends Dexie {
  decks!: Table<Deck, string>;
  cards!: Table<Card, string>;
  settings!: Table<{ key: string; value: unknown }, string>;

  constructor() {
    super("ankicard");
    this.version(1).stores({
      decks: "id, name, createdAt, updatedAt",
      cards: "id, deckId, character, createdAt, updatedAt, srs.dueAt",
      settings: "key",
    });
  }
}

export const db = new AnkiCardDB();

export const SETTINGS_KEY = "app";

export const defaultSettings = (): AppSettings => ({
  theme: "dark",
  locale: "ru",
  homeHintDismissed: false,
});

export async function getSettings(): Promise<AppSettings> {
  const row = await db.settings.get(SETTINGS_KEY);
  if (!row) return defaultSettings();
  return { ...defaultSettings(), ...(row.value as AppSettings) };
}

export async function saveSettings(partial: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getSettings();
  const next = { ...current, ...partial };
  await db.settings.put({ key: SETTINGS_KEY, value: next });
  return next;
}

export function uid(prefix = "id"): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
