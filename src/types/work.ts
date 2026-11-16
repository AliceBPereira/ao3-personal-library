export type RatingAO3 =
  | "general"       // G - Público Geral (Verde)
  | "teen"          // T - Adolescentes (Amarelo)
  | "mature"        // M - Maduro (Laranja)
  | "explicit"      // E - Explícito (Vermelho)
  | "not_rated";    // Sem classificação (Branco/Cinza)

export type CategoryAO3 =
  | "mm"            // M/M (Azul)
  | "ff"            // F/F (Rosa/Vermelho)
  | "fm"            // F/M (Roxo)
  | "gen"           // Gen (Verde)
  | "multi"         // Multi (Colorido/Mosaico)
  | "other";        // Outro (Preto)

export type WarningStatusAO3 =
  | "none"          // Não se aplicam avisos de arquivo (Branco/Cinza)
  | "chose_not"     // O criador optou por não usar avisos (Laranja ?)
  | "has_warnings"; // Possui avisos de arquivo (Vermelho !)

export type CompletionStatusAO3 =
  | "complete"      // Completo (Verde ✓)
  | "wip"           // Em andamento (Vermelho 🚫 / capítulos X/?)
  | "abandoned";    // Abandonado/Hiato

export type BookFileFormat = "epub" | "pdf" | "mobi" | "html";

export type ReaderThemeId =
  | "light"         // Claro tradicional
  | "dark"          // Escuro confortável
  | "sepia"         // Sépia clássico
  | "cream"         // Papel Creme / Amarelado suave
  | "matte_gray"    // Cinza Fosco (descanso visual)
  | "sage_green";   // Verde Sálvia suave

export type NavigationMode = "scroll" | "paginated";

export interface WorkChapter {
  id: string;
  index: number;
  title: string;
  htmlContent: string;
  plainText: string;
  wordCount: number;
}

export interface HighlightItem {
  id: string;
  workId: string;
  chapterIndex: number;
  pageNumber?: number;
  selectedText: string;
  note?: string;
  color: "yellow" | "green" | "blue" | "pink" | "amber";
  createdAt: string;
  scrollPercentage: number;
}

export interface BookmarkItem {
  id: string;
  workId: string;
  label: string;
  chapterIndex: number;
  scrollPercentage: number;
  pageNumber?: number;
  snippet?: string;
  createdAt: string;
}

export interface PinnedSpecialPage {
  id: string;
  workId: string;
  title: string;
  category: "map" | "family_tree" | "glossary" | "reference";
  chapterIndex: number;
  scrollPercentage: number;
  pageNumber?: number;
  customHtmlOrNotes?: string;
  imageDataUrl?: string;
  createdAt: string;
}

export interface WorkTags {
  warnings: string[];
  relationships: string[];
  characters: string[];
  freeforms: string[];
}

export interface WorkItem {
  id: string;
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
  updatedAt: string;
  createdAt: string;
  format: BookFileFormat;
  collectionIds: string[];
  readingProgress: {
    currentChapterIndex: number;
    scrollPercentage: number;
    currentPage?: number;
    totalPages?: number;
    wordsRead: number;
    lastReadAt?: string;
  };
  stats: {
    rereadCount: number;
    kudosGiven: boolean;
    personalRating?: number;
    bookmarksCount: number;
    highlightsCount: number;
  };
  chapters: WorkChapter[];
  translatedChaptersPt?: WorkChapter[];
  translatedTitlePt?: string;
  translatedSummaryPt?: string;
  rawFileBlob?: Blob | ArrayBuffer;
  fileName?: string;
}

export interface CollectionShelf {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  createdAt: string;
}

// ============================================================================
// SISTEMA DE ACOMPANHAMENTO DE ATUALIZAÇÕES DO AO3 ORIGINAL (SUBSCRIPTIONS TRACKER)
// ============================================================================
export interface AO3ChapterLinkItem {
  number: number;        // Ex: 1, 2, 3...
  ao3ChapterId?: string; // Ex: "61019344"
  title: string;         // Ex: "1. Chapter 1"
  publishedDate?: string;// Ex: "2020-06-29"
  url: string;           // Ex: "https://archiveofourown.org/works/25000000/chapters/61019344"
}

export interface AO3TrackedWork {
  id: string;                        // Ex: "ao3-25008295"
  ao3WorkId: string;                 // ID numérico oficial da obra no AO3 Original
  ao3Url: string;                    // URL principal no archiveofourown.org
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
  // Controle de Capítulos e Atualizações no AO3 Original:
  chaptersReadByMe: number;          // Último capítulo que você já leu no AO3 Original
  lastReadChapterUrl?: string;       // Link do último capítulo que você leu
  chaptersPublishedOnAo3: number;    // Quantos capítulos estão publicados hoje no AO3 Original
  chaptersTotalOnAo3: number | null; // Total planejado pelo autor (null = "?")
  chapterLinks: AO3ChapterLinkItem[];// Lista real de capítulos no AO3 com link direto para cada capítulo!
  ao3UpdatedAt: string;              // Data em que o autor atualizou a fic lá no AO3 Original
  lastCheckedAt: string;             // Quando nosso sistema consultou o AO3 Original pela última vez
  lastReadAt?: string;               // Quando você leu pela última vez
  notes?: string;                    // Anotações rápidas (ex: "Parei na parte em que Neil chega em Gotham")
  isFavorite?: boolean;
}
