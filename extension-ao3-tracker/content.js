(function () {
  // Endereço do seu AO3 Personal Library (funciona tanto em produção na Vercel quanto no localhost!)
  const DEFAULT_APP_URL = "https://ao3-personal-library.vercel.app";

  function detectCurrentChapterNumber() {
    // 1. Verificar o dropdown de capítulos do AO3 (#selected_id)
    const selectEl = document.querySelector("#selected_id");
    if (selectEl && typeof selectEl.selectedIndex === "number" && selectEl.selectedIndex >= 0) {
      return selectEl.selectedIndex + 1;
    }

    // 2. Verificar o título do capítulo (ex: "Chapter 4")
    const chHeading = document.querySelector(".chapter .title a, .chapter h3.title");
    if (chHeading && chHeading.textContent) {
      const m = chHeading.textContent.match(/Chapter\s+(\d+)/i);
      if (m) return parseInt(m[1], 10);
    }

    // 3. Verificar dl.stats dd.chapters
    const chaptersDd = document.querySelector("dd.chapters");
    if (chaptersDd && chaptersDd.textContent) {
      const parts = chaptersDd.textContent.trim().split("/");
      const pub = parseInt(parts[0], 10);
      if (!isNaN(pub)) return pub;
    }

    return 1;
  }

  function injectAo3PersonalButton() {
    const workMatch = window.location.pathname.match(/\/works\/(\d+)/);
    if (!workMatch) return;

    const navActions =
      document.querySelector("ul.work.navigation.actions") ||
      document.querySelector("#GiveKudos")?.parentElement;

    if (!navActions || document.getElementById("ao3-personal-tracker-btn")) {
      return;
    }

    const currentChapter = detectCurrentChapterNumber();
    const chaptersDd = document.querySelector("dd.chapters")?.textContent?.trim() || "1/?";

    const li = document.createElement("li");
    li.id = "ao3-personal-tracker-btn";
    li.style.display = "inline-block";
    li.style.marginLeft = "6px";

    const btn = document.createElement("a");
    btn.href = "#";
    btn.textContent = `📌 Acompanhar no AO3 Personal (Estou no Cap. ${currentChapter} de ${chaptersDd})`;
    btn.style.backgroundColor = "#990000";
    btn.style.color = "#ffffff";
    btn.style.padding = "4px 10px";
    btn.style.borderRadius = "3px";
    btn.style.fontWeight = "bold";
    btn.style.textDecoration = "none";
    btn.style.border = "1px solid #700000";

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const chNow = detectCurrentChapterNumber();
      const targetUrl = `${DEFAULT_APP_URL}/tracker?ao3Url=${encodeURIComponent(
        window.location.href
      )}&chapter=${chNow}`;
      window.open(targetUrl, "_blank", "noopener,noreferrer");
    });

    li.appendChild(btn);
    navActions.appendChild(li);
  }

  injectAo3PersonalButton();
})();
