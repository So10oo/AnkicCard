"use client";

import { useMemo, useState } from "react";
import { db, uid } from "@/lib/db";
import { useLiveQuery } from "@/lib/hooks/useLiveQuery";
import { countDue } from "@/lib/srs";
import type { Deck } from "@/lib/types";
import { HashLink } from "./HashLink";
import { useApp } from "./providers/AppProviders";
import { Button } from "./ui/IconButton";
import { Modal } from "./ui/Modal";

export function DeckList() {
  const { tr, theme, setTheme, locale, setLocale, settings, dismissHomeHint } = useApp();
  const decks = useLiveQuery(() => db.decks.orderBy("updatedAt").reverse().toArray(), [], []);
  const cards = useLiveQuery(() => db.cards.toArray(), [], []);
  const [modal, setModal] = useState<"create" | "rename" | null>(null);
  const [name, setName] = useState("");
  const [active, setActive] = useState<Deck | null>(null);

  const stats = useMemo(() => {
    const map = new Map<string, { total: number; due: number }>();
    for (const d of decks ?? []) map.set(d.id, { total: 0, due: 0 });
    for (const c of cards ?? []) {
      const s = map.get(c.deckId) ?? { total: 0, due: 0 };
      s.total += 1;
      map.set(c.deckId, s);
    }
    for (const d of decks ?? []) {
      const deckCards = (cards ?? []).filter((c) => c.deckId === d.id);
      const s = map.get(d.id)!;
      s.due = countDue(deckCards);
    }
    return map;
  }, [decks, cards]);

  const openCreate = () => {
    setName("");
    setActive(null);
    setModal("create");
  };

  const openRename = (deck: Deck) => {
    setActive(deck);
    setName(deck.name);
    setModal("rename");
  };

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const now = Date.now();
    if (modal === "create") {
      await db.decks.add({
        id: uid("deck"),
        name: trimmed,
        createdAt: now,
        updatedAt: now,
      });
    } else if (modal === "rename" && active) {
      await db.decks.update(active.id, { name: trimmed, updatedAt: now });
    }
    setModal(null);
  };

  const removeDeck = async (deck: Deck) => {
    if (!confirm(tr("confirmDeleteDeck"))) return;
    await db.transaction("rw", db.decks, db.cards, async () => {
      await db.cards.where("deckId").equals(deck.id).delete();
      await db.decks.delete(deck.id);
    });
  };

  return (
    <div className="mx-auto w-full max-w-lg px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-2">
      <header className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{tr("appName")}</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">{tr("decks")}</p>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            className="!px-3 text-xs"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label={tr("theme")}
          >
            {theme === "dark" ? "☀" : "☾"}
          </Button>
          <Button
            variant="ghost"
            className="!px-3 text-xs uppercase"
            onClick={() => setLocale(locale === "ru" ? "en" : "ru")}
            aria-label={tr("language")}
          >
            {locale === "ru" ? "EN" : "RU"}
          </Button>
        </div>
      </header>

      {!settings.homeHintDismissed ? (
        <div className="card-surface mb-4 p-4">
          <h2 className="font-medium">{tr("homeHintTitle")}</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">{tr("homeHintBody")}</p>
          <Button className="mt-3" variant="primary" onClick={dismissHomeHint}>
            {tr("gotIt")}
          </Button>
        </div>
      ) : null}

      <Button variant="primary" className="mb-4 w-full" onClick={openCreate}>
        {tr("newDeck")}
      </Button>

      {!decks?.length ? (
        <p className="text-center text-[var(--muted)]">{tr("emptyDecks")}</p>
      ) : (
        <ul className="space-y-3">
          {decks.map((deck) => {
            const s = stats.get(deck.id) ?? { total: 0, due: 0 };
            return (
              <li key={deck.id} className="card-surface p-4">
                <HashLink href={`/deck/${deck.id}`} className="block">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-medium">{deck.name}</h3>
                    <span className="rounded-full bg-[var(--accent)]/15 px-2.5 py-1 text-xs text-[var(--accent)]">
                      {s.due}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {tr("total")}: {s.total} · {tr("dueToday")}: {s.due}
                  </p>
                </HashLink>
                <div className="mt-3 flex flex-wrap gap-2">
                  <HashLink href={`/deck/${deck.id}/edit/new`} className="btn-primary flex-1 text-center">
                    {tr("newCard")}
                  </HashLink>
                  <HashLink
                    href={`/deck/${deck.id}/review`}
                    className={`btn-secondary flex-1 text-center ${s.due === 0 ? "opacity-50" : ""}`}
                  >
                    {tr("study")}
                  </HashLink>
                </div>
                <div className="mt-2 flex gap-2">
                  <Button className="flex-1" onClick={() => openRename(deck)}>
                    {tr("renameDeck")}
                  </Button>
                  <Button className="flex-1" onClick={() => void removeDeck(deck)}>
                    {tr("deleteDeck")}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Modal
        open={modal !== null}
        title={modal === "create" ? tr("newDeck") : tr("renameDeck")}
        onClose={() => setModal(null)}
        footer={
          <>
            <Button className="flex-1" onClick={() => setModal(null)}>
              {tr("cancel")}
            </Button>
            <Button variant="primary" className="flex-1" onClick={() => void submit()}>
              {modal === "create" ? tr("create") : tr("save")}
            </Button>
          </>
        }
      >
        <label className="block">
          <span className="mb-1 block text-sm text-[var(--muted)]">{tr("deckName")}</span>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") void submit();
            }}
          />
        </label>
      </Modal>
    </div>
  );
}
