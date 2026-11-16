import { WorkChapter } from "@/types/work";

export type SourceLangCode = "auto" | "en" | "ru" | "es" | "fr";

// Cache persistente em memória + localStorage para strings curtas (títulos, tags, sinopses)
const stringTranslationCache = new Map<string, string>();

const LOCAL_STORAGE_CACHE_KEY = "ao3_neural_translations_v2";

function loadLocalCache() {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, string>;
      Object.entries(parsed).forEach(([k, v]) =>
        stringTranslationCache.set(k, v)
      );
    }
  } catch {
    // Ignore storage read error
  }
}

function saveToLocalCache(key: string, val: string) {
  stringTranslationCache.set(key, val);
  if (typeof window === "undefined") return;
  try {
    const obj: Record<string, string> = {};
    // Manter as últimas 500 strings no localStorage para títulos/sinopses/tags dos cards
    const entries = Array.from(stringTranslationCache.entries()).slice(-500);
    for (const [k, v] of entries) {
      obj[k] = v;
    }
    localStorage.setItem(LOCAL_STORAGE_CACHE_KEY, JSON.stringify(obj));
  } catch {
    // Ignore quota error
  }
}

if (typeof window !== "undefined") {
  loadLocalCache();
}

// Tags padrão do AO3 para tradução imediata 0ms
const AO3_STANDARD_TAGS_PT: Record<string, string> = {
  "Creator Chose Not To Use Archive Warnings":
    "O criador optou por não usar avisos de arquivo.",
  "No Archive Warnings Apply": "Não se aplicam avisos de arquivo.",
  "Graphic Depictions Of Violence": "Descrições gráficas de violência",
  "Major Character Death": "Morte de personagem principal",
  Fluff: "Fluff (Fofura)",
  "Slow Burn": "Queima lenta (Slow Burn)",
  "Alternate Universe": "Universo Alternativo",
  "Hurt/Comfort": "Dor/Conforto",
  Angst: "Angústia (Angst)",
};

export function translatePlainStringOffline(
  input: string,
  sourceLang: SourceLangCode = "auto"
): string {
  if (!input || !input.trim()) return input;
  const trimmed = input.trim();
  if (AO3_STANDARD_TAGS_PT[trimmed]) {
    return AO3_STANDARD_TAGS_PT[trimmed];
  }
  const cacheKey = `${sourceLang}:${trimmed}`;
  return stringTranslationCache.get(cacheKey) || input;
}

// Traduz um lote de strings usando nossa rota local /api/translate (Motor Neural Completo)
export async function translateStringsBatchNeural(
  texts: string[],
  sourceLang: SourceLangCode = "auto"
): Promise<string[]> {
  if (texts.length === 0) return [];

  // Verificar quais strings já estão em cache
  const results: string[] = new Array(texts.length);
  const missingIndices: number[] = [];
  const missingTexts: string[] = [];

  texts.forEach((txt, idx) => {
    const trimmed = txt?.trim() || "";
    if (!trimmed) {
      results[idx] = txt;
      return;
    }
    if (AO3_STANDARD_TAGS_PT[trimmed]) {
      results[idx] = AO3_STANDARD_TAGS_PT[trimmed];
      return;
    }
    const key = `${sourceLang}:${trimmed}`;
    const cached = stringTranslationCache.get(key);
    if (cached) {
      results[idx] = cached;
    } else {
      missingIndices.push(idx);
      missingTexts.push(trimmed);
    }
  });

  if (missingTexts.length === 0) {
    return results;
  }

  try {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        texts: missingTexts,
        sourceLang,
        targetLang: "pt",
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const translatedList: string[] = data?.translations || [];
      missingIndices.forEach((origIdx, i) => {
        const translated = translatedList[i] || missingTexts[i];
        results[origIdx] = translated;
        saveToLocalCache(`${sourceLang}:${missingTexts[i]}`, translated);
      });
      return results;
    }
  } catch (err) {
    console.warn("Offline or translation API unreachable:", err);
  }

  // Fallback: retornar original intacto (nunca misturar palavras soltas!)
  missingIndices.forEach((origIdx, i) => {
    results[origIdx] = missingTexts[i];
  });
  return results;
}

// Traduz um capítulo HTML inteiro com qualidade neural perfeita preservando <p>, <em>, <strong>, <h2>, etc.
export async function refineChapterTranslationSilently(
  chapter: WorkChapter,
  sourceLang: SourceLangCode = "auto"
): Promise<WorkChapter> {
  if (typeof DOMParser === "undefined") return chapter;
  const parser = new DOMParser();
  const doc = parser.parseFromString(chapter.htmlContent, "text/html");

  // Coletar todos os parágrafos e blocos de texto para traduzir frases completas com contexto!
  const blockElements = Array.from(
    doc.body.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li, blockquote")
  );

  // Filtrar apenas blocos que não contêm outros blocos filhos (para não duplicar)
  const leafBlocks = blockElements.filter(
    (el) =>
      el.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li, blockquote")
        .length === 0 && (el.textContent?.trim().length || 0) > 0
  );

  if (leafBlocks.length > 0) {
    const originalTexts = leafBlocks.map((el) =>
      (el.textContent || "").replace(/\s+/g, " ").trim()
    );
    const [translatedTitle, ...translatedBlocks] =
      await translateStringsBatchNeural(
        [chapter.title, ...originalTexts],
        sourceLang
      );

    leafBlocks.forEach((el, idx) => {
      if (translatedBlocks[idx]) {
        el.textContent = translatedBlocks[idx];
      }
    });

    return {
      ...chapter,
      title: translatedTitle || chapter.title,
      htmlContent: doc.body.innerHTML,
      plainText: doc.body.textContent || chapter.plainText,
    };
  } else {
    // Caso o capítulo seja texto puro sem tags <p>
    const plain = (doc.body.textContent || chapter.plainText || "").trim();
    const [translatedTitle, translatedBody] = await translateStringsBatchNeural(
      [chapter.title, plain],
      sourceLang
    );

    return {
      ...chapter,
      title: translatedTitle || chapter.title,
      htmlContent: `<p>${translatedBody || plain}</p>`,
      plainText: translatedBody || plain,
    };
  }
}
