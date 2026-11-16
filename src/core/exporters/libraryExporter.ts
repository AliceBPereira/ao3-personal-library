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

// Extrai apenas os parágrafos literários limpos de um capítulo (sem tags HTML cruas ou sujas)
export function extractCleanParagraphsList(chapter: WorkChapter): string[] {
  if (typeof DOMParser !== "undefined" && chapter.htmlContent) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(chapter.htmlContent, "text/html");

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
        if (
          cleanParagraphs.length === 0 &&
          rawText.toLowerCase() === chapter.title.trim().toLowerCase()
        ) {
          continue;
        }
        cleanParagraphs.push(rawText);
      }
      if (cleanParagraphs.length > 0) {
        return cleanParagraphs;
      }
    }
  }

  const plain = (chapter.plainText || "")
    .replace(/<[^>]*>/g, " ")
    .trim();

  return plain
    .split(/\n+/)
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function convertChapterToCleanBookParagraphsXhtml(chapter: WorkChapter): string {
  const paragraphs = extractCleanParagraphsList(chapter);
  if (paragraphs.length === 0) return `    <p></p>`;
  return paragraphs.map((p) => `    <p>${escapeXml(p)}</p>`).join("\n");
}

// Garante que o livro inteiro esteja traduzido para Português antes de exportar
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

// ============================================================================
// 1. EXPORTAR COMO .EPUB (E-book padrão limpo, apenas o texto do livro)
// ============================================================================
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
  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });

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

