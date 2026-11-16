import {
  CategoryAO3,
  CompletionStatusAO3,
  RatingAO3,
  WarningStatusAO3,
  WorkItem,
} from "@/types/work";

export type SortFieldAO3 =
  | "updatedAt"
  | "wordCount"
  | "title"
  | "author"
  | "rereadCount";

export interface AO3FilterState {
  searchQuery: string;
  sortBy: SortFieldAO3;
  sortDirection: "desc" | "asc";
  activeCollectionId: string | null;
  activeFandom: string | null;
  // Incluir
  includeRatings: RatingAO3[];
  includeWarnings: WarningStatusAO3[];
  includeCategories: CategoryAO3[];
  includeCompletion: CompletionStatusAO3[];
  includeTags: string[]; // Fandoms, Relacionamentos, Personagens ou Tags adicionais
  customIncludeInput: string;
  // Excluir
  excludeRatings: RatingAO3[];
  excludeWarnings: WarningStatusAO3[];
  excludeCategories: CategoryAO3[];
  excludeCompletion: CompletionStatusAO3[];
  excludeTags: string[];
  customExcludeInput: string;
  // Intervalo de palavras
  minWords: number | null;
  maxWords: number | null;
}

export function getAllWorkTagsFlat(work: WorkItem): string[] {
  return [
    ...work.fandoms,
    ...work.tags.warnings,
    ...work.tags.relationships,
    ...work.tags.characters,
    ...work.tags.freeforms,
  ];
}

export function filterAndSortWorks(works: WorkItem[], filter: AO3FilterState): WorkItem[] {
  const customIncludes = filter.customIncludeInput
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  const customExcludes = filter.customExcludeInput
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  const filtered = works.filter((work) => {
    // 1. Coleção / Prateleira ativa
    if (filter.activeCollectionId && !work.collectionIds.includes(filter.activeCollectionId)) {
      return false;
    }

    // 2. Fandom ativo no topo
    if (
      filter.activeFandom &&
      !work.fandoms.some((f) => f.toLowerCase() === filter.activeFandom!.toLowerCase())
    ) {
      return false;
    }

    const allTags = getAllWorkTagsFlat(work);
    const allTagsLower = allTags.map((t) => t.toLowerCase());

    // 3. Busca textual geral (Título, Autor, Sinopse, Tags)
    if (filter.searchQuery.trim()) {
      const q = filter.searchQuery.toLowerCase().trim();
      const matchesTitle = work.title.toLowerCase().includes(q);
      const matchesAuthor = work.author.toLowerCase().includes(q);
      const matchesSummary = work.summary.toLowerCase().includes(q);
      const matchesTags = allTagsLower.some((t) => t.includes(q));
      if (!matchesTitle && !matchesAuthor && !matchesSummary && !matchesTags) {
        return false;
      }
    }

    // 4. Incluir Classificações / Avisos / Categorias / Status
    if (filter.includeRatings.length > 0 && !filter.includeRatings.includes(work.rating)) {
      return false;
    }
    if (filter.includeWarnings.length > 0 && !filter.includeWarnings.includes(work.warningStatus)) {
      return false;
    }
    if (filter.includeCategories.length > 0 && !filter.includeCategories.includes(work.category)) {
      return false;
    }
    if (
      filter.includeCompletion.length > 0 &&
      !filter.includeCompletion.includes(work.completionStatus)
    ) {
      return false;
    }

    // 5. Excluir Classificações / Avisos / Categorias / Status
    if (filter.excludeRatings.includes(work.rating)) return false;
    if (filter.excludeWarnings.includes(work.warningStatus)) return false;
    if (filter.excludeCategories.includes(work.category)) return false;
    if (filter.excludeCompletion.includes(work.completionStatus)) return false;

    // 6. Incluir Tags (todas as tags selecionadas precisam estar presentes - lógica E do AO3)
    for (const incTag of filter.includeTags) {
      const target = incTag.toLowerCase();
      if (!allTagsLower.includes(target)) {
        return false;
      }
    }
    for (const customInc of customIncludes) {
      if (!allTagsLower.some((t) => t.includes(customInc))) {
        return false;
      }
    }

    // 7. Excluir Tags (nenhuma das tags excluídas pode estar presente)
    for (const excTag of filter.excludeTags) {
      const target = excTag.toLowerCase();
      if (allTagsLower.includes(target)) {
        return false;
      }
    }
    for (const customExc of customExcludes) {
      if (allTagsLower.some((t) => t.includes(customExc))) {
        return false;
      }
    }

    // 8. Contagem de palavras
    if (filter.minWords !== null && work.wordCount < filter.minWords) return false;
    if (filter.maxWords !== null && work.wordCount > filter.maxWords) return false;

    return true;
  });

  // Ordenação
  return [...filtered].sort((a, b) => {
    const dir = filter.sortDirection === "asc" ? 1 : -1;
    switch (filter.sortBy) {
      case "updatedAt":
        return (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()) * dir;
      case "wordCount":
        return (a.wordCount - b.wordCount) * dir;
      case "rereadCount":
        return ((a.stats?.rereadCount || 0) - (b.stats?.rereadCount || 0)) * dir;
      case "title":
        return a.title.localeCompare(b.title, "pt-BR") * (dir === -1 ? 1 : -1);
      case "author":
        return a.author.localeCompare(b.author, "pt-BR") * (dir === -1 ? 1 : -1);
      default:
        return 0;
    }
  });
}

export function computeFacetCounts(works: WorkItem[]) {
  const fandoms = new Map<string, number>();
  const relationships = new Map<string, number>();
  const characters = new Map<string, number>();
  const freeforms = new Map<string, number>();
  const warnings = new Map<string, number>();

  for (const w of works) {
    w.fandoms.forEach((t) => fandoms.set(t, (fandoms.get(t) || 0) + 1));
    w.tags.relationships.forEach((t) => relationships.set(t, (relationships.get(t) || 0) + 1));
    w.tags.characters.forEach((t) => characters.set(t, (characters.get(t) || 0) + 1));
    w.tags.freeforms.forEach((t) => freeforms.set(t, (freeforms.get(t) || 0) + 1));
    w.tags.warnings.forEach((t) => warnings.set(t, (warnings.get(t) || 0) + 1));
  }

  const sortMap = (m: Map<string, number>) =>
    Array.from(m.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));

  return {
    fandoms: sortMap(fandoms),
    relationships: sortMap(relationships),
    characters: sortMap(characters),
    freeforms: sortMap(freeforms),
    warnings: sortMap(warnings),
  };
}
