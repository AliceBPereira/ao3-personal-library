import JSZip from "jszip";
import DOMPurify from "dompurify";
import { countWordsFromText } from "@/core/services/readingMetrics";
import { ParsedBookResult } from "./htmlAo3Parser";
import { WorkChapter } from "@/types/work";

function resolveRelativePath(basePath: string, relativePath: string): string {
  const baseParts = basePath.split("/");
  baseParts.pop(); // Remove filename
  const relParts = relativePath.split("/");
  for (const part of relParts) {
    if (part === "." || part === "") continue;
    if (part === "..") baseParts.pop();
    else baseParts.push(part);
  }
  return baseParts.join("/");
}

export async function parseEpubBook(file: File): Promise<ParsedBookResult> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  const parser = new DOMParser();

  // 1. Localizar META-INF/container.xml
  const containerXmlFile = zip.file("META-INF/container.xml");
  let opfPath = "";
  if (containerXmlFile) {
    const containerXml = await containerXmlFile.async("string");
    const containerDoc = parser.parseFromString(containerXml, "application/xml");
    const rootfile = containerDoc.querySelector("rootfile");
    opfPath = rootfile?.getAttribute("full-path") || "";
  }

  if (!opfPath) {
    // Fallback: procurar qualquer arquivo .opf no zip
    const opfEntry = Object.keys(zip.files).find((name) =>
      name.toLowerCase().endsWith(".opf")
    );
    opfPath = opfEntry || "";
  }

  let title = file.name.replace(/\.epub$/i, "");
  let author = "Autor Desconhecido";
  let summary = "";
  let language = "Português";
  const subjects: string[] = [];
  const chapters: WorkChapter[] = [];

  if (opfPath && zip.file(opfPath)) {
    const opfContent = await zip.file(opfPath)!.async("string");
    const opfDoc = parser.parseFromString(opfContent, "application/xml");

    const titleNode = opfDoc.querySelector("title, dc\\:title");
    if (titleNode?.textContent) title = titleNode.textContent.trim();

    const creatorNode = opfDoc.querySelector("creator, dc\\:creator");
    if (creatorNode?.textContent) author = creatorNode.textContent.trim();

    const descNode = opfDoc.querySelector("description, dc\\:description");
    if (descNode?.textContent) {
      summary = descNode.textContent.replace(/<[^>]*>/g, " ").trim();
    }

    const langNode = opfDoc.querySelector("language, dc\\:language");
    if (langNode?.textContent) language = langNode.textContent.trim();

    opfDoc.querySelectorAll("subject, dc\\:subject").forEach((el) => {
      const val = el.textContent?.trim();
      if (val) subjects.push(val);
    });

    // Mapear manifest id -> href
    const manifestMap = new Map<string, string>();
    opfDoc.querySelectorAll("manifest > item").forEach((item) => {
      const id = item.getAttribute("id");
      const href = item.getAttribute("href");
      if (id && href) {
        manifestMap.set(id, decodeURIComponent(href));
      }
    });

    // Ler spine na ordem
    const spineItemRefs = Array.from(opfDoc.querySelectorAll("spine > itemref"));
    let chapterIdx = 0;

    for (const itemref of spineItemRefs) {
      const idref = itemref.getAttribute("idref");
      if (!idref) continue;
      const href = manifestMap.get(idref);
      if (!href) continue;

      const resolvedPath = resolveRelativePath(opfPath, href).split("#")[0];
      const zipEntry =
        zip.file(resolvedPath) ||
        zip.file(href) ||
        Object.values(zip.files).find((f) => f.name.endsWith(href));

      if (!zipEntry) continue;

      const rawChapterHtml = await zipEntry.async("string");
      const chDoc = parser.parseFromString(rawChapterHtml, "text/html");
      const bodyText = chDoc.body?.textContent?.trim() || "";
      const words = countWordsFromText(bodyText);

      // Ignorar páginas em branco de capa se não tiverem texto
      if (words < 3 && spineItemRefs.length > 1) continue;

      const heading =
        chDoc.querySelector("h1, h2, h3, title")?.textContent?.trim() ||
        `Capítulo ${chapterIdx + 1}`;

      const sanitized = DOMPurify.sanitize(chDoc.body?.innerHTML || rawChapterHtml);

      chapters.push({
        id: `epub-ch-${chapterIdx + 1}`,
        index: chapterIdx,
        title: heading,
        htmlContent: sanitized,
        plainText: bodyText,
        wordCount: words,
      });
      chapterIdx++;
    }
  }

  // Fallback se nenhum capítulo foi lido pelo spine
  if (chapters.length === 0) {
    const htmlFiles = Object.values(zip.files).filter((f) =>
      /\.(xhtml|html|htm)$/i.test(f.name)
    );
    let idx = 0;
    for (const f of htmlFiles) {
      const text = await f.async("string");
      const doc = parser.parseFromString(text, "text/html");
      const plain = doc.body?.textContent?.trim() || "";
      const words = countWordsFromText(plain);
      if (words < 3 && htmlFiles.length > 1) continue;
      chapters.push({
        id: `epub-ch-${idx + 1}`,
        index: idx,
        title:
          doc.querySelector("h1, h2, h3")?.textContent?.trim() ||
          `Capítulo ${idx + 1}`,
        htmlContent: DOMPurify.sanitize(doc.body?.innerHTML || text),
        plainText: plain,
        wordCount: words,
      });
      idx++;
    }
  }

  const totalWords = chapters.reduce((acc, c) => acc + c.wordCount, 0);

  if (!summary && chapters.length > 0) {
    summary = chapters[0].plainText.slice(0, 360) + "...";
  }

  return {
    title,
    author,
    fandoms: subjects.length > 0 ? [subjects[0]] : ["Literatura / EPUB Importado"],
    rating: "not_rated",
    category: "gen",
    warningStatus: "none",
    completionStatus: "complete",
    tags: {
      warnings: ["Não se aplicam avisos de arquivo."],
      relationships: [],
      characters: [],
      freeforms: subjects.length > 1 ? subjects.slice(1) : ["EPUB", "Biblioteca Pessoal"],
    },
    summary: summary || "Livro importado em formato EPUB.",
    language,
    wordCount: totalWords,
    chaptersCurrent: chapters.length,
    chaptersTotal: chapters.length,
    chapters,
  };
}