// ============================================================================
// 2. EXPORTAR COMO .HTML (Livro HTML limpo, apenas o texto formatado para leitura)
// ============================================================================
export function generateCleanBookHtmlString(work: WorkItem): string {
  const safeTitle = escapeXml(work.title);
  const safeAuthor = escapeXml(work.author);

  const synopsisHtml = (work.summary || "")
    .replace(/<[^>]*>/g, " ")
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => `<p>${escapeXml(s)}</p>`)
    .join("\n      ");

  const chaptersHtml = work.chapters
    .map((ch, idx) => {
      const chTitle = escapeXml(ch.title || `Capítulo ${idx + 1}`);
      const paragraphs = extractCleanParagraphsList(ch)
        .map((p) => `      <p>${escapeXml(p)}</p>`)
        .join("\n");
      return `    <section class="chapter" id="chapter-${idx + 1}">
      <h2 class="title">${chTitle}</h2>
      <div class="userstuff">
${paragraphs}
      </div>
    </section>`;
    })
    .join("\n\n");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="author" content="${safeAuthor}" />
  <meta name="description" content="${escapeXml(work.summary || "")}" />
  <title>${safeTitle}</title>
  <style>
    body {
      font-family: Georgia, "Times New Roman", serif;
      max-width: 720px;
      margin: 48px auto;
      padding: 0 24px;
      color: #1a1a1a;
      background-color: #faf6e8;
      line-height: 1.75;
      font-size: 18px;
    }
    .book-header {
      text-align: center;
      padding: 40px 0 32px;
      border-bottom: 1px solid #d8cfb8;
      margin-bottom: 40px;
    }
    h1.heading {
      font-size: 2em;
      margin: 0 0 8px;
      color: #111;
    }
    .author {
      font-size: 1.1em;
      font-style: italic;
      color: #555;
    }
    .summary {
      margin-top: 24px;
      font-size: 0.92em;
      text-align: justify;
      color: #333;
    }
    .chapter {
      margin-bottom: 56px;
      page-break-before: always;
    }
    .chapter h2.title {
      text-align: center;
      font-size: 1.4em;
      margin-bottom: 28px;
    }
    .userstuff p {
      margin: 0 0 1em;
      text-indent: 1.5em;
      text-align: justify;
    }
    @media print {
      body { background: #ffffff; margin: 0; max-width: 100%; }
    }
  </style>
</head>
<body>
  <header class="book-header" id="preface">
    <h1 class="heading">${safeTitle}</h1>
    <div class="author">por <a rel="author">${safeAuthor}</a></div>
    ${
      synopsisHtml
        ? `<blockquote class="summary userstuff">${synopsisHtml}</blockquote>`
        : ""
    }
  </header>
  <main id="chapters">
${chaptersHtml}
  </main>
</body>
</html>`;
}

export async function exportWorkAsHtmlBook(
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

  const html = generateCleanBookHtmlString(targetWork);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const suffix = options?.exportTranslatedPt ? " (PT-BR)" : "";
  triggerBrowserDownload(
    blob,
    `${sanitizeFilename(targetWork.title)}${suffix}.html`
  );
}

// ============================================================================
// 3. EXPORTAR COMO .MOBI (Container PalmDOC/MOBI compatível com Kindle e reimportação)
// ============================================================================
function buildPalmDocMobiBinary(title: string, htmlPayload: string): Uint8Array {
  const encoder = new TextEncoder();
  const textBytes = encoder.encode(htmlPayload);

  const RECORD_SIZE = 4096;
  const textRecords: Uint8Array[] = [];
  for (let offset = 0; offset < textBytes.length; offset += RECORD_SIZE) {
    textRecords.push(textBytes.slice(offset, offset + RECORD_SIZE));
  }
  if (textRecords.length === 0) {
    textRecords.push(encoder.encode("<p></p>"));
  }

  // Record 0: PalmDOC Header (16 bytes) + MOBI Header básico
  const titleBytes = encoder.encode(title.slice(0, 120));
  const rec0Length = 16 + 116 + titleBytes.length;
  const rec0 = new Uint8Array(rec0Length);
  const rec0View = new DataView(rec0.buffer);

  // PalmDOC Header (compression = 1 (uncompressed), textLength, recordCount, recordSize = 4096)
  rec0View.setUint16(0, 1, false); // 1 = No compression (100% compatível com nosso parser e leitores)
  rec0View.setUint16(2, 0, false);
  rec0View.setUint32(4, textBytes.length, false);
  rec0View.setUint16(8, textRecords.length, false);
  rec0View.setUint16(10, RECORD_SIZE, false);
  rec0View.setUint32(12, 0, false);

  // Assinatura "MOBI" no offset 16 do Record 0
  rec0.set(encoder.encode("MOBI"), 16);
  rec0View.setUint32(20, 116, false); // Header length
  rec0View.setUint32(24, 2, false); // MOBI type: Book
  rec0View.setUint32(28, 65001, false); // UTF-8 encoding
  rec0View.setUint32(84, 16 + 116, false); // Full name offset dentro do Rec 0
  rec0View.setUint32(88, titleBytes.length, false); // Full name length
  rec0.set(titleBytes, 16 + 116);

  const totalRecords = 1 + textRecords.length;
  const pdbHeaderSize = 78 + totalRecords * 8 + 2;
  const totalFileSize =
    pdbHeaderSize +
    rec0.length +
    textRecords.reduce((acc, r) => acc + r.length, 0);

  const output = new Uint8Array(totalFileSize);
  const outView = new DataView(output.buffer);

  // Nome PDB nos primeiros 32 bytes
  const pdbName = encoder.encode(sanitizeFilename(title).slice(0, 31));
  output.set(pdbName, 0);

  // Tipo "BOOK" e Criador "MOBI" no offset 60..68
  output.set(encoder.encode("BOOKMOBI"), 60);
  outView.setUint16(76, totalRecords, false);

  let currentOffset = pdbHeaderSize;
  // Entrada do Record 0
  outView.setUint32(78, currentOffset, false);
  currentOffset += rec0.length;

  // Entradas dos Records de Texto
  for (let i = 0; i < textRecords.length; i++) {
    outView.setUint32(78 + (i + 1) * 8, currentOffset, false);
    currentOffset += textRecords[i].length;
  }

  // Copiar dados dos records
  let writePos = pdbHeaderSize;
  output.set(rec0, writePos);
  writePos += rec0.length;

  for (const r of textRecords) {
    output.set(r, writePos);
    writePos += r.length;
  }

  return output;
}

export async function exportWorkAsMobi(
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

  const chaptersMobiHtml = targetWork.chapters
    .map((ch, idx) => {
      const chTitle = escapeXml(ch.title || `Capítulo ${idx + 1}`);
      const paragraphs = extractCleanParagraphsList(ch)
        .map((p) => `<p>${escapeXml(p)}</p>`)
        .join("\n");
      return `<h1>${chTitle}</h1>\n${paragraphs}`;
    })
    .join("\n<mbp:pagebreak/>\n");

  const fullMobiHtml = `<html><head><title>${escapeXml(
    targetWork.title
  )}</title></head><body>${chaptersMobiHtml}</body></html>`;

  const mobiBytes = buildPalmDocMobiBinary(targetWork.title, fullMobiHtml);
  const blob = new Blob([mobiBytes as unknown as BlobPart], {
    type: "application/x-mobipocket-ebook",
  });
  const suffix = options?.exportTranslatedPt ? " (PT-BR)" : "";
  triggerBrowserDownload(
    blob,
    `${sanitizeFilename(targetWork.title)}${suffix}.mobi`
  );
}

// ============================================================================
// 4. EXPORTAR COMO .PDF (Livro diagramado limpo para salvar/imprimir em PDF)
// ============================================================================
export async function exportWorkAsPdf(
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

  const cleanHtml = generateCleanBookHtmlString(targetWork);
  const printWindow = window.open("", "_blank", "width=900,height=800");
  if (!printWindow) {
    // Fallback caso o bloqueador de pop-ups impeça a janela de impressão PDF
    await exportWorkAsHtmlBook(work, options);
    return;
  }

  printWindow.document.open();
  printWindow.document.write(cleanHtml);
  printWindow.document.close();
  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
  }, 350);
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
