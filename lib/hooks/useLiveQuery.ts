"use client";

import { liveQuery } from "dexie";
import { useEffect, useState } from "react";

/** Dexie liveQuery subscription hook */
export function useLiveQuery<T>(
  querier: () => Promise<T> | T,
  deps: unknown[] = [],
  defaultValue?: T
): T | undefined {
  const [value, setValue] = useState<T | undefined>(defaultValue);

  useEffect(() => {
    let cancelled = false;
    const sub = liveQuery(querier).subscribe({
      next: (v) => {
        if (!cancelled) setValue(v);
      },
      error: () => {
        if (!cancelled) setValue(defaultValue);
      },
    });
    return () => {
      cancelled = true;
      sub.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return value;
}
