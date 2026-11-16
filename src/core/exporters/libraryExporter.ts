import JSZip from "jszip";
import { db } from "@/core/db/database";
import { WorkChapter, WorkItem } from "@/types/work";
import {
  refineChapterTranslationSilently,
  SourceLangCode,
  translateStringsBatchNeural,
} from "@/core/services/offlineTranslator";

function triggerBrowserDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function sanitizeFilename(name: string): string {
  return name.replace(/[<>:"/\\|?*]+/g, "_").trim() || "livro";
}

function escapeXml(unsafe: string): string {
  return (unsafe || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Converte qualquer HTML de capítulo em parágrafos literários XHTML 100% limpos (apenas o texto do livro, sem tags HTML sujas!)
function convertChapterToCleanBookParagraphsXhtml(chapter: WorkChapter): string {
  if (typeof DOMParser !== "undefined" && chapter.htmlContent) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(chapter.htmlContent, "text/html");

    // Remover scripts, styles ou elementos de interface
    doc
      .querySelectorAll("script, style, nav, button, input")
      .forEach((el) => el.remove());

    const blockNodes = Array.from(
      doc.body.querySelectorAll("p, blockquote, li, h1, h2, h3, h4")
    ).filter(
      (el) =>
        el.querySelectorAll("p, blockquote, li, h1, h2, h3, h4").length === 0
    );

    if (blockNodes.length > 0) {
      const cleanParagraphs: string[] = [];
      for (const node of blockNodes) {
        const rawText = (node.textContent || "").replace(/\s+/g, " ").trim();
        if (!rawText) continue;
        // Evitar repetir o título do capítulo se o primeiro elemento já for igual ao título
        if (
          cleanParagraphs.length === 0 &&
          rawText.toLowerCase() === chapter.title.trim().toLowerCase()
        ) {
          continue;
        }
        cleanParagraphs.push(`    <p>${escapeXml(rawText)}</p>`);
      }
      if (cleanParagraphs.length > 0) {
        return cleanParagraphs.join("\n");
      }
    }
  }

  // Fallback a partir do plainText puro
  const plain = (chapter.plainText || "")
    .replace(/<[^>]*>/g, " ")
    .trim();

  const lines = plain
    .split(/\n+/)
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return `    <p></p>`;
  }

  return lines.map((line) => `    <p>${escapeXml(line)}</p>`).join("\n");
}

// Garante que o livro inteiro (título, sinopse e TODOS os capítulos) esteja traduzido para Português antes de exportar
export async function ensureWorkFullyTranslatedForExport(
  work: WorkItem,
  sourceLang: SourceLangCode = "auto",
  onProgress?: (msg: string) => void
): Promise<WorkItem> {
  if (
    work.translatedChaptersPt &&
    work.translatedChaptersPt.length === work.chapters.length &&
    work.translatedTitlePt
  ) {
    onProgress?.("Usando tradução completa salva no banco local...");
    return {
      ...work,
      title: work.translatedTitlePt,
      summary: work.translatedSummaryPt || work.summary,
      language: "pt-BR",
      chapters: work.translatedChaptersPt,
    };
  }

  onProgress?.("Traduzindo título e sinopse...");
  const [translatedTitle, translatedSummary] =
    await translateStringsBatchNeural(
      [work.title, work.summary || ""],
      sourceLang
    );

  const translatedChapters: WorkChapter[] = [];
  for (let i = 0; i < work.chapters.length; i++) {
    const ch = work.chapters[i];
    onProgress?.(
      `Traduzindo capítulo ${i + 1} de ${work.chapters.length} (${ch.title})...`
    );
    const refined = await refineChapterTranslationSilently(ch, sourceLang);
    translatedChapters.push(refined);
  }

  await db.works.update(work.id, {
    translatedTitlePt: translatedTitle || work.title,
    translatedSummaryPt: translatedSummary || work.summary,
    translatedChaptersPt: translatedChapters,
  });

  return {
    ...work,
    title: translatedTitle || work.title,
    summary: translatedSummary || work.summary,
    language: "pt-BR",
    chapters: translatedChapters,
  };
}

// Exporta um arquivo .EPUB de livro verdadeiro (apenas o texto literário limpo, sem tags AO3 e sem código HTML aparente!)
export async function exportWorkAsEpub(
  work: WorkItem,
  options?: {
    exportTranslatedPt?: boolean;
    sourceLang?: SourceLangCode;
    onProgress?: (msg: string) => void;
  }
) {
  const targetWork = options?.exportTranslatedPt
    ? await ensureWorkFullyTranslatedForExport(
        work,
        options.sourceLang || "auto",
        options.onProgress
      )
    : work;

  const zip = new JSZip();

  // 1. mimetype precisa ser o primeiro arquivo e sem compressão (padrão IDPF EPUB)
  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });

  // 2. META-INF/container.xml
  zip.folder("META-INF")?.file(
    "container.xml",
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`
  );

  const oebps = zip.folder("OEBPS")!;

  // 3. Folha de estilo literária limpa (Tipografia de livro real)
  oebps.file(
    "style.css",
    `body {
  font-family: Georgia, "Times New Roman", serif;
  line-height: 1.65;
  margin: 5% 6%;
  color: #111111;
}
.title-page {
  text-align: center;
  margin-top: 22%;
}
.book-title {
  font-size: 2em;
  font-weight: bold;
  margin-bottom: 0.4em;
}
.book-author {
  font-size: 1.15em;
  font-style: italic;
  margin-bottom: 2em;
}
.book-synopsis {
  font-size: 0.95em;
  text-align: justify;
  margin-top: 2.5em;
  border-top: 1px solid #cccccc;
  padding-top: 1.2em;
}
h1.chapter-title {
  font-size: 1.4em;
  text-align: center;
  margin-top: 1.5em;
  margin-bottom: 1.5em;
  font-weight: bold;
}
p {
  margin-top: 0;
  margin-bottom: 0.85em;
  text-indent: 1.4em;
  text-align: justify;
}
`
  );

  // 4. Página de Rosto Limpa (Apenas Título, Autor e Sinopse limpa se houver — sem quadro de tags!)
  const safeBookTitle = escapeXml(targetWork.title);
  const safeAuthor = escapeXml(targetWork.author);
  const cleanSynopsisParagraphs = (targetWork.summary || "")
    .replace(/<[^>]*>/g, " ")
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => `      <p>${escapeXml(s)}</p>`)
    .join("\n");

  oebps.file(
    "titlepage.xhtml",
    `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="pt-BR">
<head>
  <meta http-equiv="Content-Type" content="application/xhtml+xml; charset=utf-8" />
  <title>${safeBookTitle}</title>
  <link rel="stylesheet" type="text/css" href="style.css" />
</head>
<body>
  <div class="title-page">
    <div class="book-title">${safeBookTitle}</div>
    <div class="book-author">${safeAuthor}</div>
  </div>
  ${
    cleanSynopsisParagraphs
      ? `<div class="book-synopsis">\n${cleanSynopsisParagraphs}\n  </div>`
      : ""
  }
</body>
</html>`
  );

  const manifestItems: string[] = [
    `<item id="css" href="style.css" media-type="text/css"/>`,
    `<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>`,
    `<item id="titlepage" href="titlepage.xhtml" media-type="application/xhtml+xml"/>`,
  ];
  const spineItems: string[] = [`<itemref idref="titlepage"/>`];
  const navPoints: string[] = [];

  // 5. Gerar cada capítulo apenas com o texto limpo do livro
  targetWork.chapters.forEach((ch, idx) => {
    const fileName = `chapter_${idx + 1}.xhtml`;
    const itemId = `ch${idx + 1}`;
    const safeChTitle = escapeXml(ch.title || `Capítulo ${idx + 1}`);
    const cleanParagraphsXhtml = convertChapterToCleanBookParagraphsXhtml(ch);

    manifestItems.push(
      `<item id="${itemId}" href="${fileName}" media-type="application/xhtml+xml"/>`
    );
    spineItems.push(`<itemref idref="${itemId}"/>`);
    navPoints.push(`    <navPoint id="navPoint-${idx + 1}" playOrder="${idx + 1}">
      <navLabel><text>${safeChTitle}</text></navLabel>
      <content src="${fileName}"/>
    </navPoint>`);

    oebps.file(
      fileName,
      `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="pt-BR">
<head>
  <meta http-equiv="Content-Type" content="application/xhtml+xml; charset=utf-8" />
  <title>${safeChTitle}</title>
  <link rel="stylesheet" type="text/css" href="style.css" />
</head>
<body>
  <h1 class="chapter-title">${safeChTitle}</h1>
${cleanParagraphsXhtml}
</body>
</html>`
    );
  });

  // 6. Sumário NCX (para navegação de capítulos no Kindle/Kobo/Leitores EPUB)
  oebps.file(
    "toc.ncx",
    `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="urn:uuid:${targetWork.id}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle><text>${safeBookTitle}</text></docTitle>
  <navMap>
${navPoints.join("\n")}
  </navMap>
</ncx>`
  );

  // 7. Manifesto OPF limpo (apenas metadados essenciais do livro)
  oebps.file(
    "content.opf",
    `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${safeBookTitle}</dc:title>
    <dc:creator>${safeAuthor}</dc:creator>
    <dc:language>${
      options?.exportTranslatedPt ? "pt-BR" : escapeXml(targetWork.language)
    }</dc:language>
    <dc:identifier id="BookId">urn:uuid:${targetWork.id}</dc:identifier>
  </metadata>
  <manifest>
    ${manifestItems.join("\n    ")}
  </manifest>
  <spine toc="ncx">
    ${spineItems.join("\n    ")}
  </spine>
</package>`
  );

  const blob = await zip.generateAsync({
    type: "blob",
    mimeType: "application/epub+zip",
  });
  const suffix = options?.exportTranslatedPt ? " (PT-BR)" : "";
  triggerBrowserDownload(
    blob,
    `${sanitizeFilename(targetWork.title)}${suffix}.epub`
  );
}

// Exporta também como Texto Limpo de Livro se o usuário escolher .HTML ou .ZIP
export async function exportWorkAsHtmlAO3(
  work: WorkItem,
  options?: {
    exportTranslatedPt?: boolean;
    sourceLang?: SourceLangCode;
    onProgress?: (msg: string) => void;
  }
) {
  // Por padrão, redirecionar para o EPUB limpo de livro conforme pedido pelo usuário
  await exportWorkAsEpub(work, options);
}

export async function exportWorkBundleZip(
  work: WorkItem,
  options?: {
    exportTranslatedPt?: boolean;
    sourceLang?: SourceLangCode;
    onProgress?: (msg: string) => void;
  }
) {
  await exportWorkAsEpub(work, options);
}

export async function exportEntireLibraryBackup() {
  const works = await db.works.toArray();
  const collections = await db.collections.toArray();
  const highlights = await db.highlights.toArray();
  const bookmarks = await db.bookmarks.toArray();
  const pinnedPages = await db.pinnedPages.toArray();

  const payload = {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    collections,
    works: works.map((w) => ({ ...w, rawFileBlob: undefined })),
    highlights,
    bookmarks,
    pinnedPages,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  triggerBrowserDownload(
    blob,
    `biblioteca_ao3_backup_${new Date().toISOString().slice(0, 10)}.json`
  );
}
