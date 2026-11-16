import { countWordsFromText } from "@/core/services/readingMetrics";
import { ParsedBookResult } from "./htmlAo3Parser";
import { WorkChapter } from "@/types/work";

export async function parsePdfBook(file: File): Promise<ParsedBookResult> {
  const arrayBuffer = await file.arrayBuffer();
  let title = file.name.replace(/\.pdf$/i, "");
  let author = "Autor Desconhecido";
  const chapters: WorkChapter[] = [];

  try {
    const pdfjsLib = await import("pdfjs-dist");
    if (typeof window !== "undefined" && pdfjsLib.GlobalWorkerOptions) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
    }

    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      disableFontFace: true,
    });
    const pdf = await loadingTask.promise;

    try {
      const meta = await pdf.getMetadata();
      const info = meta?.info as Record<string, string> | undefined;
      if (info?.Title && info.Title.trim()) title = info.Title.trim();
      if (info?.Author && info.Author.trim()) author = info.Author.trim();
    } catch {
      // Ignore metadata error
    }

    const totalPages = pdf.numPages;
    // Agrupar a cada 5 páginas como um "Capítulo / Seção" ou 1 página por seção se o PDF for curto
    const pagesPerChapter = totalPages > 15 ? 5 : 1;
    let currentHtmlParts: string[] = [];
    let currentPlainParts: string[] = [];
    let startPage = 1;

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const strings = (textContent.items as Array<{ str?: string }>).map(
        (item) => item.str || ""
      );
      const pageText = strings.join(" ").replace(/\s+/g, " ").trim();

      if (pageText) {
        currentPlainParts.push(pageText);
        // Formatar parágrafos para leitura confortável
        const paragraphs = pageText
          .split(/(?<=[.!?])\s+(?=[A-ZÀ-Ú"—–])/g)
          .map((p) => `<p>${p}</p>`)
          .join("");
        currentHtmlParts.push(
          `<div class="pdf-page-block" data-pdf-page="${pageNum}"><h4>Página ${pageNum}</h4>${paragraphs}</div>`
        );
      }

      if (pageNum % pagesPerChapter === 0 || pageNum === totalPages) {
        const plainJoined = currentPlainParts.join("\n\n");
        const htmlJoined = currentHtmlParts.join("<hr/>");
        const words = countWordsFromText(plainJoined);
        const chapterLabel =
          pagesPerChapter === 1
            ? `Página ${pageNum}`
            : `Páginas ${startPage} a ${pageNum}`;

        chapters.push({
          id: `pdf-ch-${chapters.length + 1}`,
          index: chapters.length,
          title: chapterLabel,
          htmlContent:
            htmlJoined || `<p><em>[Página ${pageNum} sem camada de texto extraível]</em></p>`,
          plainText: plainJoined,
          wordCount: words,
        });

        currentHtmlParts = [];
        currentPlainParts = [];
        startPage = pageNum + 1;
      }
    }
  } catch {
    // Fallback caso o PDF não tenha worker ou seja protegido
    chapters.push({
      id: "pdf-ch-1",
      index: 0,
      title: "Documento PDF Completo",
      htmlContent: `<p>Arquivo PDF importado: <strong>${file.name}</strong>.</p><p>Você pode editar o texto ou adicionar notas e páginas fixadas diretamente no leitor.</p>`,
      plainText: `Arquivo PDF importado: ${file.name}`,
      wordCount: Math.max(250, Math.round(file.size / 35)),
    });
  }

  const totalWords = chapters.reduce((acc, c) => acc + c.wordCount, 0);
  const firstPreview = chapters
    .map((c) => c.plainText)
    .find((t) => t.length > 20);

  return {
    title,
    author,
    fandoms: ["PDF Importado"],
    rating: "not_rated",
    category: "gen",
    warningStatus: "none",
    completionStatus: "complete",
    tags: {
      warnings: ["Não se aplicam avisos de arquivo."],
      relationships: [],
      characters: [],
      freeforms: ["PDF", "Documento Digital"],
    },
    summary: firstPreview
      ? firstPreview.slice(0, 350) + "..."
      : `Documento PDF importado (${file.name}).`,
    language: "Português",
    wordCount: totalWords,
    chaptersCurrent: chapters.length,
    chaptersTotal: chapters.length,
    chapters,
  };
}
