import AnkiExport from "anki-apkg-export";
import type { Card, Deck } from "../types";

function dataUrlToUint8(dataUrl: string): Uint8Array | null {
  if (!dataUrl?.startsWith("data:")) return null;
  const comma = dataUrl.indexOf(",");
  if (comma < 0) return null;
  const meta = dataUrl.slice(0, comma);
  const data = dataUrl.slice(comma + 1);
  if (meta.includes(";base64")) {
    const binary = atob(data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }
  return new TextEncoder().encode(decodeURIComponent(data));
}

function extFromDataUrl(dataUrl: string): string {
  if (dataUrl.includes("image/jpeg")) return "jpg";
  if (dataUrl.includes("image/webp")) return "webp";
  if (dataUrl.includes("image/gif")) return "gif";
  return "png";
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

const MODEL_CSS = `
.card {
  font-family: "Noto Serif SC", "Source Han Serif SC", serif;
  text-align: center;
  color: #1a1a1a;
  background: #faf8f6;
  padding: 16px;
}
.char { font-size: 72px; line-height: 1.2; margin: 12px 0; position: relative; z-index: 2; }
.layer { position: relative; min-height: 220px; overflow: hidden; border-radius: 12px; }
.bg { position: absolute; inset: 0; background-size: cover; background-position: center; z-index: 0; }
.drawing { position: absolute; inset: 0; object-fit: contain; width: 100%; height: 100%; z-index: 1; opacity: 0.9; }
.phrases { font-size: 22px; white-space: pre-wrap; margin: 12px 0; }
.pinyin { color: #d4a373; font-size: 18px; }
.translation { color: #666; font-size: 16px; margin-top: 8px; }
`;

export async function exportDeckToApkg(deck: Deck, cards: Card[]): Promise<void> {
  const apkg = await AnkiExport.create(deck.name, {
    locateFile: () => "/sql-wasm.wasm",
    model: {
      name: "AnkiCard Hanzi",
      fields: [
        "Character",
        "Drawing",
        "FrontBg",
        "BackBg",
        "Phrases",
        "Pinyin",
        "Translation",
        "FrontOpacity",
        "FrontContrast",
        "FrontBlur",
        "BackOpacity",
        "BackContrast",
        "BackBlur",
      ],
      css: MODEL_CSS,
      templates: [
        {
          name: "Card",
          requiredFields: ["Character"],
          questionFormat: `
<div class="layer">
  {{#FrontBg}}<div class="bg" style="background-image:url('{{FrontBg}}');opacity:{{FrontOpacity}};filter:contrast({{FrontContrast}}%) blur({{FrontBlur}}px);"></div>{{/FrontBg}}
  {{#Drawing}}<img class="drawing" src="{{Drawing}}">{{/Drawing}}
  <div class="char">{{Character}}</div>
</div>
`,
          answerFormat: `
{{FrontSide}}
<hr id="answer">
<div class="layer">
  {{#BackBg}}<div class="bg" style="background-image:url('{{BackBg}}');opacity:{{BackOpacity}};filter:contrast({{BackContrast}}%) blur({{BackBlur}}px);"></div>{{/BackBg}}
  <div style="position:relative;z-index:2;padding:12px;">
    {{#Pinyin}}<div class="pinyin">{{Pinyin}}</div>{{/Pinyin}}
    <div class="phrases">{{Phrases}}</div>
    {{#Translation}}<div class="translation">{{Translation}}</div>{{/Translation}}
  </div>
</div>
`,
        },
      ],
    },
  });

  try {
    for (const card of cards) {
      let drawingName = "";
      let frontBgName = "";
      let backBgName = "";

      if (card.drawingDataUrl) {
        drawingName = `drawing_${card.id}.png`;
        const bytes = dataUrlToUint8(card.drawingDataUrl);
        if (bytes) apkg.addMedia(drawingName, bytes);
      }

      if (card.frontBg.dataUrl) {
        const ext = extFromDataUrl(card.frontBg.dataUrl);
        frontBgName = `frontbg_${card.id}.${ext}`;
        const bytes = dataUrlToUint8(card.frontBg.dataUrl);
        if (bytes) apkg.addMedia(frontBgName, bytes);
      }

      if (card.backBg.dataUrl) {
        const ext = extFromDataUrl(card.backBg.dataUrl);
        backBgName = `backbg_${card.id}.${ext}`;
        const bytes = dataUrlToUint8(card.backBg.dataUrl);
        if (bytes) apkg.addMedia(backBgName, bytes);
      }

      apkg.addNote(
        {
          Character: card.character || "?",
          Drawing: drawingName,
          FrontBg: frontBgName,
          BackBg: backBgName,
          Phrases: card.phrases.replace(/\n/g, "<br>"),
          Pinyin: card.pinyin,
          Translation: card.translation,
          FrontOpacity: (card.frontBg.opacity / 100).toFixed(2),
          FrontContrast: String(card.frontBg.contrast),
          FrontBlur: String(card.frontBg.blur),
          BackOpacity: (card.backBg.opacity / 100).toFixed(2),
          BackContrast: String(card.backBg.contrast),
          BackBlur: String(card.backBg.blur),
        },
        { noteId: card.id }
      );
    }

    const blob = await apkg.save({ type: "blob" });
    const safeName = deck.name.replace(/[^\w\u0400-\u04FF\u4e00-\u9fff\- ]+/g, "_").trim() || "deck";
    downloadBlob(blob, `${safeName}.apkg`);
  } finally {
    apkg.close();
  }
}
