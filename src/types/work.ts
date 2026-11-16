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
  pageNumber?: number; // Usado em PDF ou paginação
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
  title: string; // Ex: "Mapa de Terrasen", "Árvore Genealógica", "Glossário de Exy"
  category: "map" | "family_tree" | "glossary" | "reference";
  chapterIndex: number;
  scrollPercentage: number;
  pageNumber?: number;
  customHtmlOrNotes?: string;
  imageDataUrl?: string;
  createdAt: string;
}

export interface WorkTags {
  warnings: string[];       // Ex: ["O criador optou por não usar avisos de arquivo."]
  relationships: string[];  // Ex: ["Neil Josten/Andrew Minyard"]
  characters: string[];     // Ex: ["Neil Josten", "Andrew Minyard", "Kevin Day"]
  freeforms: string[];      // Ex: ["Fluff", "Humor", "Universo Alternativo", "5+1 Coisas"]
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
  chaptersTotal: number | null; // null = "?" (ex: 6/?)
  updatedAt: string;            // ISO string
  createdAt: string;
  format: BookFileFormat;
  collectionIds: string[];      // Prateleiras/Coleções
  // Métricas pessoais e progresso
  readingProgress: {
    currentChapterIndex: number;
    scrollPercentage: number;   // 0 a 100
    currentPage?: number;
    totalPages?: number;
    wordsRead: number;
    lastReadAt?: string;
  };
  stats: {
    rereadCount: number;        // Quantas vezes leu ("Visualizações/Leituras")
    kudosGiven: boolean;        // Favorito/Kudos pessoal
    personalRating?: number;    // 1 a 5
    bookmarksCount: number;
    highlightsCount: number;
  };
  chapters: WorkChapter[];
  translatedChaptersPt?: WorkChapter[]; // Cache persistente offline da tradução neural completa
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
