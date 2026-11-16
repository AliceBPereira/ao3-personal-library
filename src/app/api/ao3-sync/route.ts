import { NextRequest, NextResponse } from "next/server";
import {
  AO3ChapterLinkItem,
  CategoryAO3,
  CompletionStatusAO3,
  RatingAO3,
  WarningStatusAO3,
} from "@/types/work";

function extractAo3IdsFromUrl(input: string): {
  workId: string | null;
  chapterId: string | null;
} {
  const trimmed = input.trim();
  if (/^\d+$/.test(trimmed)) {
    return { workId: trimmed, chapterId: null };
  }
  const workMatch = trimmed.match(/works\/(\d+)/i);
  const chapMatch = trimmed.match(/chapters\/(\d+)/i);
  return {
    workId: workMatch ? workMatch[1] : null,
    chapterId: chapMatch ? chapMatch[1] : null,
  };
}

function stripTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTagAnchors(html: string, ddClass: string): string[] {
  const regex = new RegExp(
    `<dd[^>]*class="[^"]*\\b${ddClass}\\b[^"]*"[^>]*>([\\s\\S]*?)<\\/dd>`,
    "i"
  );
  const match = html.match(regex);
  if (!match) return [];
  const inner = match[1];
  const links: string[] = [];
  const aRegex = /<a[^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = aRegex.exec(inner)) !== null) {
    const t = stripTags(m[1]);
    if (t) links.push(t);
  }
  return links;
}

