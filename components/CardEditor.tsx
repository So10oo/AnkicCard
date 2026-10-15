"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { db } from "@/lib/db";
import { createEmptyCard } from "@/lib/cardFactory";
import type { Card } from "@/lib/types";
import { hashNavigate } from "./HashLink";
import { useApp } from "./providers/AppProviders";
import { BackgroundControls } from "./BackgroundControls";
import { CharacterCanvas } from "./CharacterCanvas";
import { Button } from "./ui/IconButton";

type Props = {
  deckId: string;
  cardId: string;
};

export function CardEditor({ deckId, cardId }: Props) {
  const { tr } = useApp();
  const isNew = cardId === "new";
  const [tab, setTab] = useState<"front" | "back">("front");
  const [card, setCard] = useState<Card | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (isNew) {
        if (!initialized.current) {
          initialized.current = true;
          const empty = createEmptyCard(deckId);
          setCard(empty);
          await db.cards.put(empty);
          if (!cancelled) {
            hashNavigate(`/deck/${deckId}/edit/${empty.id}`);
          }
        }
        return;
      }
      const existing = await db.cards.get(cardId);
      if (!cancelled) {
        if (!existing || existing.deckId !== deckId) {
          hashNavigate(`/deck/${deckId}`);
          return;
        }
        setCard((prev) => (prev?.id === existing.id ? prev : existing));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cardId, deckId, isNew]);

  const persist = useCallback(async (next: Card) => {
    setStatus("saving");
    const toSave = { ...next, updatedAt: Date.now() };
    await db.cards.put(toSave);
    setStatus("saved");
  }, []);

  const update = useCallback(
    (partial: Partial<Card>) => {
      setCard((prev) => {
        if (!prev) return prev;
        const next = { ...prev, ...partial };
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => void persist(next), 400);
        return next;
      });
    },
    [persist]
  );

  const saveNow = async () => {
    if (!card) return;
    if (timer.current) clearTimeout(timer.current);
    await persist(card);
    hashNavigate(`/deck/${deckId}`);
  };

  const statusLabel = useMemo(() => {
    if (status === "saving") return tr("saving");
    if (status === "saved") return tr("autosaved");
    return "";
  }, [status, tr]);

  if (!card) {
    return <div className="p-6 text-[var(--muted)]">…</div>;
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4 px-4 pb-[calc(5rem+env(safe-area-inset-bottom))] pt-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex rounded-xl border border-[var(--border)] bg-[var(--card)] p-1">
          <button
            type="button"
            className={`min-h-touch rounded-lg px-3 text-sm ${
              tab === "front" ? "bg-[var(--accent)] text-white" : "text-[var(--muted)]"
            }`}
            onClick={() => setTab("front")}
          >
            {tr("front")}
          </button>
          <button
            type="button"
            className={`min-h-touch rounded-lg px-3 text-sm ${
              tab === "back" ? "bg-[var(--accent)] text-white" : "text-[var(--muted)]"
            }`}
            onClick={() => setTab("back")}
          >
            {tr("back")}
          </button>
        </div>
        <span className="text-xs text-[var(--muted)]">{statusLabel}</span>
      </div>

      {tab === "front" ? (
        <>
          <label className="block">
            <span className="mb-1 block text-sm text-[var(--muted)]">{tr("character")}</span>
            <input
              className="input font-han text-center text-5xl"
              value={card.character}
              onChange={(e) => update({ character: e.target.value })}
              maxLength={8}
              inputMode="text"
            />
          </label>

          <BackgroundControls
            enableModeToggle
            value={card.frontBg}
            onChange={(frontBg) => update({ frontBg })}
          >
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
              <span className="font-han text-6xl text-[var(--fg)]/35 drop-shadow">
                {card.character || "字"}
              </span>
            </div>
            <CharacterCanvas
              embedded
              value={card.drawingDataUrl}
              onChange={(drawingDataUrl) => update({ drawingDataUrl })}
            />
          </BackgroundControls>
        </>
      ) : (
        <>
          <label className="block">
            <span className="mb-1 block text-sm text-[var(--muted)]">{tr("phrases")}</span>
            <AutoTextarea
              value={card.phrases}
              onChange={(phrases) => update({ phrases })}
              placeholder="你好吗？"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-[var(--muted)]">{tr("pinyin")}</span>
            <input
              className="input"
              value={card.pinyin}
              onChange={(e) => update({ pinyin: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-[var(--muted)]">{tr("translation")}</span>
            <input
              className="input"
              value={card.translation}
              onChange={(e) => update({ translation: e.target.value })}
            />
          </label>
          <BackgroundControls value={card.backBg} onChange={(backBg) => update({ backBg })} />
        </>
      )}

      <div className="fixed bottom-0 left-0 right-0 border-t border-[var(--border)] bg-[var(--bg)]/95 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur">
        <div className="mx-auto flex max-w-lg gap-2">
          <Button className="flex-1" onClick={() => hashNavigate(`/deck/${deckId}`)}>
            {tr("cancel")}
          </Button>
          <Button variant="primary" className="flex-1" onClick={() => void saveNow()}>
            {tr("save")}
          </Button>
        </div>
      </div>
    </div>
  );
}

function AutoTextarea({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    const len = value.length;
    const size = len > 80 ? 16 : len > 40 ? 20 : 24;
    el.style.fontSize = `${size}px`;
    el.style.height = `${Math.max(120, el.scrollHeight)}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      className="input min-h-[120px] resize-none leading-relaxed"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
