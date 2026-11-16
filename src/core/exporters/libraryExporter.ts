import JSZip from "jszip";
import { db } from "@/core/db/database";
import { WorkItem } from "@/types/work";

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
  return name.replace(/[<>:"/\\|?*]+/g, "_").trim() || "obra_ao3";
}

export function generateAo3HtmlDocument(
  work: WorkItem,
  highlights: Array<{ selectedText: string; note?: string; color: string }> = []
): string {
  const chaptersHtml = work.chapters
    .map(
      (ch, idx) => `
    <div class="chapter" id="chapter-${idx + 1}">
      <div class="chapter-preface">
        <h2 class="title">${ch.title}</h2>
      </div>
      <div class="userstuff">
        ${ch.htmlContent}
      </div>
    </div>`
    )
    .join("\n<hr/>\n");

  const highlightsHtml =
    highlights.length > 0
      ? `<div id="annotations" style="margin-top:40px; padding:16px; border:1px solid #ccc; background:#fafafa;">
          <h3>Destaques & Anotações Pessoais (${highlights.length})</h3>
          <ul>
            ${highlights
              .map(
                (h) =>
                  `<li><strong>"${h.selectedText}"</strong> ${
                    h.note ? `— <em>Nota: ${h.note}</em>` : ""
                  }</li>`
              )
              .join("")}
          </ul>
        </div>`
      : "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>${work.title} - ${work.author} [Arquivo de Nossa Autoria]</title>
  <style>
    body { font-family: Georgia, serif; max-width: 800px; margin: 32px auto; padding: 0 20px; color: #2a2a2a; line-height: 1.65; }
    #preface { border-bottom: 2px solid #990000; padding-bottom: 20px; margin-bottom: 30px; font-family: "Lucida Grande", sans-serif; }
    h1.heading { color: #990000; margin-bottom: 4px; }
    dl.tags { display: grid; grid-template-columns: 180px 1fr; gap: 6px 12px; font-size: 13px; background: #f7f7f7; padding: 12px; border: 1px solid #ddd; }
    dt { font-weight: bold; }
    dd { margin: 0; }
    blockquote.userstuff { border-left: 3px solid #990000; padding-left: 12px; margin: 12px 0; color: #333; }
    .chapter h2.title { font-family: "Lucida Grande", sans-serif; border-bottom: 1px solid #ddd; padding-bottom: 6px; }
  </style>
</head>
<body>
  <div id="preface">
    <h1 class="heading">${work.title}</h1>
    <p>por <a rel="author">${work.author}</a></p>
    <dl class="tags">
      <dt>Fandom:</dt><dd>${work.fandoms.join(", ")}</dd>
      <dt>Classificação:</dt><dd>${work.rating.toUpperCase()}</dd>
      <dt>Avisos de Arquivo:</dt><dd>${work.tags.warnings.join(", ")}</dd>
      <dt>Categoria:</dt><dd>${work.category.toUpperCase()}</dd>
      <dt>Relacionamentos:</dt><dd>${work.tags.relationships.join(", ")}</dd>
      <dt>Personagens:</dt><dd>${work.tags.characters.join(", ")}</dd>
      <dt>Tags Adicionais:</dt><dd>${work.tags.freeforms.join(", ")}</dd>
      <dt>Estatísticas:</dt><dd>Idioma: ${work.language} | Palavras: ${work.wordCount} | Capítulos: ${work.chaptersCurrent}/${work.chaptersTotal ?? "?"}</dd>
    </dl>
    <div class="summary">
      <p><strong>Sinopse:</strong></p>
      <blockquote class="userstuff"><p>${work.summary.replace(/\n/g, "</p><p>")}</p></blockquote>
    </div>
  </div>
  <div id="chapters">
    ${chaptersHtml}
  </div>
  ${highlightsHtml}
</body>
</html>`;
}

export async function exportWorkAsHtmlAO3(work: WorkItem) {
  const highlights = await db.highlights.where("workId").equals(work.id).toArray();
  const html = generateAo3HtmlDocument(work, highlights);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  triggerBrowserDownload(blob, `${sanitizeFilename(work.title)} - ${work.author}.html`);
}

export async function exportWorkAsEpub(work: WorkItem) {
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
  const manifestItems: string[] = [];
  const spineItems: string[] = [];

  work.chapters.forEach((ch, idx) => {
    const fileName = `chapter_${idx + 1}.xhtml`;
    manifestItems.push(
      `<item id="ch${idx + 1}" href="${fileName}" media-type="application/xhtml+xml"/>`
    );
    spineItems.push(`<itemref idref="ch${idx + 1}"/>`);

    oebps.file(
      fileName,
      `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>${ch.title}</title></head>
<body>
  <h2>${ch.title}</h2>
  ${ch.htmlContent}
</body>
</html>`
    );
  });

  const allSubjects = [
    ...work.fandoms,
    ...work.tags.relationships,
    ...work.tags.characters,
    ...work.tags.freeforms,
  ]
    .map((s) => `<dc:subject>${s.replace(/[<>&]/g, "")}</dc:subject>`)
    .join("\n    ");

  oebps.file(
    "content.opf",
    `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${work.title.replace(/[<>&]/g, "")}</dc:title>
    <dc:creator>${work.author.replace(/[<>&]/g, "")}</dc:creator>
    <dc:language>${work.language}</dc:language>
    <dc:description>${work.summary.replace(/[<>&]/g, "")}</dc:description>
    ${allSubjects}
    <dc:identifier id="BookId">urn:uuid:${work.id}</dc:identifier>
  </metadata>
  <manifest>
    ${manifestItems.join("\n    ")}
  </manifest>
  <spine>
    ${spineItems.join("\n    ")}
  </spine>
</package>`
  );

  const blob = await zip.generateAsync({ type: "blob", mimeType: "application/epub+zip" });
  triggerBrowserDownload(blob, `${sanitizeFilename(work.title)}.epub`);
}

export async function exportWorkBundleZip(work: WorkItem) {
  const zip = new JSZip();
  const highlights = await db.highlights.where("workId").equals(work.id).toArray();
  const bookmarks = await db.bookmarks.where("workId").equals(work.id).toArray();
  const pinnedPages = await db.pinnedPages.where("workId").equals(work.id).toArray();

  const metadataJson = {
    exportedAt: new Date().toISOString(),
    work: { ...work, rawFileBlob: undefined },
    highlights,
    bookmarks,
    pinnedPages,
  };

  zip.file("metadata-tags-anotacoes.json", JSON.stringify(metadataJson, null, 2));
  zip.file(
    `${sanitizeFilename(work.title)}.html`,
    generateAo3HtmlDocument(work, highlights)
  );

  if (work.rawFileBlob && work.fileName) {
    zip.file(`original_${work.fileName}`, work.rawFileBlob as Blob);
  }

  const blob = await zip.generateAsync({ type: "blob" });
  triggerBrowserDownload(blob, `${sanitizeFilename(work.title)}_pacote_ao3.zip`);
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
