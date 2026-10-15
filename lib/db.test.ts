import { beforeEach, describe, expect, it } from "vitest";
import { createEmptyCard } from "./cardFactory";
import { db, defaultSettings, getSettings, saveSettings, uid } from "./db";

describe("Dexie db", () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  it("generates unique ids", () => {
    expect(uid("card")).not.toBe(uid("card"));
    expect(uid("deck")).toMatch(/^deck_/);
  });

  it("stores and loads settings", async () => {
    expect(await getSettings()).toEqual(defaultSettings());
    const next = await saveSettings({ locale: "en", theme: "light" });
    expect(next.locale).toBe("en");
    expect(next.theme).toBe("light");
    expect(await getSettings()).toMatchObject({ locale: "en", theme: "light" });
  });

  it("persists decks and cards", async () => {
    const now = Date.now();
    await db.decks.add({ id: "deck_1", name: "HSK 1", createdAt: now, updatedAt: now });
    const card = createEmptyCard("deck_1");
    card.character = "你";
    await db.cards.put(card);

    const decks = await db.decks.toArray();
    const cards = await db.cards.where("deckId").equals("deck_1").toArray();
    expect(decks[0].name).toBe("HSK 1");
    expect(cards[0].character).toBe("你");
  });
});
