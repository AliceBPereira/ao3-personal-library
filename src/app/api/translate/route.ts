import { NextRequest, NextResponse } from "next/server";

// Traduz um bloco de texto usando o motor neural GTX no backend local do Next.js (sem bloqueio de CORS)
async function translateBatchViaNeuralEngine(
  texts: string[],
  sourceLang: string,
  targetLang: string = "pt"
): Promise<string[]> {
  const sl = sourceLang === "auto" || !sourceLang ? "auto" : sourceLang;

  // Agrupar parágrafos em lotes de até ~3500 caracteres usando um separador único que o tradutor preserva
  const SEPARATOR = "\n[[[__AO3_SEP__]]]\n";
  const batches: Array<{ indices: number[]; payload: string }> = [];

  let currentIndices: number[] = [];
  let currentParts: string[] = [];
  let currentLen = 0;

  texts.forEach((txt, idx) => {
    const trimmed = txt.trim();
    if (!trimmed) return;
    if (currentLen + trimmed.length > 3200 && currentParts.length > 0) {
      batches.push({
        indices: currentIndices,
        payload: currentParts.join(SEPARATOR),
      });
      currentIndices = [];
      currentParts = [];
      currentLen = 0;
    }
    currentIndices.push(idx);
    currentParts.push(trimmed);
    currentLen += trimmed.length + SEPARATOR.length;
  });

  if (currentParts.length > 0) {
    batches.push({
      indices: currentIndices,
      payload: currentParts.join(SEPARATOR),
    });
  }

  const results = [...texts];

  await Promise.all(
    batches.map(async (batch) => {
      try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(
          sl
        )}&tl=${encodeURIComponent(targetLang)}&dt=t`;

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
            "User-Agent": "Mozilla/5.0",
          },
          body: new URLSearchParams({ q: batch.payload }).toString(),
        });

        if (!response.ok) return;
        const data = await response.json();

        if (Array.isArray(data?.[0])) {
          const fullTranslated = data[0]
            .map((segment: unknown[]) =>
              typeof segment?.[0] === "string" ? segment[0] : ""
            )
            .join("");

          const splitParts = fullTranslated.split(
            /\s*\[\[\[\s*__AO3_SEP__\s*\]\]\]\s*/i
          );

          batch.indices.forEach((originalIdx, i) => {
            if (splitParts[i] !== undefined && splitParts[i].trim()) {
              results[originalIdx] = splitParts[i].trim();
            }
          });
        }
      } catch (err) {
        console.error("Batch translation error:", err);
      }
    })
  );

  return results;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const texts: string[] = Array.isArray(body?.texts) ? body.texts : [];
    const sourceLang: string = body?.sourceLang || "auto";
    const targetLang: string = body?.targetLang || "pt";

    if (texts.length === 0) {
      return NextResponse.json({ translations: [] });
    }

    const translations = await translateBatchViaNeuralEngine(
      texts,
      sourceLang,
      targetLang
    );

    return NextResponse.json({ translations });
  } catch (error) {
    console.error("Error in /api/translate:", error);
    return NextResponse.json(
      { error: "Translation failed" },
      { status: 500 }
    );
  }
}
