"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { useLiveQuery } from "@/lib/hooks/useLiveQuery";
import { countDue } from "@/lib/srs";
import { exportDeckToApkg } from "@/lib/export/apkg";
import { HashLink, hashNavigate } from "./HashLink";
import { useApp } from "./providers/AppProviders";
import { Button } from "./ui/IconButton";

export function DeckDetail({ deckId }: { deckId: string }) {
  const { tr } = useApp();
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);

  const deck = useLiveQuery(() => db.decks.get(deckId), [deckId]);
  const cards = useLiveQuery(
    () => db.cards.where("deckId").equals(deckId).reverse().sortBy("updatedAt"),
    [deckId],
    []
  );

  const due = countDue(cards ?? []);

  useEffect(() => {
    if (deck === null) hashNavigate("/");
  }, [deck]);

  const removeCard = async (id: string) => {
    if (!confirm(tr("confirmDeleteCard"))) return;
    await db.cards.delete(id);
  };

  const onExport = async () => {
    if (!deck || !cards?.length) return;
    setBusy(true);
    setToast(tr("exporting"));
    try {
      await exportDeckToApkg(deck, cards);
      setToast(tr("exportDone"));
    } catch {
      setToast(tr("exportFail"));
    } finally {
      setBusy(false);
    }
  };

  if (deck === undefined) {
    return <div className="p-6 text-[var(--muted)]">…</div>;
  }

  if (!deck) return null;

  return (
    <div className="mx-auto w-full max-w-lg px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-2">
      <div className="mb-4 flex items-center gap-2">
        <HashLink href="/" className="btn-ghost !px-3">
          ←
        </HashLink>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-semibold">{deck.name}</h1>
          <p className="text-sm text-[var(--muted)]">
            {tr("total")}: {cards?.length ?? 0} · {tr("dueToday")}: {due}
          </p>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <HashLink href={`/deck/${deckId}/edit/new`} className="btn-primary text-center">
          {tr("newCard")}
        </HashLink>
        <HashLink
          href={`/deck/${deckId}/review`}
          className={`btn-secondary text-center ${due === 0 ? "pointer-events-none opacity-50" : ""}`}
        >
          {tr("study")}
        </HashLink>
      </div>

      <Button className="mb-4 w-full" disabled={busy || !cards?.length} onClick={() => void onExport()}>
        {tr("export")}
      </Button>

      {toast ? (
        <p className="mb-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 text-sm text-[var(--muted)]">
          {toast}
        </p>
      ) : null}

      {!cards?.length ? (
        <p className="text-center text-[var(--muted)]">{tr("emptyCards")}</p>
      ) : (
        <ul className="space-y-2">
          {cards.map((card) => (
            <li key={card.id} className="card-surface flex items-center gap-3 p-3">
              <HashLink
                href={`/deck/${deckId}/edit/${card.id}`}
                className="flex min-w-0 flex-1 items-center gap-3"
              >
                <span className="font-han flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--bg)] text-2xl">
                  {card.character || "?"}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium">{card.character || tr("character")}</p>
                  <p className="truncate text-sm text-[var(--muted)]">
                    {card.pinyin || card.translation || card.phrases || "—"}
                  </p>
                </div>
              </HashLink>
              <Button variant="ghost" className="!px-3" onClick={() => void removeCard(card.id)}>
                {tr("delete")}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
