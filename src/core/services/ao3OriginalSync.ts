import { db } from "@/core/db/database";
import { AO3TrackedWork } from "@/types/work";

export interface SyncCheckSummary {
  totalChecked: number;
  newlyUpdatedWorksCount: number;
  totalUnreadChapters: number;
  updatedTitles: string[];
}

// Adiciona ou atualiza uma fanfic consultando diretamente o AO3 Original (archiveofourown.org)
export async function addOrSyncTrackedWorkFromAo3Url(
  urlOrId: string,
  manualChaptersRead?: number,
  notes?: string
): Promise<{ work: AO3TrackedWork; hadNewChapters: boolean }> {
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

  const id = `ao3-${data.ao3WorkId}`;
  const existing = await db.trackedAo3Works.get(id);

  const previousPublished = existing?.chaptersPublishedOnAo3 || 0;
  const newPublished = data.chaptersPublishedOnAo3 || 1;

  // Se o usuário informou manualmente em qual capítulo está, ou o link continha /chapters/XXXX, usa esse valor
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
    ao3WorkId: data.ao3WorkId,
    ao3Url: data.ao3Url,
    title: data.title,
    author: data.author,
    fandoms: data.fandoms,
    rating: data.rating,
    category: data.category,
    warningStatus: data.warningStatus,
    completionStatus: data.completionStatus,
    tags: data.tags,
    summary: data.summary,
    language: data.language,
    wordCount: data.wordCount,
    chaptersReadByMe: Math.min(chaptersReadByMe, newPublished),
    chaptersPublishedOnAo3: newPublished,
    chaptersTotalOnAo3: data.chaptersTotalOnAo3,
    chapterLinks: data.chapterLinks || [],
    ao3UpdatedAt: data.ao3UpdatedAt,
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
      if (
        hadNewChapters ||
        synced.chaptersPublishedOnAo3 > synced.chaptersReadByMe
      ) {
        if (hadNewChapters) {
          newlyUpdatedWorksCount++;
          updatedTitles.push(synced.title);
        }
      }
    } catch {
      // Se uma obra específica estiver offline/trancada, manter os dados atuais e continuar para a próxima
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