function extractDdText(html: string, ddClass: string): string {
  const regex = new RegExp(
    `<dd[^>]*class="[^"]*\\b${ddClass}\\b[^"]*"[^>]*>([\\s\\S]*?)<\\/dd>`,
    "i"
  );
  const match = html.match(regex);
  return match ? stripTags(match[1]) : "";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const urlOrId: string = body?.urlOrId || "";
    const { workId, chapterId } = extractAo3IdsFromUrl(urlOrId);

    if (!workId) {
      return NextResponse.json(
        { error: "Link ou ID do AO3 inválido. Exemplo: https://archiveofourown.org/works/24989932" },
        { status: 400 }
      );
    }

    const workUrl = `https://archiveofourown.org/works/${workId}?view_adult=true`;
    const navigateUrl = `https://archiveofourown.org/works/${workId}/navigate`;

    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9,pt-BR;q=0.8",
      Cookie: "view_adult=true",
    };

    const [workRes, navRes] = await Promise.all([
      fetch(workUrl, { headers, cache: "no-store" }),
      fetch(navigateUrl, { headers, cache: "no-store" }).catch(() => null),
    ]);

    if (!workRes.ok) {
      return NextResponse.json(
        {
          error: `O AO3 Original retornou status ${workRes.status}. Se esta fanfic for trancada com cadeado (Locked Work), use o botão da nossa Extensão diretamente dentro da aba do AO3!`,
          status: workRes.status,
        },
        { status: 502 }
      );
    }

    const html = await workRes.text();
    const navHtml = navRes && navRes.ok ? await navRes.text() : "";

    // 1. Título e Autor no AO3 Original
    const titleMatch =
      html.match(/<h2[^>]*class="[^"]*\btitle\b[^"]*"[^>]*>([\s\S]*?)<\/h2>/i) ||
      html.match(/<title>([\s\S]*?)<\/title>/i);
    const title = titleMatch
      ? stripTags(titleMatch[1]).replace(/\s*-\s*Archive of Our Own.*$/i, "")
      : `Obra AO3 #${workId}`;

    const authorMatch = html.match(
      /<a[^>]*rel="author"[^>]*>([\s\S]*?)<\/a>/i
    );
    const author = authorMatch ? stripTags(authorMatch[1]) : "Autor AO3";

    // 2. Tags e Metadados do AO3 Original
    const fandoms = extractTagAnchors(html, "fandom");
    const warnings = extractTagAnchors(html, "warning");
    const relationships = extractTagAnchors(html, "relationship");
    const characters = extractTagAnchors(html, "character");
    const freeforms = extractTagAnchors(html, "freeform");
    const ratingTags = extractTagAnchors(html, "rating").join(" ").toLowerCase();
    const categoryTags = extractTagAnchors(html, "category")
      .join(" ")
      .toLowerCase();

    let rating: RatingAO3 = "not_rated";
    if (ratingTags.includes("general")) rating = "general";
    else if (ratingTags.includes("teen")) rating = "teen";
    else if (ratingTags.includes("mature")) rating = "mature";
    else if (ratingTags.includes("explicit")) rating = "explicit";

    let category: CategoryAO3 = "gen";
    if (categoryTags.includes("m/m")) category = "mm";
    else if (categoryTags.includes("f/f")) category = "ff";
    else if (categoryTags.includes("f/m")) category = "fm";
    else if (categoryTags.includes("multi")) category = "multi";

    let warningStatus: WarningStatusAO3 = "none";
    const warnLower = warnings.join(" ").toLowerCase();
    if (warnLower.includes("chose not")) warningStatus = "chose_not";
    else if (
      warnings.length > 0 &&
      !warnLower.includes("no archive warnings apply")
    ) {
      warningStatus = "has_warnings";
    }

    // 3. Sinopse
    const summaryMatch = html.match(
      /<div[^>]*class="[^"]*\bsummary\b[^"]*"[^>]*>[\s\S]*?<blockquote[^>]*>([\s\S]*?)<\/blockquote>/i
    );
    const summary = summaryMatch
      ? stripTags(summaryMatch[1])
      : "Fanfic acompanhada diretamente no AO3 Original.";

    // 4. Estatísticas do AO3 Original (dd.chapters, dd.words, dd.status, dd.published, dd.language)
    const chaptersText = extractDdText(html, "chapters") || "1/1"; // Ex: "6/?" ou "12/15"
    const [pubStr, totalStr] = chaptersText.split("/").map((s) => s.trim());
    const chaptersPublishedOnAo3 = Math.max(1, parseInt(pubStr, 10) || 1);
    const chaptersTotalOnAo3 =
      totalStr && totalStr !== "?" && /^\d+$/.test(totalStr)
        ? parseInt(totalStr, 10)
        : null;

    const completionStatus: CompletionStatusAO3 =
      chaptersTotalOnAo3 !== null &&
      chaptersPublishedOnAo3 >= chaptersTotalOnAo3
        ? "complete"
        : "wip";

    const wordsText = extractDdText(html, "words").replace(/[^\d]/g, "");
    const wordCount = parseInt(wordsText, 10) || 0;
    const language = extractDdText(html, "language") || "English";
    const updatedDate =
      extractDdText(html, "status") ||
      extractDdText(html, "published") ||
      new Date().toISOString().slice(0, 10);

    // 5. Lista completa de Capítulos do AO3 Original (/works/ID/navigate)
    const chapterLinks: AO3ChapterLinkItem[] = [];
    if (navHtml) {
      const olMatch = navHtml.match(
        /<ol[^>]*class="[^"]*\bchapter\b[^"]*"[^>]*>([\s\S]*?)<\/ol>/i
      );
      if (olMatch) {
        const liRegex =
          /<li[^>]*>\s*<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>\s*(?:<span[^>]*class="datetime"[^>]*>\(([^)]+)\)<\/span>)?/gi;
        let m: RegExpExecArray | null;
        let idx = 1;
        while ((m = liRegex.exec(olMatch[1])) !== null) {
          const href = m[1];
          const chTitle = stripTags(m[2]);
          const pubDate = m[3] ? stripTags(m[3]) : undefined;
          const cIdMatch = href.match(/chapters\/(\d+)/i);
          chapterLinks.push({
            number: idx,
            ao3ChapterId: cIdMatch ? cIdMatch[1] : undefined,
            title: chTitle,
            publishedDate: pubDate,
            url: href.startsWith("http")
              ? href
              : `https://archiveofourown.org${href}`,
          });
          idx++;
        }
      }
    }

    if (chapterLinks.length === 0) {
      for (let i = 1; i <= chaptersPublishedOnAo3; i++) {
        chapterLinks.push({
          number: i,
          title: `Capítulo ${i}`,
          url: `https://archiveofourown.org/works/${workId}`,
        });
      }
    }

    // Se o usuário colou uma URL que tinha um chapterId específico, descobrir o número daquele capítulo!
    let detectedChapterNumber: number | null = null;
    if (chapterId && chapterLinks.length > 0) {
      const found = chapterLinks.find((c) => c.ao3ChapterId === chapterId);
      if (found) {
        detectedChapterNumber = found.number;
      }
    }

    return NextResponse.json({
      ao3WorkId: workId,
      ao3Url: `https://archiveofourown.org/works/${workId}`,
      title,
      author,
      fandoms: fandoms.length > 0 ? fandoms : ["AO3 Fandom"],
      rating,
      category,
      warningStatus,
      completionStatus,
      tags: {
        warnings:
          warnings.length > 0
            ? warnings
            : ["Não se aplicam avisos de arquivo."],
        relationships,
        characters,
        freeforms,
      },
      summary,
      language,
      wordCount,
      chaptersPublishedOnAo3: Math.max(
        chaptersPublishedOnAo3,
        chapterLinks.length
      ),
      chaptersTotalOnAo3,
      chapterLinks,
      ao3UpdatedAt: updatedDate,
      detectedChapterNumber,
    });
  } catch (error) {
    console.error("Error syncing with AO3 Original:", error);
    return NextResponse.json(
      {
        error:
          "Não foi possível conectar diretamente ao AO3 Original neste momento.",
      },
      { status: 500 }
    );
  }
}
