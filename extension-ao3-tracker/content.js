(function () {
  const APP_URL = "https://ao3-personal-library.vercel.app";
  const host = window.location.hostname;

  // ==========================================================================
  // PARTE 1: QUANDO ESTÁ NO SITE AO3 PERSONAL LIBRARY (VERCEL OU LOCALHOST)
  // Atua como ponte direta para buscar dados do AO3 pelo navegador da usuária (Sem erro 525!)
  // ==========================================================================
  if (
    host.includes("ao3-personal-library.vercel.app") ||
    host === "localhost"
  ) {
    document.documentElement.setAttribute("data-ao3-extension-installed", "true");

    window.addEventListener("message", (event) => {
      if (event.source !== window) return;
      if (event.data && event.data.type === "AO3_PERSONAL_FETCH_REQUEST") {
        const { requestId, urlOrId } = event.data;
        chrome.runtime.sendMessage(
          { type: "AO3_BG_FETCH_WORK", urlOrId },
          (response) => {
            window.postMessage(
              {
                type: "AO3_PERSONAL_FETCH_RESPONSE",
                requestId,
                ok: response?.ok || false,
                data: response?.data || null,
                error: response?.error || null,
              },
              "*"
            );
          }
        );
      }
    });
    return;
  }

  // ==========================================================================
  // PARTE 2: QUANDO ESTÁ NAVEGANDO E LENDO NO AO3 OFICIAL (archiveofourown.org)
  // Extrai todos os dados direto da página aberta na hora (0ms e zero erro 525!)
  // ==========================================================================
  function detectCurrentChapterNumber() {
    const selectEl = document.querySelector("#selected_id");
    if (
      selectEl &&
      typeof selectEl.selectedIndex === "number" &&
      selectEl.selectedIndex >= 0
    ) {
      return selectEl.selectedIndex + 1;
    }

    const chHeading = document.querySelector(
      ".chapter .title a, .chapter h3.title"
    );
    if (chHeading && chHeading.textContent) {
      const m = chHeading.textContent.match(/Chapter\s+(\d+)/i);
      if (m) return parseInt(m[1], 10);
    }

    return 1;
  }

  function getTextsFromSelector(selector) {
    return Array.from(document.querySelectorAll(selector))
      .map((el) => (el.textContent || "").trim())
      .filter(Boolean);
  }

  // Extrai todos os dados diretamente da página do AO3 que já está aberta na sua frente!
  function scrapeWorkDataDirectlyFromOpenDom() {
    const workMatch = window.location.pathname.match(/\/works\/(\d+)/);
    const workId = workMatch ? workMatch[1] : "";
    if (!workId) return null;

    const title =
      document
        .querySelector("h2.title.heading")
        ?.textContent?.trim() ||
      document.title.replace(/\s*-\s*Archive of Our Own.*$/i, "").trim() ||
      `Obra AO3 #${workId}`;

    const author =
      document
        .querySelector("h3.byline.heading a[rel='author'], a[rel='author']")
        ?.textContent?.trim() || "Autor AO3";

    const fandoms = getTextsFromSelector("dd.fandom.tags a");
    const warnings = getTextsFromSelector("dd.warning.tags a");
    const relationships = getTextsFromSelector("dd.relationship.tags a");
    const characters = getTextsFromSelector("dd.character.tags a");
    const freeforms = getTextsFromSelector("dd.freeform.tags a");
    const ratingText = getTextsFromSelector("dd.rating.tags a")
      .join(" ")
      .toLowerCase();
    const categoryText = getTextsFromSelector("dd.category.tags a")
      .join(" ")
      .toLowerCase();

    let rating = "not_rated";
    if (ratingText.includes("general")) rating = "general";
    else if (ratingText.includes("teen")) rating = "teen";
    else if (ratingText.includes("mature")) rating = "mature";
    else if (ratingText.includes("explicit")) rating = "explicit";

    let category = "gen";
    if (categoryText.includes("m/m")) category = "mm";
    else if (categoryText.includes("f/f")) category = "ff";
    else if (categoryText.includes("f/m")) category = "fm";
    else if (categoryText.includes("multi")) category = "multi";

    let warningStatus = "none";
    const warnLower = warnings.join(" ").toLowerCase();
    if (warnLower.includes("chose not")) warningStatus = "chose_not";
    else if (
      warnings.length > 0 &&
      !warnLower.includes("no archive warnings apply")
    ) {
      warningStatus = "has_warnings";
    }

    const summary =
      document
        .querySelector(".summary blockquote.userstuff")
        ?.textContent?.trim() ||
      "Fanfic acompanhada diretamente do AO3 Original.";

    const chaptersText =
      document.querySelector("dd.chapters")?.textContent?.trim() || "1/1";
    const [pubStr, totalStr] = chaptersText.split("/").map((s) => s.trim());
    const chaptersPublishedOnAo3 = Math.max(1, parseInt(pubStr, 10) || 1);
    const chaptersTotalOnAo3 =
      totalStr && totalStr !== "?" && /^\d+$/.test(totalStr)
        ? parseInt(totalStr, 10)
        : null;

    const completionStatus =
      chaptersTotalOnAo3 !== null &&
      chaptersPublishedOnAo3 >= chaptersTotalOnAo3
        ? "complete"
        : "wip";

    const wordsRaw =
      document
        .querySelector("dd.words")
        ?.textContent?.replace(/[^\d]/g, "") || "0";
    const wordCount = parseInt(wordsRaw, 10) || 0;
    const language =
      document.querySelector("dd.language")?.textContent?.trim() || "English";
    const ao3UpdatedAt =
      document.querySelector("dd.status")?.textContent?.trim() ||
      document.querySelector("dd.published")?.textContent?.trim() ||
      new Date().toISOString().slice(0, 10);

    // Extrair links dos capítulos direto do dropdown #selected_id se existir na página
    const chapterLinks = [];
    const selectEl = document.querySelector("#selected_id");
    if (selectEl) {
      const options = Array.from(selectEl.querySelectorAll("option"));
      options.forEach((opt, idx) => {
        const chapId = opt.getAttribute("value");
        const chTitle = (opt.textContent || `Capítulo ${idx + 1}`).trim();
        chapterLinks.push({
          number: idx + 1,
          ao3ChapterId: chapId || undefined,
          title: chTitle,
          url: chapId
            ? `https://archiveofourown.org/works/${workId}/chapters/${chapId}`
            : `https://archiveofourown.org/works/${workId}`,
        });
      });
    } else {
      for (let i = 1; i <= chaptersPublishedOnAo3; i++) {
        chapterLinks.push({
          number: i,
          title: `Capítulo ${i}`,
          url: `https://archiveofourown.org/works/${workId}`,
        });
      }
    }

    const currentChapter = detectCurrentChapterNumber();

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
      ao3UpdatedAt,
      detectedChapterNumber: currentChapter,
    };
  }

  // Extrai dados de um Card de Busca/Tag do AO3 (li.work.blurb.group) diretamente da página aberta!
  function scrapeWorkDataFromBlurbCard(blurb) {
    const titleLink = blurb.querySelector("h4.heading a[href^='/works/']");
    if (!titleLink) return null;
    const href = titleLink.getAttribute("href") || "";
    const workMatch = href.match(/\/works\/(\d+)/);
    if (!workMatch) return null;
    const workId = workMatch[1];

    const title = (titleLink.textContent || "").trim();
    const author =
      blurb
        .querySelector("h4.heading a[rel='author']")
        ?.textContent?.trim() || "Autor AO3";
    const fandoms = Array.from(blurb.querySelectorAll("h5.fandoms.heading a"))
      .map((a) => (a.textContent || "").trim())
      .filter(Boolean);

    const warnings = Array.from(blurb.querySelectorAll("li.warnings a"))
      .map((a) => (a.textContent || "").trim())
      .filter(Boolean);
    const relationships = Array.from(
      blurb.querySelectorAll("li.relationships a")
    )
      .map((a) => (a.textContent || "").trim())
      .filter(Boolean);
    const characters = Array.from(blurb.querySelectorAll("li.characters a"))
      .map((a) => (a.textContent || "").trim())
      .filter(Boolean);
    const freeforms = Array.from(blurb.querySelectorAll("li.freeforms a"))
      .map((a) => (a.textContent || "").trim())
      .filter(Boolean);

    const summary =
      blurb.querySelector("blockquote.userstuff.summary")?.textContent?.trim() ||
      "Fanfic acompanhada diretamente do AO3 Original.";

    const chaptersText =
      blurb.querySelector("dd.chapters")?.textContent?.trim() || "1/1";
    const [pubStr, totalStr] = chaptersText.split("/").map((s) => s.trim());
    const chaptersPublishedOnAo3 = Math.max(1, parseInt(pubStr, 10) || 1);
    const chaptersTotalOnAo3 =
      totalStr && totalStr !== "?" && /^\d+$/.test(totalStr)
        ? parseInt(totalStr, 10)
        : null;

    const completionStatus =
      chaptersTotalOnAo3 !== null &&
      chaptersPublishedOnAo3 >= chaptersTotalOnAo3
        ? "complete"
        : "wip";

    const wordsRaw =
      blurb.querySelector("dd.words")?.textContent?.replace(/[^\d]/g, "") ||
      "0";
    const wordCount = parseInt(wordsRaw, 10) || 0;
    const language =
      blurb.querySelector("dd.language")?.textContent?.trim() || "English";
    const ao3UpdatedAt =
      blurb.querySelector("p.datetime")?.textContent?.trim() ||
      new Date().toISOString().slice(0, 10);

    const chapterLinks = [];
    for (let i = 1; i <= chaptersPublishedOnAo3; i++) {
      chapterLinks.push({
        number: i,
        title: `Capítulo ${i}`,
        url: `https://archiveofourown.org/works/${workId}`,
      });
    }

    return {
      ao3WorkId: workId,
      ao3Url: `https://archiveofourown.org/works/${workId}`,
      title,
      author,
      fandoms: fandoms.length > 0 ? fandoms : ["AO3 Fandom"],
      rating: "not_rated",
      category: "mm",
      warningStatus: "none",
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
      chaptersPublishedOnAo3,
      chaptersTotalOnAo3,
      chapterLinks,
      ao3UpdatedAt,
      detectedChapterNumber: 1,
    };
  }

  function sendPayloadToTrackerApp(payload) {
    const jsonStr = JSON.stringify(payload);
    const encoded = encodeURIComponent(jsonStr);
    const targetUrl = `${APP_URL}/tracker?ao3Payload=${encoded}`;
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  }

  function setupSingleWorkPage() {
    const workMatch = window.location.pathname.match(/^\/works\/(\d+)/);
    if (!workMatch) return;

    const currentChapter = detectCurrentChapterNumber();
    const chaptersDd =
      document.querySelector("dd.chapters")?.textContent?.trim() || "1/?";

    const navActions =
      document.querySelector("ul.work.navigation.actions") ||
      document.querySelector("#GiveKudos")?.parentElement;

    if (navActions && !document.getElementById("ao3-personal-top-btn")) {
      const li = document.createElement("li");
      li.id = "ao3-personal-top-btn";
      li.style.display = "inline-block";
      li.style.marginLeft = "6px";

      const btn = document.createElement("a");
      btn.href = "#";
      btn.textContent = `📌 Acompanhar no AO3 Personal (Cap. ${currentChapter} de ${chaptersDd})`;
      btn.style.backgroundColor = "#990000";
      btn.style.color = "#ffffff";
      btn.style.padding = "4px 10px";
      btn.style.borderRadius = "3px";
      btn.style.fontWeight = "bold";
      btn.style.textDecoration = "none";
      btn.style.border = "1px solid #700000";

      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const data = scrapeWorkDataDirectlyFromOpenDom();
        if (data) sendPayloadToTrackerApp(data);
      });

      li.appendChild(btn);
      navActions.appendChild(li);
    }

    if (!document.getElementById("ao3-personal-floating-bar")) {
      const bar = document.createElement("div");
      bar.id = "ao3-personal-floating-bar";
      bar.style.position = "fixed";
      bar.style.bottom = "16px";
      bar.style.right = "16px";
      bar.style.zIndex = "99999";
      bar.style.backgroundColor = "#990000";
      bar.style.color = "#ffffff";
      bar.style.padding = "8px 12px";
      bar.style.borderRadius = "6px";
      bar.style.boxShadow = "0 4px 14px rgba(0,0,0,0.3)";
      bar.style.fontFamily = '"Lucida Grande", Verdana, sans-serif';
      bar.style.fontSize = "12px";
      bar.style.display = "flex";
      bar.style.alignItems = "center";
      bar.style.gap = "8px";
      bar.style.border = "1px solid #ffffff55";

      const label = document.createElement("span");
      label.textContent = `📖 Cap. ${currentChapter} (${chaptersDd})`;
      label.style.fontWeight = "bold";

      const saveBtn = document.createElement("button");
      saveBtn.textContent = "📌 + Salvar / Acompanhar Fic";
      saveBtn.style.backgroundColor = "#ffffff";
      saveBtn.style.color = "#990000";
      saveBtn.style.border = "none";
      saveBtn.style.padding = "4px 9px";
      saveBtn.style.borderRadius = "4px";
      saveBtn.style.fontWeight = "bold";
      saveBtn.style.cursor = "pointer";
      saveBtn.style.fontSize = "11.5px";

      saveBtn.addEventListener("click", () => {
        const data = scrapeWorkDataDirectlyFromOpenDom();
        if (data) sendPayloadToTrackerApp(data);
      });

      bar.appendChild(label);
      bar.appendChild(saveBtn);
      document.body.appendChild(bar);
    }
  }

  function setupSearchAndTagListings() {
    const blurbs = document.querySelectorAll("li.work.blurb.group");
    blurbs.forEach((blurb) => {
      if (blurb.querySelector(".ao3-personal-card-btn")) return;
      const heading = blurb.querySelector("h4.heading");
      if (!heading) return;

      const btn = document.createElement("button");
      btn.className = "ao3-personal-card-btn";
      btn.type = "button";
      btn.textContent = "📌 + Acompanhar";
      btn.style.marginLeft = "8px";
      btn.style.padding = "2px 7px";
      btn.style.fontSize = "11px";
      btn.style.backgroundColor = "#990000";
      btn.style.color = "#ffffff";
      btn.style.border = "none";
      btn.style.borderRadius = "3px";
      btn.style.cursor = "pointer";
      btn.style.fontWeight = "bold";

      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const data = scrapeWorkDataFromBlurbCard(blurb);
        if (data) sendPayloadToTrackerApp(data);
      });

      heading.appendChild(btn);
    });
  }

  setupSingleWorkPage();
  setupSearchAndTagListings();
})();
