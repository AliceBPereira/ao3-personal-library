// Background Service Worker da Extensão (v1.3.0):
// 1. Lê obras individuais do AO3 diretamente pelo navegador logado da usuária (sem erro 525!).
// 2. Busca automaticamente TODAS as fanfics em que a usuária está inscrita (Subscriptions) na conta do AO3 Original!

function stripTags(html) {
  return (html || "")
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

function extractTagAnchors(html, ddClass) {
  const regex = new RegExp(
    `<dd[^>]*class="[^"]*\\b${ddClass}\\b[^"]*"[^>]*>([\\s\\S]*?)<\\/dd>`,
    "i"
  );
  const match = html.match(regex);
  if (!match) return [];
  const inner = match[1];
  const links = [];
  const aRegex = /<a[^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = aRegex.exec(inner)) !== null) {
    const t = stripTags(m[1]);
    if (t) links.push(t);
  }
  return links;
}

function extractDdText(html, ddClass) {
  const regex = new RegExp(
    `<dd[^>]*class="[^"]*\\b${ddClass}\\b[^"]*"[^>]*>([\\s\\S]*?)<\\/dd>`,
    "i"
  );
  const match = html.match(regex);
  return match ? stripTags(match[1]) : "";
}

function extractAo3Ids(input) {
  const trimmed = (input || "").trim();
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

async function fetchAo3WorkDirectlyInBrowser(urlOrId) {
  const { workId, chapterId } = extractAo3Ids(urlOrId);
  if (!workId) {
    throw new Error("Link ou ID do AO3 inválido.");
  }

  const workUrl = `https://archiveofourown.org/works/${workId}?view_adult=true`;
  const navigateUrl = `https://archiveofourown.org/works/${workId}/navigate`;

  const [workRes, navRes] = await Promise.all([
    fetch(workUrl, { credentials: "include", cache: "no-store" }),
    fetch(navigateUrl, { credentials: "include", cache: "no-store" }).catch(
      () => null
    ),
  ]);

  if (!workRes.ok) {
    throw new Error(
      `Status ${workRes.status} ao acessar obra #${workId} no AO3.`
    );
  }

  const html = await workRes.text();
  const navHtml = navRes && navRes.ok ? await navRes.text() : "";

  const titleMatch =
    html.match(/<h2[^>]*class="[^"]*\btitle\b[^"]*"[^>]*>([\s\S]*?)<\/h2>/i) ||
    html.match(/<title>([\s\S]*?)<\/title>/i);
  const title = titleMatch
    ? stripTags(titleMatch[1]).replace(/\s*-\s*Archive of Our Own.*$/i, "")
    : `Obra AO3 #${workId}`;

  const authorMatch = html.match(/<a[^>]*rel="author"[^>]*>([\s\S]*?)<\/a>/i);
  const author = authorMatch ? stripTags(authorMatch[1]) : "Autor AO3";

  const fandoms = extractTagAnchors(html, "fandom");
  const warnings = extractTagAnchors(html, "warning");
  const relationships = extractTagAnchors(html, "relationship");
  const characters = extractTagAnchors(html, "character");
  const freeforms = extractTagAnchors(html, "freeform");
  const ratingTags = extractTagAnchors(html, "rating").join(" ").toLowerCase();
  const categoryTags = extractTagAnchors(html, "category")
    .join(" ")
    .toLowerCase();

  let rating = "not_rated";
  if (ratingTags.includes("general")) rating = "general";
  else if (ratingTags.includes("teen")) rating = "teen";
  else if (ratingTags.includes("mature")) rating = "mature";
  else if (ratingTags.includes("explicit")) rating = "explicit";

  let category = "gen";
  if (categoryTags.includes("m/m")) category = "mm";
  else if (categoryTags.includes("f/f")) category = "ff";
  else if (categoryTags.includes("f/m")) category = "fm";
  else if (categoryTags.includes("multi")) category = "multi";

  let warningStatus = "none";
  const warnLower = warnings.join(" ").toLowerCase();
  if (warnLower.includes("chose not")) warningStatus = "chose_not";
  else if (
    warnings.length > 0 &&
    !warnLower.includes("no archive warnings apply")
  ) {
    warningStatus = "has_warnings";
  }

  const summaryMatch = html.match(
    /<div[^>]*class="[^"]*\bsummary\b[^"]*"[^>]*>[\s\S]*?<blockquote[^>]*>([\s\S]*?)<\/blockquote>/i
  );
  const summary = summaryMatch
    ? stripTags(summaryMatch[1])
    : "Fanfic acompanhada diretamente no AO3 Original.";

  const chaptersText = extractDdText(html, "chapters") || "1/1";
  const [pubStr, totalStr] = chaptersText.split("/").map((s) => s.trim());
  const chaptersPublishedOnAo3 = Math.max(1, parseInt(pubStr, 10) || 1);
  const chaptersTotalOnAo3 =
    totalStr && totalStr !== "?" && /^\d+$/.test(totalStr)
      ? parseInt(totalStr, 10)
      : null;

  const completionStatus =
    chaptersTotalOnAo3 !== null && chaptersPublishedOnAo3 >= chaptersTotalOnAo3
      ? "complete"
      : "wip";

  const wordsText = extractDdText(html, "words").replace(/[^\d]/g, "");
  const wordCount = parseInt(wordsText, 10) || 0;
  const language = extractDdText(html, "language") || "English";
  const updatedDate =
    extractDdText(html, "status") ||
    extractDdText(html, "published") ||
    new Date().toISOString().slice(0, 10);

  const chapterLinks = [];
  if (navHtml) {
    const olMatch = navHtml.match(
      /<ol[^>]*class="[^"]*\bchapter\b[^"]*"[^>]*>([\s\S]*?)<\/ol>/i
    );
    if (olMatch) {
      const liRegex =
        /<li[^>]*>\s*<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>\s*(?:<span[^>]*class="datetime"[^>]*>\(([^)]+)\)<\/span>)?/gi;
      let m;
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

  let detectedChapterNumber = null;
  if (chapterId && chapterLinks.length > 0) {
    const found = chapterLinks.find((c) => c.ao3ChapterId === chapterId);
    if (found) detectedChapterNumber = found.number;
  }

  return {
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
        warnings.length > 0 ? warnings : ["Não se aplicam avisos de arquivo."],
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
  };
}

// Descobre o username logado no AO3 e busca todas as páginas de Subscriptions de Fanfics (/users/USERNAME/subscriptions?type=works)
async function fetchAllUserSubscriptionsFromAo3(explicitUsername) {
  let username = (explicitUsername || "").trim();

  if (!username) {
    // Descobrir automaticamente o usuário logado no AO3 acessando a home com os cookies da sessão
    const homeRes = await fetch("https://archiveofourown.org/", {
      credentials: "include",
      cache: "no-store",
    });
    if (!homeRes.ok) {
      throw new Error(
        `Não foi possível acessar o AO3 (Status ${homeRes.status}). Verifique se você está logada em archiveofourown.org neste navegador.`
      );
    }
    const homeHtml = await homeRes.text();
    const userMatch =
      homeHtml.match(/href="\/users\/([^"/?#]+)\/subscriptions"/i) ||
      homeHtml.match(/href="\/users\/([^"/?#]+)"[^>]*>Hi,/i) ||
      homeHtml.match(/<a[^>]*href="\/users\/([^"/?#]+)"[^>]*>/i);

    if (userMatch && userMatch[1] && userMatch[1] !== "login") {
      username = userMatch[1];
    }
  }

  if (!username) {
    throw new Error(
      "Você precisa estar logada na sua conta em https://archiveofourown.org neste navegador (ou digitar seu nome de usuário do AO3) para buscar suas inscrições!"
    );
  }

  const workIds = [];
  const seenIds = new Set();

  // Percorrer até 10 páginas de Subscriptions (tanto na aba Works quanto geral)
  for (let page = 1; page <= 10; page++) {
    const subUrl = `https://archiveofourown.org/users/${encodeURIComponent(
      username
    )}/subscriptions?page=${page}`;
    const res = await fetch(subUrl, {
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) break;

    const html = await res.text();
    // Na página de Subscriptions do AO3, cada inscrição fica em <dt> com links /works/ID
    const regex = /<a[^>]*href="\/works\/(\d+)"[^>]*>([\s\S]*?)<\/a>/gi;
    let m;
    let foundOnThisPage = 0;
    while ((m = regex.exec(html)) !== null) {
      const wId = m[1];
      const wTitle = stripTags(m[2]);
      if (wId && !seenIds.has(wId)) {
        seenIds.add(wId);
        workIds.push({ workId: wId, title: wTitle });
        foundOnThisPage++;
      }
    }

    // Verificar se existe próxima página (<li class="next"><a ...>)
    const hasNextPage = /<li[^>]*class="[^"]*\bnext\b[^"]*"[^>]*>\s*<a/i.test(
      html
    );
    if (!hasNextPage || foundOnThisPage === 0) {
      break;
    }
  }

  return {
    username,
    subscriptions: workIds,
  };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message && message.type === "AO3_BG_FETCH_WORK") {
    fetchAo3WorkDirectlyInBrowser(message.urlOrId)
      .then((data) => sendResponse({ ok: true, data }))
      .catch((err) =>
        sendResponse({ ok: false, error: err?.message || "Erro ao ler AO3" })
      );
    return true;
  }

  if (message && message.type === "AO3_BG_FETCH_SUBSCRIPTIONS_LIST") {
    fetchAllUserSubscriptionsFromAo3(message.username)
      .then((result) => sendResponse({ ok: true, data: result }))
      .catch((err) =>
        sendResponse({
          ok: false,
          error:
            err?.message || "Erro ao buscar suas inscrições (Subscriptions).",
        })
      );
    return true;
  }
});
