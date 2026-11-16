import { create } from "zustand";
import {
  AO3FilterState,
  SortFieldAO3,
} from "@/core/services/tagFilterEngine";
import {
  CategoryAO3,
  CompletionStatusAO3,
  RatingAO3,
  WarningStatusAO3,
} from "@/types/work";

interface LibraryStore extends AO3FilterState {
  setSearchQuery: (q: string) => void;
  setSortBy: (field: SortFieldAO3) => void;
  setSortDirection: (dir: "desc" | "asc") => void;
  setActiveCollectionId: (id: string | null) => void;
  setActiveFandom: (fandom: string | null) => void;
  toggleIncludeTag: (tag: string) => void;
  toggleExcludeTag: (tag: string) => void;
  toggleIncludeRating: (r: RatingAO3) => void;
  toggleExcludeRating: (r: RatingAO3) => void;
  toggleIncludeWarning: (w: WarningStatusAO3) => void;
  toggleExcludeWarning: (w: WarningStatusAO3) => void;
  toggleIncludeCategory: (c: CategoryAO3) => void;
  toggleExcludeCategory: (c: CategoryAO3) => void;
  toggleIncludeCompletion: (s: CompletionStatusAO3) => void;
  toggleExcludeCompletion: (s: CompletionStatusAO3) => void;
  setCustomIncludeInput: (val: string) => void;
  setCustomExcludeInput: (val: string) => void;
  setWordRange: (min: number | null, max: number | null) => void;
  resetAllFilters: () => void;
}

const initialFilterState: AO3FilterState = {
  searchQuery: "",
  sortBy: "updatedAt",
  sortDirection: "desc",
  activeCollectionId: null,
  activeFandom: null,
  includeRatings: [],
  includeWarnings: [],
  includeCategories: [],
  includeCompletion: [],
  includeTags: [],
  customIncludeInput: "",
  excludeRatings: [],
  excludeWarnings: [],
  excludeCategories: [],
  excludeCompletion: [],
  excludeTags: [],
  customExcludeInput: "",
  minWords: null,
  maxWords: null,
};

function toggleInArray<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
}

export const useLibraryStore = create<LibraryStore>((set) => ({
  ...initialFilterState,
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSortBy: (sortBy) => set({ sortBy }),
  setSortDirection: (sortDirection) => set({ sortDirection }),
  setActiveCollectionId: (activeCollectionId) => set({ activeCollectionId }),
  setActiveFandom: (activeFandom) => set({ activeFandom }),
  toggleIncludeTag: (tag) =>
    set((state) => ({
      includeTags: toggleInArray(state.includeTags, tag),
      excludeTags: state.excludeTags.filter((t) => t !== tag),
    })),
  toggleExcludeTag: (tag) =>
    set((state) => ({
      excludeTags: toggleInArray(state.excludeTags, tag),
      includeTags: state.includeTags.filter((t) => t !== tag),
    })),
  toggleIncludeRating: (r) =>
    set((state) => ({ includeRatings: toggleInArray(state.includeRatings, r) })),
  toggleExcludeRating: (r) =>
    set((state) => ({ excludeRatings: toggleInArray(state.excludeRatings, r) })),
  toggleIncludeWarning: (w) =>
    set((state) => ({ includeWarnings: toggleInArray(state.includeWarnings, w) })),
  toggleExcludeWarning: (w) =>
    set((state) => ({ excludeWarnings: toggleInArray(state.excludeWarnings, w) })),
  toggleIncludeCategory: (c) =>
    set((state) => ({ includeCategories: toggleInArray(state.includeCategories, c) })),
  toggleExcludeCategory: (c) =>
    set((state) => ({ excludeCategories: toggleInArray(state.excludeCategories, c) })),
  toggleIncludeCompletion: (s) =>
    set((state) => ({ includeCompletion: toggleInArray(state.includeCompletion, s) })),
  toggleExcludeCompletion: (s) =>
    set((state) => ({ excludeCompletion: toggleInArray(state.excludeCompletion, s) })),
  setCustomIncludeInput: (customIncludeInput) => set({ customIncludeInput }),
  setCustomExcludeInput: (customExcludeInput) => set({ customExcludeInput }),
  setWordRange: (minWords, maxWords) => set({ minWords, maxWords }),
  resetAllFilters: () => set({ ...initialFilterState }),
}));
