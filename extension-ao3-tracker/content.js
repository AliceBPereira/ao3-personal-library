(function () {
  const APP_URL = "https://ao3-personal-library.vercel.app";

  function detectCurrentChapterNumber() {
    // 1. Verificar o seletor de capítulos oficial do AO3 (#selected_id)
    const selectEl = document.querySelector("#selected_id");
    if (
      selectEl &&
      typeof selectEl.selectedIndex === "number" &&
      selectEl.selectedIndex >= 0
    ) {
      return selectEl.selectedIndex + 1;
    }

    // 2. Verificar o título do capítulo na página (ex: "Chapter 4: ...")
    const chHeading = document.querySelector(
      ".chapter .title a, .chapter h3.title"
    );
    if (chHeading && chHeading.textContent) {
      const m = chHeading.textContent.match(/Chapter\s+(\d+)/i);
      if (m) return parseInt(m[1], 10);
    }

    // 3. Caso seja capítulo único (1/1)
    return 1;
  }

  function getPublishedChaptersText() {
    const chaptersDd = document.querySelector("dd.chapters");
    return chaptersDd ? chaptersDd.textContent.trim() : "1/?";
  }

  function openTrackerWithWork(workUrl, chapterNum) {
    const targetUrl = `${APP_URL}/tracker?ao3Url=${encodeURIComponent(
      workUrl
    )}&chapter=${chapterNum}`;
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  }

  // 1. Injetar botão no topo da fanfic E barra flutuante no canto inferior direito enquanto você lê no AO3 Oficial
  function setupSingleWorkPage() {
    const workMatch = window.location.pathname.match(/^\/works\/(\d+)/);
    if (!workMatch) return;

    const currentChapter = detectCurrentChapterNumber();
    const chaptersText = getPublishedChaptersText();

    // A) Botão na barra superior da fanfic no AO3 (ao lado de Bookmark / Subscribe / Download)
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
      btn.textContent = `📌 Acompanhar no AO3 Personal (Cap. ${currentChapter} de ${chaptersText})`;
      btn.style.backgroundColor = "#990000";
      btn.style.color = "#ffffff";
      btn.style.padding = "4px 10px";
      btn.style.borderRadius = "3px";
      btn.style.fontWeight = "bold";
      btn.style.textDecoration = "none";
      btn.style.border = "1px solid #700000";

      btn.addEventListener("click", (e) => {
        e.preventDefault();
        openTrackerWithWork(window.location.href, detectCurrentChapterNumber());
      });

      li.appendChild(btn);
      navActions.appendChild(li);
    }

    // B) Pílula Flutuante no Canto Inferior Direito (Sempre acessível mesmo no meio da leitura!)
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
      label.textContent = `📖 Cap. ${currentChapter} (${chaptersText})`;
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
        openTrackerWithWork(window.location.href, detectCurrentChapterNumber());
      });

      bar.appendChild(label);
      bar.appendChild(saveBtn);
      document.body.appendChild(bar);
    }
  }

  // 2. Injetar botão "+ Acompanhar" também em cada Card de Fanfic nas páginas de busca/tags do AO3 Oficial!
  function setupSearchAndTagListings() {
    const blurbs = document.querySelectorAll("li.work.blurb.group");
    blurbs.forEach((blurb) => {
      if (blurb.querySelector(".ao3-personal-card-btn")) return;
      const titleLink = blurb.querySelector("h4.heading a[href^='/works/']");
      if (!titleLink) return;

      const workHref = titleLink.getAttribute("href");
      const fullWorkUrl = `https://archiveofourown.org${workHref}`;

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
        openTrackerWithWork(fullWorkUrl, 1);
      });

      heading.appendChild(btn);
    });
  }

  setupSingleWorkPage();
  setupSearchAndTagListings();
})();
