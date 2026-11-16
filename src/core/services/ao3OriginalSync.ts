import { db } from "@/core/db/database";
import { AO3TrackedWork } from "@/types/work";

export interface SyncCheckSummary {
  totalChecked: number;
  newlyUpdatedWorksCount: number;
  totalUnreadChapters: number;
  updatedTitles: string[];
}

// Salva diretamente os dados extraídos do DOM do AO3 pela nossa Extensão (0ms e zero erro 525!)
export async function saveTrackedWorkFromPayload(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any,
  manualChaptersRead?: number,
  notes?: string
): Promise<{ work: AO3TrackedWork; hadNewChapters: boolean }> {
  const id = `ao3-${data.ao3WorkId}`;
  const existing = await db.trackedAo3Works.get(id);

  const previousPublished = existing?.chaptersPublishedOnAo3 || 0;
  const newPublished = data.chaptersPublishedOnAo3 || 1;

  const chaptersReadByMe =
    manualChaptersRead !== undefined
      ? manualChaptersRead
      : data.detectedChapterNumber !== null &&
        data.detectedChapterNumber !== undefined
      ? data.detectedChapterNumber
      : existing
      ? existing.chaptersReadByMe
      : Math.max(0, newPublished - 1);

  const trackedWork: AO3TrackedWork = {
    id,
    ao3WorkId: String(data.ao3WorkId),
    ao3Url:
      data.ao3Url || `https://archiveofourown.org/works/${data.ao3WorkId}`,
    title: data.title || `Obra AO3 #${data.ao3WorkId}`,
    author: data.author || "Autor AO3",
    fandoms:
      Array.isArray(data.fandoms) && data.fandoms.length > 0
        ? data.fandoms
        : ["AO3 Fandom"],
    rating: data.rating || "not_rated",
    category: data.category || "gen",
    warningStatus: data.warningStatus || "none",
    completionStatus: data.completionStatus || "wip",
    tags: data.tags || {
      warnings: ["Não se aplicam avisos de arquivo."],
      relationships: [],
      characters: [],
      freeforms: [],
    },
    summary:
      data.summary || "Fanfic acompanhada diretamente no AO3 Original.",
    language: data.language || "English",
    wordCount: Number(data.wordCount) || 0,
    chaptersReadByMe: Math.min(chaptersReadByMe, newPublished),
    chaptersPublishedOnAo3: newPublished,
    chaptersTotalOnAo3:
      data.chaptersTotalOnAo3 !== undefined ? data.chaptersTotalOnAo3 : null,
    chapterLinks: Array.isArray(data.chapterLinks) ? data.chapterLinks : [],
    ao3UpdatedAt: data.ao3UpdatedAt || new Date().toISOString().slice(0, 10),
    lastCheckedAt: new Date().toISOString(),
    lastReadAt: existing?.lastReadAt,
    notes: notes !== undefined ? notes : existing?.notes,
    isFavorite: existing?.isFavorite ?? false,
  };

  await db.trackedAo3Works.put(trackedWork);

  const hadNewChapters =
    existing !== undefined && newPublished > previousPublished;

  return { work: trackedWork, hadNewChapters };
}

// Tenta consultar o AO3 usando a ponte da Extensão instalada no navegador da usuária (sem bloqueio 525!)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function tryFetchViaExtensionBridge(urlOrId: string): Promise<any | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  const isExtInstalled =
    document.documentElement.getAttribute("data-ao3-extension-installed") ===
    "true";
  if (!isExtInstalled) return Promise.resolve(null);

  return new Promise((resolve) => {
    const requestId = `req-${Date.now()}-${Math.random()}`;
    const timeout = setTimeout(() => {
      window.removeEventListener("message", handler);
      resolve(null);
    }, 8000);

    const handler = (event: MessageEvent) => {
      if (
        event.data &&
        event.data.type === "AO3_PERSONAL_FETCH_RESPONSE" &&
        event.data.requestId === requestId
      ) {
        clearTimeout(timeout);
        window.removeEventListener("message", handler);
        if (event.data.ok && event.data.data) {
          resolve(event.data.data);
        } else {
          resolve(null);
        }
      }
    };

    window.addEventListener("message", handler);
    window.postMessage(
      {
        type: "AO3_PERSONAL_FETCH_REQUEST",
        requestId,
        urlOrId,
      },
      "*"
    );
  });
}

