"use client";

import { useEffect, useState } from "react";
import { CardEditor } from "./CardEditor";
import { DeckDetail } from "./DeckDetail";
import { DeckList } from "./DeckList";
import { OfflineView } from "./OfflineView";
import { ReviewSession } from "./ReviewSession";

function useAppPath() {
  const [path, setPath] = useState("/");

  useEffect(() => {
    const read = () => {
      const pathname = window.location.pathname;
      if (pathname === "/offline" || pathname === "/~offline") {
        setPath("/offline");
        return;
      }
      const raw = window.location.hash.replace(/^#/, "") || "/";
      setPath(raw.startsWith("/") ? raw : `/${raw}`);
    };
    read();
    window.addEventListener("hashchange", read);
    window.addEventListener("popstate", read);
    return () => {
      window.removeEventListener("hashchange", read);
      window.removeEventListener("popstate", read);
    };
  }, []);

  return path;
}

export function AppShell() {
  const pathname = useAppPath();
  const parts = pathname.split("/").filter(Boolean);

  if (parts[0] === "offline" || parts[0] === "~offline") {
    return <OfflineView />;
  }

  if (parts[0] === "deck" && parts[1]) {
    const deckId = parts[1];
    if (parts[2] === "review") {
      return <ReviewSession deckId={deckId} />;
    }
    if (parts[2] === "edit" && parts[3]) {
      return <CardEditor deckId={deckId} cardId={parts[3]} />;
    }
    return <DeckDetail deckId={deckId} />;
  }

  return <DeckList />;
}
