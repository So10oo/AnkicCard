"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { defaultSettings, getSettings, saveSettings } from "@/lib/db";
import { t, type MessageKey } from "@/lib/i18n/messages";
import type { AppSettings, Locale, ThemeMode } from "@/lib/types";

type AppContextValue = {
  settings: AppSettings;
  ready: boolean;
  locale: Locale;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  setLocale: (locale: Locale) => void;
  dismissHomeHint: () => void;
  tr: (key: MessageKey) => string;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProviders({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void getSettings().then((s) => {
      setSettings(s);
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (!ready) return;
    const root = document.documentElement;
    if (settings.theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [settings.theme, ready]);

  const update = useCallback(async (partial: Partial<AppSettings>) => {
    const next = await saveSettings(partial);
    setSettings(next);
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      settings,
      ready,
      locale: settings.locale,
      theme: settings.theme,
      setTheme: (theme) => void update({ theme }),
      setLocale: (locale) => void update({ locale }),
      dismissHomeHint: () => void update({ homeHintDismissed: true }),
      tr: (key) => t(settings.locale, key),
    }),
    [settings, ready, update]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProviders");
  return ctx;
}