// Adiciona ou atualiza uma fanfic consultando primeiro via Extensão do Navegador e depois via /api/ao3-sync
export async function addOrSyncTrackedWorkFromAo3Url(
  urlOrId: string,
  manualChaptersRead?: number,
  notes?: string
): Promise<{ work: AO3TrackedWork; hadNewChapters: boolean }> {
  // 1. Tentar primeiro via Extensão do Navegador (roda direto na conexão residencial + cookies logados do AO3)
  const extData = await tryFetchViaExtensionBridge(urlOrId);
  if (extData) {
    return saveTrackedWorkFromPayload(extData, manualChaptersRead, notes);
  }

  // 2. Consultar via rota /api/ao3-sync (com espelhos anti-525)
  const res = await fetch("/api/ao3-sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ urlOrId }),
  });

  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(
      data.error || "Não foi possível ler os dados desta obra no AO3 Original."
    );
  }

  return saveTrackedWorkFromPayload(data, manualChaptersRead, notes);
}

// Busca todas as fanfics em que a usuária está inscrita (Subscriptions) na conta do AO3 via Extensão e adiciona ao acompanhamento!
export async function importAllUserSubscriptionsFromAo3(
  username?: string,
  onProgress?: (current: number, total: number, title: string) => void
): Promise<{ username: string; importedCount: number }> {
  if (typeof window === "undefined") {
    throw new Error("Disponível apenas no navegador.");
  }

  const isExtInstalled =
    document.documentElement.getAttribute("data-ao3-extension-installed") ===
    "true";

  if (!isExtInstalled) {
    throw new Error(
      "Para buscar suas Inscrições (Subscriptions) privadas do AO3 automaticamente, recarregue a nossa Extensão em chrome://extensions (ou edge://extensions) e dê F5 nesta página!"
    );
  }

  const subListResult = await new Promise<{
    username: string;
    subscriptions: Array<{ workId: string; title: string }>;
  }>((resolve, reject) => {
    const requestId = `sub-${Date.now()}`;
    const timeout = setTimeout(() => {
      window.removeEventListener("message", handler);
      reject(
        new Error(
          "Tempo esgotado ao consultar suas Subscriptions no AO3. Verifique se você está logada em archiveofourown.org neste navegador."
        )
      );
    }, 15000);

    const handler = (event: MessageEvent) => {
      if (
        event.data &&
        event.data.type === "AO3_PERSONAL_SUBSCRIPTIONS_RESPONSE" &&
        event.data.requestId === requestId
      ) {
        clearTimeout(timeout);
        window.removeEventListener("message", handler);
        if (event.data.ok && event.data.data) {
          resolve(event.data.data);
        } else {
          reject(
            new Error(
              event.data.error ||
                "Não foi possível listar suas Subscriptions do AO3."
            )
          );
        }
      }
    };

    window.addEventListener("message", handler);
    window.postMessage(
      {
        type: "AO3_PERSONAL_SUBSCRIPTIONS_REQUEST",
        requestId,
        username: username || "",
      },
      "*"
    );
  });

  const subs = subListResult.subscriptions || [];
  let importedCount = 0;

  for (let i = 0; i < subs.length; i++) {
    const item = subs[i];
    onProgress?.(i + 1, subs.length, item.title || `Obra #${item.workId}`);
    try {
      await addOrSyncTrackedWorkFromAo3Url(item.workId);
      importedCount++;
    } catch {
      // Continuar para a próxima inscrição mesmo se uma obra estiver indisponível
    }
  }

  return {
    username: subListResult.username,
    importedCount,
  };
}

// Percorre todas as fanfics acompanhadas e consulta o AO3 Original para ver quais atualizaram!
export async function checkAllTrackedWorksOnAo3Original(
  onProgress?: (current: number, total: number, title: string) => void
): Promise<SyncCheckSummary> {
  const allWorks = await db.trackedAo3Works.toArray();
  let newlyUpdatedWorksCount = 0;
  const updatedTitles: string[] = [];

  for (let i = 0; i < allWorks.length; i++) {
    const w = allWorks[i];
    onProgress?.(i + 1, allWorks.length, w.title);
    try {
      const { work: synced, hadNewChapters } =
        await addOrSyncTrackedWorkFromAo3Url(w.ao3WorkId);
      if (hadNewChapters) {
        newlyUpdatedWorksCount++;
        updatedTitles.push(synced.title);
      }
    } catch {
      await db.trackedAo3Works.update(w.id, {
        lastCheckedAt: new Date().toISOString(),
      });
    }
  }

  const refreshed = await db.trackedAo3Works.toArray();
  const totalUnreadChapters = refreshed.reduce(
    (acc, w) => acc + Math.max(0, w.chaptersPublishedOnAo3 - w.chaptersReadByMe),
    0
  );

  return {
    totalChecked: allWorks.length,
    newlyUpdatedWorksCount,
    totalUnreadChapters,
    updatedTitles,
  };
}
