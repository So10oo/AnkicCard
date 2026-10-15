export type BgLayer = {
  dataUrl: string;
  opacity: number; // 0-100
  contrast: number; // 0-100
  blur: number; // 0-10
  x: number;
  y: number;
  scale: number;
};

export type SrsState = {
  interval: number; // days
  dueAt: number; // timestamp ms
  ease: number;
  reps: number;
};

export type Deck = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
};

export type Card = {
  id: string;
  deckId: string;
  character: string;
  drawingDataUrl: string;
  frontBg: BgLayer;
  phrases: string;
  pinyin: string;
  translation: string;
  backBg: BgLayer;
  srs: SrsState;
  createdAt: number;
  updatedAt: number;
};

export type ThemeMode = "dark" | "light";
export type Locale = "ru" | "en";

export type AppSettings = {
  theme: ThemeMode;
  locale: Locale;
  homeHintDismissed: boolean;
};

export const defaultBg = (): BgLayer => ({
  dataUrl: "",
  opacity: 40,
  contrast: 100,
  blur: 0,
  x: 0,
  y: 0,
  scale: 1,
});

export const defaultSrs = (): SrsState => ({
  interval: 0,
  dueAt: Date.now(),
  ease: 2.5,
  reps: 0,
});
