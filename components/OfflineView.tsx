"use client";

import { HashLink } from "@/components/HashLink";
import { useApp } from "@/components/providers/AppProviders";

export function OfflineView() {
  const { tr } = useApp();
  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold">{tr("offlineTitle")}</h1>
      <p className="text-[var(--muted)]">{tr("offlineBody")}</p>
      <HashLink href="/" className="btn-primary">
        {tr("appName")}
      </HashLink>
    </main>
  );
}
