import { create } from "zustand";
import { persist } from "zustand/middleware";
import { NavigationMode, ReaderThemeId } from "@/types/work";
import { SourceLangCode } from "@/core/services/offlineTranslator";

export interface ReaderThemeDefinition {
  id: ReaderThemeId;
  name: string;
  description: string;
  bg: string;
  surface: string;
  text: string;
  muted: string;
  border: string;
  accent: string;
}

export const READER_THEMES: Record<ReaderThemeId, ReaderThemeDefinition> = {
  light: {
    id: "light",
    name: "Claro Clássico",
    description: "Fundo branco puro estilo AO3 original",
    bg: "#FFFFFF",
    surface: "#F5F5F5",
    text: "#222222",
    muted: "#555555",
    border: "#DDDDDD",
    accent: "#990000",
  },
  dark: {
    id: "dark",
    name: "Escuro Noturno",
    description: "Contraste suave para leitura à noite",
    bg: "#16171A",
    surface: "#22242A",
    text: "#E4E6EB",
    muted: "#9BA1AE",
    border: "#32353E",
    accent: "#E05A5A",
  },
  sepia: {
    id: "sepia",
    name: "Sépia",
    description: "Tom quente clássico de livro antigo",
    bg: "#F4ECD8",
    surface: "#EAE0C8",
    text: "#3C2F23",
    muted: "#6E5A47",
    border: "#D8CBB0",
    accent: "#8C2D19",
  },
  cream: {
    id: "cream",
    name: "Papel Creme",
    description: "Amarelado suave estilo páginas Pólen/Kindle",
    bg: "#FAF6E8",
    surface: "#F1EBCD",
    text: "#2C2A25",
    muted: "#656052",
    border: "#E2DAC0",
    accent: "#990000",
  },
  matte_gray: {
    id: "matte_gray",
    name: "Cinza Fosco",
    description: "E-Ink fosco sem reflexo para descanso visual",
    bg: "#DCDCDC",
    surface: "#CFCFCF",
    text: "#242424",
    muted: "#525252",
    border: "#BDBDBD",
    accent: "#7A1C1C",
  },
  sage_green: {
    id: "sage_green",
    name: "Verde Sálvia Suave",
    description: "Tom botânico calmante que reduz a fadiga ocular",
    bg: "#E6EFE9",
    surface: "#D8E5DC",
    text: "#1F2E25",
    muted: "#4A6153",
    border: "#C4D6CA",
    accent: "#2D6A4F",
  },
};

interface ReaderStore {
  theme: ReaderThemeId;
  navigationMode: NavigationMode;
  fontSize: number;
  lineHeight: number;
  maxWidth: number;
  fontFamily: "serif" | "sans" | "mono";
  wpm: number;
  // Estado global de tradução estilo Google Translate (vale para a página aberta sem criar arquivos)
  translateToPt: boolean;
  sourceLang: SourceLangCode;
  setTheme: (theme: ReaderThemeId) => void;
  setNavigationMode: (mode: NavigationMode) => void;
  setFontSize: (size: number) => void;
  setLineHeight: (lh: number) => void;
  setMaxWidth: (w: number) => void;
  setFontFamily: (ff: "serif" | "sans" | "mono") => void;
  setWpm: (wpm: number) => void;
  setTranslateToPt: (enabled: boolean) => void;
  setSourceLang: (lang: SourceLangCode) => void;
}

export const useReaderStore = create<ReaderStore>()(
  persist(
    (set) => ({
      theme: "cream",
      navigationMode: "paginated",
      fontSize: 18,
      lineHeight: 1.75,
      maxWidth: 760,
      fontFamily: "serif",
      wpm: 230,
      translateToPt: false,
      sourceLang: "auto",
      setTheme: (theme) => set({ theme }),
      setNavigationMode: (navigationMode) => set({ navigationMode }),
      setFontSize: (fontSize) => set({ fontSize }),
      setLineHeight: (lineHeight) => set({ lineHeight }),
      setMaxWidth: (maxWidth) => set({ maxWidth }),
      setFontFamily: (fontFamily) => set({ fontFamily }),
      setWpm: (wpm) => set({ wpm }),
      setTranslateToPt: (translateToPt) => set({ translateToPt }),
      setSourceLang: (sourceLang) => set({ sourceLang }),
    }),
    {
      name: "ao3-reader-preferences",
    }
  )
);
