import DOMPurify from "dompurify";
import { countWordsFromText } from "@/core/services/readingMetrics";
import { ParsedBookResult } from "./htmlAo3Parser";
import { WorkChapter } from "@/types/work";

// Descompressão LZ77 PalmDOC usada em arquivos .mobi
function decompressPalmDOC(data: Uint8Array): Uint8Array {
  const output: number[] = [];
  let i = 0;
  while (i < data.length) {
    const c = data[i++];
    if (c === 0x00) {
      output.push(0x00);
    } else if (c >= 0x01 && c <= 0x08) {
      for (let j = 0; j < c && i < data.length; j++) {
        output.push(data[i++]);
      }
    } else if (c >= 0x09 && c <= 0x7f) {
      output.push(c);
    } else if (c >= 0x80 && c <= 0xbf) {
      if (i >= data.length) break;
      const next = data[i++];
      const pair = ((c << 8) | next) & 0x3fff;
      const distance = pair >> 3;
      const length = (pair & 0x07) + 3;
      const start = output.length - distance;
      for (let j = 0; j < length; j++) {
        const idx = start + j;
        output.push(idx >= 0 && idx < output.length ? output[idx] : 32);
      }
    } else if (c >= 0xc0) {
      output.push(32); // Espaço + caractere ASCII
      output.push(c ^ 0x80);
    }
  }
  return new Uint8Array(output);
}

export async function parseMobiBook(file: File): Promise<ParsedBookResult> {
  const buffer = await file.arrayBuffer();
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  const decoder = new TextDecoder("utf-8", { fatal: false });

  // Nome interno no cabeçalho PDB (primeiros 32 bytes)
  const pdbTitle = decoder
    .decode(bytes.slice(0, 32))
    .replace(/\0/g, "")
    .trim();

  let title = pdbTitle || file.name.replace(/\.mobi$/i, "");
  let rawHtml = "";

  try {
    const numRecords = view.getUint16(76, false);
    const recordOffsets: number[] = [];
    for (let i = 0; i < numRecords; i++) {
      const offset = view.getUint32(78 + i * 8, false);
      recordOffsets.push(offset);
    }

    if (recordOffsets.length > 1) {
      const rec0Offset = recordOffsets[0];
      const compression = view.getUint16(rec0Offset, false);
      const textRecordCount = view.getUint16(rec0Offset + 8, false);

      // Tentar ler o Full Title do cabeçalho MOBI se disponível
      const mobiMagic = decoder.decode(bytes.slice(rec0Offset + 16, rec0Offset + 20));
      if (mobiMagic === "MOBI") {
        const fullNameOffset = view.getUint32(rec0Offset + 84, false);
        const fullNameLength = view.getUint32(rec0Offset + 88, false);
        if (
          fullNameOffset > 0 &&
          fullNameLength > 0 &&
          fullNameLength < 512 &&
          rec0Offset + fullNameOffset + fullNameLength <= bytes.length
        ) {
          const extractedTitle = decoder
            .decode(
              bytes.slice(
                rec0Offset + fullNameOffset,
                rec0Offset + fullNameOffset + fullNameLength
              )
            )
            .replace(/\0/g, "")
            .trim();
          if (extractedTitle) title = extractedTitle;
        }
      }

      const maxRec = Math.min(textRecordCount, recordOffsets.length - 1);
      const chunks: Uint8Array[] = [];

      for (let r = 1; r <= maxRec; r++) {
        const start = recordOffsets[r];
        const end = r + 1 < recordOffsets.length ? recordOffsets[r + 1] : bytes.length;
        if (start >= end || start >= bytes.length) continue;
        const slice = bytes.slice(start, end);
        if (compression === 2) {
          chunks.push(decompressPalmDOC(slice));
        } else {
          chunks.push(slice);
        }
      }

      const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
      const merged = new Uint8Array(totalLength);
      let pos = 0;
      for (const c of chunks) {
        merged.set(c, pos);
        pos += c.length;
      }
      rawHtml = decoder.decode(merged);
    }
  } catch {
    // Fallback: extrair strings legíveis do arquivo
    rawHtml = decoder.decode(bytes);
  }

  if (!rawHtml.trim()) {
    rawHtml = `<p>Conteúdo importado do arquivo MOBI: ${file.name}</p>`;
  }

  // Dividir em capítulos por <mbp:pagebreak/> ou <h1> / <h2>
  const pageSlices = rawHtml
    .split(/<mbp:pagebreak\s*\/?>|<h[12][^>]*>/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 40);

  const parser = new DOMParser();
  const chapters: WorkChapter[] = [];

  const slicesToProcess = pageSlices.length > 0 ? pageSlices : [rawHtml];

  slicesToProcess.slice(0, 80).forEach((sliceHtml, idx) => {
    const doc = parser.parseFromString(sliceHtml, "text/html");
    const plain = doc.body?.textContent?.replace(/\s+/g, " ").trim() || "";
    const words = countWordsFromText(plain);
    if (words === 0 && slicesToProcess.length > 1) return;

    chapters.push({
      id: `mobi-ch-${chapters.length + 1}`,
      index: chapters.length,
      title: `Capítulo ${chapters.length + 1}`,
      htmlContent: DOMPurify.sanitize(
        doc.body?.innerHTML || `<p>${plain}</p>`
      ),
      plainText: plain,
      wordCount: words,
    });
  });

  if (chapters.length === 0) {
    chapters.push({
      id: "mobi-ch-1",
      index: 0,
      title: "Capítulo 1",
      htmlContent: `<p>Livro MOBI importado (${file.name}).</p>`,
      plainText: `Livro MOBI importado (${file.name}).`,
      wordCount: 10,
    });
  }

  const totalWords = chapters.reduce((acc, c) => acc + c.wordCount, 0);

  return {
    title,
    author: "Autor (MOBI)",
    fandoms: ["MOBI / Kindle Importado"],
    rating: "not_rated",
    category: "gen",
    warningStatus: "none",
    completionStatus: "complete",
    tags: {
      warnings: ["Não se aplicam avisos de arquivo."],
      relationships: [],
      characters: [],
      freeforms: ["Formato MOBI", "Kindle"],
    },
    summary:
      chapters[0]?.plainText.slice(0, 350) + "..." ||
      "Livro importado no formato MOBI.",
    language: "Português",
    wordCount: totalWords,
    chaptersCurrent: chapters.length,
    chaptersTotal: chapters.length,
    chapters,
  };
}
