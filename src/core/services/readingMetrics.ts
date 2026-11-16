import { WorkChapter, WorkItem } from "@/types/work";

export const DEFAULT_WPM = 230; // Palavras por minuto padrão

export function countWordsFromText(text: string): number {
  const cleaned = text
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return 0;
  return cleaned.split(" ").length;
}

export function formatReadingTime(wordCount: number, wpm: number = DEFAULT_WPM): string {
  if (!wordCount || wordCount <= 0) return "< 1 min";
  const totalMinutes = Math.ceil(wordCount / wpm);
  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function calculateRealtimeMetrics(
  work: WorkItem,
  currentChapterIndex: number,
  chapterProgressPercent: number, // 0 a 100
  wpm: number = DEFAULT_WPM
) {
  const chapters: WorkChapter[] = work.chapters || [];
  const currentChapter = chapters[currentChapterIndex];

  const currentChapterWords = currentChapter?.wordCount || work.wordCount;
  const currentChapterWordsRead = Math.round(
    (currentChapterWords * Math.min(100, Math.max(0, chapterProgressPercent))) / 100
  );
  const currentChapterWordsRemaining = Math.max(0, currentChapterWords - currentChapterWordsRead);

  // Palavras dos capítulos anteriores
  const previousChaptersWords = chapters
    .slice(0, currentChapterIndex)
    .reduce((acc, ch) => acc + ch.wordCount, 0);

  const totalWordsRead = previousChaptersWords + currentChapterWordsRead;
  const totalWorkWords = work.wordCount || chapters.reduce((acc, ch) => acc + ch.wordCount, 0) || 1;
  const totalWordsRemaining = Math.max(0, totalWorkWords - totalWordsRead);

  const overallPercent = Math.min(100, Math.round((totalWordsRead / totalWorkWords) * 100));

  return {
    chapterTimeRemaining: formatReadingTime(currentChapterWordsRemaining, wpm),
    bookTimeRemaining: formatReadingTime(totalWordsRemaining, wpm),
    totalBookTime: formatReadingTime(totalWorkWords, wpm),
    chapterWordsRemaining: currentChapterWordsRemaining,
    totalWordsRemaining,
    overallPercent,
  };
}

export function formatNumberPT(num: number): string {
  return new Intl.NumberFormat("pt-BR").format(num);
}

export function formatDateAO3(isoString: string): string {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
      .format(date)
      .replace(".", ".");
  } catch {
    return isoString;
  }
}
