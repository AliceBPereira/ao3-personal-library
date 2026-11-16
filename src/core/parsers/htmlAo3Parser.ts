import DOMPurify from "dompurify";
import { countWordsFromText } from "@/core/services/readingMetrics";
import {
  CategoryAO3,
  CompletionStatusAO3,
  RatingAO3,
  WarningStatusAO3,
  WorkChapter,
  WorkTags,
} from "@/types/work";

export interface ParsedBookResult {
  title: string;
  author: string;
  fandoms: string[];
  rating: RatingAO3;
  category: CategoryAO3;
  warningStatus: WarningStatusAO3;
  completionStatus: CompletionStatusAO3;
  tags: WorkTags;
  summary: string;
  language: string;
  wordCount: number;
  chaptersCurrent: number;
  chaptersTotal: number | null;
  chapters: WorkChapter[];
}

export async function parseHtmlBook(file: File): Promise<ParsedBookResult> {
  const rawText = await file.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawText, "text/html");

  // Detectar se é um HTML exportado do AO3
  const titleEl =
    doc.querySelector("#preface h1") ||
    doc.querySelector("h1.heading") ||
    doc.querySelector("title") ||
    doc.querySelector("h1");
  const title =
    titleEl?.textContent?.trim() || file.name.replace(/\.(html|htm)$/i, "");

  const authorEl =
    doc.querySelector('#preface a[rel="author"]') ||
    doc.querySelector('a[rel="author"]') ||
    doc.querySelector('meta[name="author"]');
  const author =
    authorEl?.getAttribute("content") ||
    authorEl?.textContent?.trim() ||
    "Autor Desconhecido";

  // Extrair tags de dl.tags (formato padrão do HTML baixado do AO3)
  const extractTagsByLabel = (keywords: string[]): string[] => {
    const dts = Array.from(doc.querySelectorAll("dt"));
    for (const dt of dts) {
      const label = (dt.textContent || "").toLowerCase();
      if (keywords.some((k) => label.includes(k))) {
        const dd = dt.nextElementSibling;
        if (dd && dd.tagName.toLowerCase() === "dd") {
          const links = Array.from(dd.querySelectorAll("a"));
          if (links.length > 0) {
            return links.map((a) => a.textContent?.trim() || "").filter(Boolean);
          }
          return (dd.textContent || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        }
      }
    }
    return [];
  };

  const fandoms = extractTagsByLabel(["fandom", "fandoms"]);
  const warnings = extractTagsByLabel(["warning", "aviso", "archive warning"]);
  const relationships = extractTagsByLabel(["relationship", "relacionamento"]);
  const characters = extractTagsByLabel(["character", "personagem", "personagens"]);
  const freeforms = extractTagsByLabel(["additional", "freeform", "adicionais"]);
  const ratingText = extractTagsByLabel(["rating", "classificação", "avaliação"]).join(" ").toLowerCase();
  const categoryText = extractTagsByLabel(["category", "categoria"]).join(" ").toLowerCase();

  let rating: RatingAO3 = "not_rated";
  if (ratingText.includes("general") || ratingText.includes("livre") || ratingText.includes("geral")) rating = "general";
  else if (ratingText.includes("teen") || ratingText.includes("adolescente")) rating = "teen";
  else if (ratingText.includes("mature") || ratingText.includes("maduro")) rating = "mature";
  else if (ratingText.includes("explicit") || ratingText.includes("explícito")) rating = "explicit";

  let category: CategoryAO3 = "gen";
  if (categoryText.includes("m/m")) category = "mm";
  else if (categoryText.includes("f/f")) category = "ff";
  else if (categoryText.includes("f/m")) category = "fm";
  else if (categoryText.includes("multi")) category = "multi";

  let warningStatus: WarningStatusAO3 = "none";
  const warnJoin = warnings.join(" ").toLowerCase();
  if (warnJoin.includes("chose not") || warnJoin.includes("optou por não")) {
    warningStatus = "chose_not";
  } else if (
    warnings.length > 0 &&
    !warnJoin.includes("no archive warnings") &&
    !warnJoin.includes("não se aplicam")
  ) {
    warningStatus = "has_warnings";
  }

  // Sinopse
  const summaryNode =
    doc.querySelector("#preface blockquote.userstuff") ||
    doc.querySelector(".summary blockquote") ||
    doc.querySelector('meta[name="description"]');
  const summary =
    summaryNode?.getAttribute?.("content") ||
    summaryNode?.textContent?.trim() ||
    "Obra importada em formato HTML.";

  // Capítulos no HTML do AO3 (#chapters > .chapter) ou seções/h2 gerais
  const chapterNodes = Array.from(
    doc.querySelectorAll("#chapters > .chapter, div.chapter, section.chapter")
  );

  const chapters: WorkChapter[] = [];

  if (chapterNodes.length > 0) {
    chapterNodes.forEach((node, idx) => {
      const chTitle =
        node.querySelector("h2, h3, .title")?.textContent?.trim() ||
        `Capítulo ${idx + 1}`;
      const userstuff = node.querySelector(".userstuff") || node;
      const cleanHtml = DOMPurify.sanitize(userstuff.innerHTML);
      const plain = userstuff.textContent?.trim() || "";
      chapters.push({
        id: `ch-${idx + 1}`,
        index: idx,
        title: chTitle,
        htmlContent: cleanHtml,
        plainText: plain,
        wordCount: countWordsFromText(plain),
      });
    });
  } else {
    const bodyHtml = doc.body?.innerHTML || rawText;
    const cleanHtml = DOMPurify.sanitize(bodyHtml);
    const plain = doc.body?.textContent?.trim() || "";
    chapters.push({
      id: "ch-1",
      index: 0,
      title: "Capítulo 1",
      htmlContent: cleanHtml,
      plainText: plain,
      wordCount: countWordsFromText(plain),
    });
  }

  const totalWords = chapters.reduce((acc, c) => acc + c.wordCount, 0);

  return {
    title,
    author,
    fandoms: fandoms.length > 0 ? fandoms : ["Fandom Original / Importado"],
    rating,
    category,
    warningStatus,
    completionStatus: "complete",
    tags: {
      warnings:
        warnings.length > 0
          ? warnings
          : ["Não se aplicam avisos de arquivo."],
      relationships,
      characters,
      freeforms: freeforms.length > 0 ? freeforms : ["Importado via HTML"],
    },
    summary,
    language: doc.documentElement.lang || "Português",
    wordCount: totalWords,
    chaptersCurrent: chapters.length,
    chaptersTotal: chapters.length,
    chapters,
  };
}
