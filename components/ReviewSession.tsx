"use client";

import { useMemo, useState } from "react";
import { db } from "@/lib/db";
import { useLiveQuery } from "@/lib/hooks/useLiveQuery";
import { dueCards, gradeCard, type Grade } from "@/lib/srs";
import { BackPreview, FrontPreview } from "./CardPreview";
import { HashLink } from "./HashLink";
import { useApp } from "./providers/AppProviders";
import { Button } from "./ui/IconButton";

export function ReviewSession({ deckId }: { deckId: string }) {
  const { tr } = useApp();
  const [flipped, setFlipped] = useState(false);
  const [doneIds, setDoneIds] = useState<string[]>([]);

  const deck = useLiveQuery(() => db.decks.get(deckId), [deckId]);
  const allCards = useLiveQuery(
    () => db.cards.where("deckId").equals(deckId).toArray(),
    [deckId],
    []
  );

  const queue = useMemo(() => {
    const due = dueCards(allCards ?? []);
    return due.filter((c) => !doneIds.includes(c.id));
  }, [allCards, doneIds]);

  const totalInitial = useMemo(() => dueCards(allCards ?? []).length, [allCards]);
  const current = queue[0];
  const progress = totalInitial === 0 ? 1 : (totalInitial - queue.length) / totalInitial;

  const onGrade = async (grade: Grade) => {
    if (!current) return;
    const nextSrs = gradeCard(current.srs, grade);
    await db.cards.update(current.id, { srs: nextSrs, updatedAt: Date.now() });
    setFlipped(false);
    setDoneIds((ids) => [...ids, current.id]);
  };

  if (deck === undefined || allCards === undefined) {
    return <div className="p-6 text-[var(--muted)]">…</div>;
  }

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-2">
      <div className="mb-3 flex items-center gap-2">
        <HashLink href={`/deck/${deckId}`} className="btn-ghost !px-3">
          ←
        </HashLink>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-[var(--muted)]">{deck?.name}</p>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-[var(--border)]">
            <div
              className="h-full rounded-full bg-[var(--accent)] transition-all"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
        </div>
        <span className="text-sm text-[var(--muted)]">
          {Math.min(doneIds.length + (current ? 1 : 0), totalInitial)}/{totalInitial}
        </span>
      </div>

      {!current ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <p className="text-xl font-medium">{totalInitial === 0 ? tr("noDue") : tr("reviewDone")}</p>
          <HashLink href={`/deck/${deckId}`} className="btn-primary">
            {tr("backToDeck")}
          </HashLink>
        </div>
      ) : (
        <>
          <button
            type="button"
            className="flip-scene mx-auto w-full max-w-sm flex-1"
            onClick={() => setFlipped((f) => !f)}
            aria-label={tr("tapToFlip")}
          >
            <div
              className={`flip-card relative mx-auto h-[min(62vh,480px)] w-full ${
                flipped ? "is-flipped" : ""
              }`}
            >
              <div className="flip-face absolute inset-0 [transform:rotateY(0deg)]">
                <FrontPreview
                  character={current.character}
                  drawingDataUrl={current.drawingDataUrl}
                  bg={current.frontBg}
                  large
                />
              </div>
              <div className="flip-face flip-back absolute inset-0">
                <BackPreview
                  phrases={current.phrases}
                  pinyin={current.pinyin}
                  translation={current.translation}
                  bg={current.backBg}
                  large
                />
              </div>
            </div>
          </button>

          {!flipped ? (
            <p className="my-3 text-center text-sm text-[var(--muted)]">{tr("tapToFlip")}</p>
          ) : (
            <div className="my-3" />
          )}

          {!flipped ? (
            <Button variant="primary" className="w-full" onClick={() => setFlipped(true)}>
              {tr("showAnswer")}
            </Button>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              <GradeBtn label={tr("again")} hint={tr("againHint")} color="var(--again)" onClick={() => void onGrade("again")} />
              <GradeBtn label={tr("hard")} hint={tr("hardHint")} color="var(--hard)" onClick={() => void onGrade("hard")} />
              <GradeBtn label={tr("good")} hint={tr("goodHint")} color="var(--good)" onClick={() => void onGrade("good")} />
              <GradeBtn label={tr("easy")} hint={tr("easyHint")} color="var(--easy)" onClick={() => void onGrade("easy")} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function GradeBtn({
  label,
  hint,
  color,
  onClick,
}: {
  label: string;
  hint: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="btn flex min-h-[56px] flex-col !px-1 py-2 text-white"
      style={{ background: color }}
    >
      <span className="text-sm font-medium">{label}</span>
      <span className="text-[10px] opacity-90">{hint}</span>
    </button>
  );
}
