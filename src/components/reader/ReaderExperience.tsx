"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { db, ensureDatabaseSeeded } from "@/core/db/database";
import {
  BookmarkItem,
  HighlightItem,
  PinnedSpecialPage,
  ReaderThemeId,
} from "@/types/work";
import { READER_THEMES, useReaderStore } from "@/store/useReaderStore";
import { calculateRealtimeMetrics } from "@/core/services/readingMetrics";
import { StatusIconsGrid } from "@/components/ao3/StatusIconsGrid";
import {
  ArrowLeft,
  Bookmark,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clock,
  Columns,
  Compass,
  Highlighter,
  MapPin,
  Minus,
  Palette,
  Plus,
  RotateCcw,
  ScrollText,
  Sparkles,
  Trash2,
  Type,
  X,
} from "lucide-react";

interface ReaderExperienceProps {
  workId: string;
}

interface ReturnAnchor {
  chapterIndex: number;
  scrollPercentage: number;
  pageIndex: number;
  label: string;
}

const HIGHLIGHT_COLORS: Array<{
  id: HighlightItem["color"];
  label: string;
  bg: string;
  border: string;
}> = [
  { id: "yellow", label: "Amarelo", bg: "#fef08a", border: "#eab308" },
  { id: "green", label: "Verde", bg: "#bbf7d0", border: "#22c55e" },
  { id: "blue", label: "Azul", bg: "#bfdbfe", border: "#3b82f6" },
  { id: "pink", label: "Rosa", bg: "#fbcfe8", border: "#ec4899" },
  { id: "amber", label: "Âmbar", bg: "#fde68a", border: "#d97706" },
];

const COLUMN_GAP = 64; // Espaço entre colunas virtuais do Kindle

export function ReaderExperience({ workId }: ReaderExperienceProps) {
  const {
    theme,
    navigationMode,
    fontSize,
    lineHeight,
    maxWidth,
    fontFamily,
    wpm,
    setTheme,
    setNavigationMode,
    setFontSize,
    setLineHeight,
    setMaxWidth,
    setFontFamily,
    setWpm,
  } = useReaderStore();

  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [scrollPercent, setScrollPercent] = useState(0);

  // Estado da Paginação Real Estilo Kindle (baseada na altura/largura exata da tela)
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [totalPagesInChapter, setTotalPagesInChapter] = useState(1);
  const [viewportDims, setViewportDims] = useState({ width: 720, height: 520 });

  // Painéis laterais e modais do leitor
  const [showAppearanceMenu, setShowAppearanceMenu] = useState(false);
  const [showHighlightsDrawer, setShowHighlightsDrawer] = useState(false);
  const [showPinnedModal, setShowPinnedModal] = useState(false);

  // Estado de seleção de texto estilo Kindle
  const [selectedQuote, setSelectedQuote] = useState<string>("");
  const [highlightNote, setHighlightNote] = useState<string>("");
  const [highlightColor, setHighlightColor] =
    useState<HighlightItem["color"]>("yellow");

  // Estado de Acesso Rápido a Páginas Especiais (com retorno instantâneo)
  const [returnAnchor, setReturnAnchor] = useState<ReturnAnchor | null>(null);
  const [viewingPinnedPage, setViewingPinnedPage] =
    useState<PinnedSpecialPage | null>(null);

  // Campos para criar nova página especial fixada
  const [newPinTitle, setNewPinTitle] = useState("");
  const [newPinCategory, setNewPinCategory] =
    useState<PinnedSpecialPage["category"]>("map");
  const [newPinNotes, setNewPinNotes] = useState("");
  const [newPinImage, setNewPinImage] = useState<string | undefined>(undefined);

  const kindleViewportRef = useRef<HTMLDivElement | null>(null);
  const kindleColumnsRef = useRef<HTMLDivElement | null>(null);
  const hasRestoredProgress = useRef(false);

  useEffect(() => {
    ensureDatabaseSeeded();
  }, []);

  const work = useLiveQuery(() => db.works.get(workId), [workId]);
  const highlights =
    useLiveQuery(
      () => db.highlights.where("workId").equals(workId).toArray(),
      [workId]
    ) || [];
  const bookmarks =
    useLiveQuery(
      () => db.bookmarks.where("workId").equals(workId).toArray(),
      [workId]
    ) || [];
  const pinnedPages =
    useLiveQuery(
      () => db.pinnedPages.where("workId").equals(workId).toArray(),
      [workId]
    ) || [];

  const activeTheme = READER_THEMES[theme] || READER_THEMES.cream;
  const currentChapter =
    work?.chapters?.[currentChapterIndex] || work?.chapters?.[0];

  // Aplicar grifos visuais no HTML renderizado para os destaques salvos deste capítulo
  const chapterHighlights = useMemo(
    () => highlights.filter((h) => h.chapterIndex === currentChapterIndex),
    [highlights, currentChapterIndex]
  );

  const decoratedChapterHtml = useMemo(() => {
    const rawHtml = currentChapter?.htmlContent || "";
    let decorated = rawHtml;
    for (const hl of chapterHighlights) {
      if (!hl.selectedText || hl.selectedText.length < 3) continue;
      const colorDef =
        HIGHLIGHT_COLORS.find((c) => c.id === hl.color) || HIGHLIGHT_COLORS[0];
      const escaped = hl.selectedText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      try {
        const regex = new RegExp(`(${escaped})`, "i");
        decorated = decorated.replace(
          regex,
          `<mark data-hl-id="${hl.id}" style="background-color:${colorDef.bg}; color:#111; padding:1px 3px; border-bottom:2px solid ${colorDef.border}; border-radius:2px; cursor:pointer;" title="${
            hl.note ? `Nota: ${hl.note}` : "Trecho destacado"
          }">$1</mark>`
        );
      } catch {
        // Ignore regex boundary error
      }
    }
    return decorated;
  }, [currentChapter?.htmlContent, chapterHighlights]);

  // Medir a tela exata do Kindle e calcular quantas páginas o capítulo ocupa sem nenhum scroll vertical
  const measureKindlePagination = useCallback(() => {
    if (navigationMode !== "paginated") return;
    const vp = kindleViewportRef.current;
    const cols = kindleColumnsRef.current;
    if (!vp) return;

    const w = Math.max(260, vp.clientWidth);
    const h = Math.max(220, vp.clientHeight);

    setViewportDims((prev) =>
      prev.width === w && prev.height === h ? prev : { width: w, height: h }
    );

    if (cols) {
      const totalScrollW = cols.scrollWidth;
      const pageStep = w + COLUMN_GAP;
      const computedPages = Math.max(
        1,
        Math.round((totalScrollW + COLUMN_GAP) / pageStep)
      );
      setTotalPagesInChapter(computedPages);
      setCurrentPageIndex((prevPage) =>
        Math.min(prevPage, Math.max(0, computedPages - 1))
      );
    }
  }, [navigationMode]);

  // Recalcular paginação sempre que mudar tamanho da fonte, espaçamento, largura, capítulo ou redimensionar a tela
  useEffect(() => {
    if (navigationMode !== "paginated") return;
    const timer = setTimeout(() => {
      measureKindlePagination();
    }, 40);

    const vp = kindleViewportRef.current;
    let observer: ResizeObserver | null = null;
    if (vp && typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => {
        measureKindlePagination();
      });
      observer.observe(vp);
    }

    window.addEventListener("resize", measureKindlePagination);
    return () => {
      clearTimeout(timer);
      if (observer) observer.disconnect();
      window.removeEventListener("resize", measureKindlePagination);
    };
  }, [
    navigationMode,
    fontSize,
    lineHeight,
    maxWidth,
    fontFamily,
    currentChapterIndex,
    decoratedChapterHtml,
    viewingPinnedPage,
    returnAnchor,
    measureKindlePagination,
  ]);

  // Restaurar posição salva ao abrir o livro
  useEffect(() => {
    if (work && !hasRestoredProgress.current) {
      hasRestoredProgress.current = true;
      const savedCh = work.readingProgress?.currentChapterIndex || 0;
      const savedPct = work.readingProgress?.scrollPercentage || 0;
      setCurrentChapterIndex(
        Math.min(savedCh, Math.max(0, (work.chapters?.length || 1) - 1))
      );
      setScrollPercent(savedPct);

      setTimeout(() => {
        if (navigationMode === "scroll" && savedPct > 0 && savedPct < 100) {
          const docHeight =
            document.documentElement.scrollHeight - window.innerHeight;
          if (docHeight > 0) {
            window.scrollTo({
              top: (docHeight * savedPct) / 100,
              behavior: "smooth",
            });
          }
        }
      }, 220);
    }
  }, [work, navigationMode]);

  // Quando o total de páginas for medido e houver progresso salvo, posicionar na página correspondente
  useEffect(() => {
    if (
      navigationMode === "paginated" &&
      totalPagesInChapter > 1 &&
      scrollPercent > 0 &&
      currentPageIndex === 0
    ) {
      const targetPage = Math.min(
        totalPagesInChapter - 1,
        Math.max(0, Math.round((scrollPercent / 100) * (totalPagesInChapter - 1)))
      );
      if (targetPage > 0) {
        setCurrentPageIndex(targetPage);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigationMode, totalPagesInChapter]);

  // Calcular progresso efetivo (seja por scroll ou por página)
  const effectiveChapterPercent = useMemo(() => {
    if (navigationMode === "paginated") {
      if (totalPagesInChapter <= 1) return 100;
      return Math.round(((currentPageIndex + 1) / totalPagesInChapter) * 100);
    }
    return scrollPercent;
  }, [navigationMode, currentPageIndex, totalPagesInChapter, scrollPercent]);

  // Salvar progresso no IndexedDB conforme o usuário avança
  useEffect(() => {
    if (!work) return;
    const timer = setTimeout(() => {
      db.works.update(work.id, {
        readingProgress: {
          currentChapterIndex,
          scrollPercentage: effectiveChapterPercent,
          currentPage: currentPageIndex + 1,
          totalPages: totalPagesInChapter,
          wordsRead: Math.round(
            (work.wordCount * effectiveChapterPercent) / 100
          ),
          lastReadAt: new Date().toISOString(),
        },
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [
    work,
    currentChapterIndex,
    effectiveChapterPercent,
    currentPageIndex,
    totalPagesInChapter,
  ]);

  // Ouvir rolagem da janela no modo scroll
  useEffect(() => {
    if (navigationMode !== "scroll") return;
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) {
        setScrollPercent(100);
      } else {
        const pct = Math.min(
          100,
          Math.max(0, Math.round((scrollTop / docHeight) * 100))
        );
        setScrollPercent(pct);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [navigationMode, currentChapterIndex]);

  const handleNextPage = useCallback(() => {
    if (currentPageIndex + 1 < totalPagesInChapter) {
      setCurrentPageIndex((p) => p + 1);
    } else if (work && currentChapterIndex + 1 < work.chapters.length) {
      setCurrentChapterIndex((c) => c + 1);
      setCurrentPageIndex(0);
      setScrollPercent(0);
    }
  }, [currentPageIndex, totalPagesInChapter, work, currentChapterIndex]);

  const handlePrevPage = useCallback(() => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex((p) => p - 1);
    } else if (currentChapterIndex > 0) {
      setCurrentChapterIndex((c) => c - 1);
      setCurrentPageIndex(0);
      setScrollPercent(0);
    }
  }, [currentPageIndex, currentChapterIndex]);

  // Atalhos de teclado (Setas Esquerda/Direita e Espaço para passar página no modo paginado)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (navigationMode !== "paginated") return;
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.tagName === "SELECT"
      ) {
        return;
      }
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        handleNextPage();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        handlePrevPage();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigationMode, handleNextPage, handlePrevPage]);

  // Detectar seleção de texto no leitor para abrir barra de destaque estilo Kindle
  const handleMouseUpSelection = () => {
    if (typeof window === "undefined") return;
    const sel = window.getSelection();
    const text = sel?.toString().trim() || "";
    if (text.length >= 3) {
      setSelectedQuote(text);
    }
  };

  // Clique estilo Kindle na página (Esquerda = Volta, Direita = Avança, ignorando se o usuário estiver selecionando texto!)
  const handleKindleSurfaceClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (navigationMode !== "paginated") return;

    // Se o usuário selecionou texto para destacar, não virar a página!
    const sel = window.getSelection();
    if (sel && sel.toString().trim().length > 0) {
      return;
    }

    // Ignorar cliques em links, botões ou elementos interativos
    const target = e.target as HTMLElement;
    if (target.closest("button, a, input, select, textarea, mark")) {
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;

    // 35% da esquerda volta a página; 65% da direita avança a página (padrão Kindle)
    if (clickX < width * 0.35) {
      handlePrevPage();
    } else {
      handleNextPage();
    }
  };

  const handleSaveHighlight = async () => {
    if (!work || !selectedQuote.trim()) return;
    const newHl: HighlightItem = {
      id: `hl-${Date.now()}`,
      workId: work.id,
      chapterIndex: currentChapterIndex,
      pageNumber: currentPageIndex + 1,
      selectedText: selectedQuote.trim(),
      note: highlightNote.trim() || undefined,
      color: highlightColor,
      createdAt: new Date().toISOString(),
      scrollPercentage: effectiveChapterPercent,
    };

    await db.highlights.put(newHl);
    await db.works.update(work.id, {
      stats: {
        ...work.stats,
        highlightsCount: (work.stats?.highlightsCount || 0) + 1,
      },
    });
    setSelectedQuote("");
    setHighlightNote("");
    window.getSelection()?.removeAllRanges();
  };

  const handleAddBookmarkHere = async () => {
    if (!work) return;
    const bm: BookmarkItem = {
      id: `bm-${Date.now()}`,
      workId: work.id,
      label: `${
        currentChapter?.title || `Capítulo ${currentChapterIndex + 1}`
      } (${
        navigationMode === "paginated"
          ? `Pág. ${currentPageIndex + 1}/${totalPagesInChapter}`
          : `${effectiveChapterPercent}%`
      })`,
      chapterIndex: currentChapterIndex,
      scrollPercentage: effectiveChapterPercent,
      pageNumber:
        navigationMode === "paginated" ? currentPageIndex + 1 : undefined,
      snippet: currentChapter?.plainText.slice(0, 120) + "...",
      createdAt: new Date().toISOString(),
    };
    await db.bookmarks.put(bm);
    await db.works.update(work.id, {
      stats: {
        ...work.stats,
        bookmarksCount: (work.stats?.bookmarksCount || 0) + 1,
      },
    });
    setShowHighlightsDrawer(true);
  };

  // Pular diretamente para um destaque ou marcador (Estilo Kindle)
  const jumpToPosition = (
    chapterIdx: number,
    pct: number,
    pageNum?: number
  ) => {
    setCurrentChapterIndex(chapterIdx);
    setScrollPercent(pct);

    if (navigationMode === "paginated") {
      setTimeout(() => {
        if (pageNum && pageNum <= totalPagesInChapter) {
          setCurrentPageIndex(Math.max(0, pageNum - 1));
        } else {
          const targetP = Math.min(
            totalPagesInChapter - 1,
            Math.max(0, Math.round((pct / 100) * (totalPagesInChapter - 1)))
          );
          setCurrentPageIndex(targetP);
        }
      }, 80);
    } else {
      setTimeout(() => {
        const docHeight =
          document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo({
          top: (docHeight * pct) / 100,
          behavior: "smooth",
        });
      }, 150);
    }
    setShowHighlightsDrawer(false);
  };

  // Fixar a página/capítulo atual como Página Especial (Mapa, Árvore Genealógica, Glossário)
  const handlePinCurrentPage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!work || !newPinTitle.trim()) return;
    const pin: PinnedSpecialPage = {
      id: `pin-${Date.now()}`,
      workId: work.id,
      title: newPinTitle.trim(),
      category: newPinCategory,
      chapterIndex: currentChapterIndex,
      scrollPercentage: effectiveChapterPercent,
      pageNumber: currentPageIndex + 1,
      customHtmlOrNotes:
        newPinNotes.trim() ||
        currentChapter?.plainText.slice(0, 320) ||
        "Página especial fixada para consulta rápida.",
      imageDataUrl: newPinImage,
      createdAt: new Date().toISOString(),
    };
    await db.pinnedPages.put(pin);
    setNewPinTitle("");
    setNewPinNotes("");
    setNewPinImage(undefined);
  };

  const handleImageUploadForPin = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setNewPinImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Consultar uma Página Especial Fixada (salva onde o leitor estava para retorno em 1 clique!)
  const handleConsultSpecialPage = (pin: PinnedSpecialPage) => {
    if (!returnAnchor) {
      setReturnAnchor({
        chapterIndex: currentChapterIndex,
        scrollPercentage: effectiveChapterPercent,
        pageIndex: currentPageIndex,
        label: `${
          currentChapter?.title || `Cap. ${currentChapterIndex + 1}`
        } (Pág. ${currentPageIndex + 1})`,
      });
    }
    setViewingPinnedPage(pin);
    setCurrentChapterIndex(
      Math.min(pin.chapterIndex, Math.max(0, (work?.chapters.length || 1) - 1))
    );
    setCurrentPageIndex(Math.max(0, (pin.pageNumber || 1) - 1));
    if (navigationMode === "scroll") {
      setTimeout(() => {
        const docHeight =
          document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo({
          top: (docHeight * (pin.scrollPercentage || 0)) / 100,
          behavior: "smooth",
        });
      }, 120);
    }
    setShowPinnedModal(false);
  };

  // Retornar instantaneamente do Mapa/Glossário para a página onde a leitura estava
  const handleReturnFromSpecialPage = () => {
    if (!returnAnchor) return;
    const target = returnAnchor;
    setReturnAnchor(null);
    setViewingPinnedPage(null);
    setCurrentChapterIndex(target.chapterIndex);
    setCurrentPageIndex(target.pageIndex);
    setScrollPercent(target.scrollPercentage);

    if (navigationMode === "scroll") {
      setTimeout(() => {
        const docHeight =
          document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo({
          top: (docHeight * target.scrollPercentage) / 100,
          behavior: "smooth",
        });
      }, 120);
    }
  };

  if (!work) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF6E8] text-[#2a2a2a] font-ao3Sans">
        <div className="text-center space-y-3">
          <div className="text-lg font-serif text-[#990000]">
            Carregando obra na biblioteca...
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#990000] text-white text-xs rounded-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar para a Biblioteca
          </Link>
        </div>
      </div>
    );
  }

  const metrics = calculateRealtimeMetrics(
    work,
    currentChapterIndex,
    effectiveChapterPercent,
    wpm
  );

  const fontClass =
    fontFamily === "serif"
      ? "font-ao3Serif"
      : fontFamily === "mono"
      ? "font-mono"
      : "font-ao3Sans";

  const isPaginated = navigationMode === "paginated";

  return (
    <div
      className={`transition-colors duration-300 flex flex-col ${
        isPaginated ? "h-screen overflow-hidden select-text" : "min-h-screen"
      }`}
      style={{
        backgroundColor: activeTheme.bg,
        color: activeTheme.text,
      }}
    >
      {/* ================= BARRA SUPERIOR DO LEITOR ================= */}
      <header
        className="shrink-0 z-30 border-b px-3 sm:px-6 py-2 transition-colors shadow-sm"
        style={{
          backgroundColor: activeTheme.surface,
          borderColor: activeTheme.border,
        }}
      >
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
          {/* Esquerda: Voltar + Título da Obra + Seletor de Capítulos */}
          <div className="flex items-center gap-2 min-w-0">
            <Link
              href="/"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm border text-[12px] font-medium hover:opacity-80 transition-opacity shrink-0"
              style={{
                borderColor: activeTheme.border,
                backgroundColor: activeTheme.bg,
                color: activeTheme.text,
              }}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Biblioteca
            </Link>

            <div className="min-w-0 hidden lg:block">
              <h1 className="text-[13.5px] font-bold truncate leading-tight max-w-[240px]">
                {work.title}
              </h1>
              <p
                className="text-[10.5px] truncate"
                style={{ color: activeTheme.muted }}
              >
                por {work.author}
              </p>
            </div>

            {work.chapters.length > 1 && (
              <select
                value={currentChapterIndex}
                onChange={(e) => {
                  setCurrentChapterIndex(Number(e.target.value));
                  setCurrentPageIndex(0);
                  setScrollPercent(0);
                  if (!isPaginated) {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
                className="text-[12px] px-2 py-1 rounded-sm border max-w-[180px] sm:max-w-[220px]"
                style={{
                  backgroundColor: activeTheme.bg,
                  color: activeTheme.text,
                  borderColor: activeTheme.border,
                }}
              >
                {work.chapters.map((ch, idx) => (
                  <option key={ch.id} value={idx}>
                    {idx + 1}. {ch.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Centro/Direita: Controle Rápido de Tamanho da Letra (A- / A+) + Modos + Páginas Especiais */}
          <div className="flex flex-wrap items-center gap-1.5 text-[12px]">
            {/* Botões rápidos A- / A+ direto na barra para ajustar tamanho da letra e ver a paginação reagir na hora */}
            <div
              className="inline-flex items-center rounded-sm border px-1 py-0.5 gap-1"
              style={{
                borderColor: activeTheme.border,
                backgroundColor: activeTheme.bg,
              }}
              title="Ajustar tamanho da letra (recalcula as páginas automaticamente)"
            >
              <Type className="w-3.5 h-3.5 ml-1 opacity-70" />
              <button
                type="button"
                onClick={() => setFontSize(Math.max(13, fontSize - 1))}
                className="p-1 hover:opacity-75 rounded-sm"
                title="Diminuir letra (A-)"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="text-[11px] font-bold min-w-[30px] text-center">
                {fontSize}px
              </span>
              <button
                type="button"
                onClick={() => setFontSize(Math.min(30, fontSize + 1))}
                className="p-1 hover:opacity-75 rounded-sm"
                title="Aumentar letra (A+)"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            {/* Alternador Paginação Kindle vs Rolagem Vertical */}
            <div
              className="inline-flex rounded-sm border overflow-hidden"
              style={{ borderColor: activeTheme.border }}
            >
              <button
                type="button"
                onClick={() => {
                  setNavigationMode("paginated");
                  setCurrentPageIndex(0);
                }}
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11.5px] transition-colors ${
                  isPaginated ? "font-bold" : "opacity-75"
                }`}
                style={{
                  backgroundColor: isPaginated
                    ? activeTheme.accent
                    : activeTheme.bg,
                  color: isPaginated ? "#ffffff" : activeTheme.text,
                }}
                title="Modo Paginado Estilo Kindle (Ocupa a tela inteira sem scroll, clique nas laterais para passar a página)"
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Kindle (Paginado)</span>
              </button>
              <button
                type="button"
                onClick={() => setNavigationMode("scroll")}
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11.5px] transition-colors ${
                  !isPaginated ? "font-bold" : "opacity-75"
                }`}
                style={{
                  backgroundColor: !isPaginated
                    ? activeTheme.accent
                    : activeTheme.bg,
                  color: !isPaginated ? "#ffffff" : activeTheme.text,
                }}
                title="Rolagem Vertical Contínua"
              >
                <ScrollText className="w-3.5 h-3.5" />
                <span>Rolagem</span>
              </button>
            </div>

            {/* Botão de Acesso Rápido: Páginas Especiais Fixadas */}
            <button
              type="button"
              onClick={() => setShowPinnedModal(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm border font-medium transition-colors"
              style={{
                borderColor: activeTheme.accent,
                backgroundColor: activeTheme.bg,
                color: activeTheme.accent,
              }}
              title="Consultar ou fixar Mapas, Árvores Genealógicas e Glossários com retorno instantâneo"
            >
              <Compass className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Páginas Especiais</span>
              <span>({pinnedPages.length})</span>
            </button>

            {/* Botão Marcador Rápido */}
            <button
              type="button"
              onClick={handleAddBookmarkHere}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-sm border transition-colors"
              style={{
                borderColor: activeTheme.border,
                backgroundColor: activeTheme.bg,
                color: activeTheme.text,
              }}
              title="Marcar esta página"
            >
              <Bookmark className="w-3.5 h-3.5" />
            </button>

            {/* Botão Painel de Destaques e Marcadores (Estilo Kindle) */}
            <button
              type="button"
              onClick={() => setShowHighlightsDrawer(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm border transition-colors"
              style={{
                borderColor: activeTheme.border,
                backgroundColor: activeTheme.bg,
                color: activeTheme.text,
              }}
              title="Abrir caderno de Destaques e Marcadores"
            >
              <Highlighter className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Destaques</span>
              <span>({highlights.length + bookmarks.length})</span>
            </button>

            {/* Botão Temas de Papel e Tipografia */}
            <button
              type="button"
              onClick={() => setShowAppearanceMenu((v) => !v)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm border font-medium transition-colors"
              style={{
                borderColor: activeTheme.border,
                backgroundColor: showAppearanceMenu
                  ? activeTheme.accent
                  : activeTheme.bg,
                color: showAppearanceMenu ? "#ffffff" : activeTheme.text,
              }}
            >
              <Palette className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Temas</span>
            </button>
          </div>
        </div>

        {/* ================= PAINEL SUSPENSO DE TEMAS DE PAPEL E TIPOGRAFIA ================= */}
        {showAppearanceMenu && (
          <div
            className="max-w-4xl mx-auto mt-2 p-3.5 rounded-sm border shadow-xl space-y-3 text-[12.5px]"
            style={{
              backgroundColor: activeTheme.bg,
              borderColor: activeTheme.border,
            }}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold">
                Paleta de Cores de Página (Conforto Visual & Papel Real)
              </span>
              <button
                type="button"
                onClick={() => setShowAppearanceMenu(false)}
                className="p-1 opacity-70 hover:opacity-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 6 Temas de Papel */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {(Object.keys(READER_THEMES) as ReaderThemeId[]).map((tKey) => {
                const t = READER_THEMES[tKey];
                const isSelected = theme === tKey;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTheme(t.id)}
                    className={`p-2 rounded-sm border-2 text-left transition-all ${
                      isSelected ? "scale-[1.02] shadow-sm" : "opacity-90"
                    }`}
                    style={{
                      backgroundColor: t.bg,
                      color: t.text,
                      borderColor: isSelected ? t.accent : t.border,
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-[12px]">{t.name}</span>
                      <span
                        className="w-3 h-3 rounded-full border"
                        style={{
                          backgroundColor: t.surface,
                          borderColor: t.border,
                        }}
                      />
                    </div>
                    <div
                      className="text-[10.5px] leading-tight"
                      style={{ color: t.muted }}
                    >
                      {t.description}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Controles de Fonte, Tamanho, Espaçamento e Velocidade WPM */}
            <div
              className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t"
              style={{ borderColor: activeTheme.border }}
            >
              <div>
                <label className="block text-[11px] mb-1 opacity-80">
                  Família Tipográfica
                </label>
                <div className="flex gap-1">
                  {(
                    [
                      { id: "serif", label: "Serif (Kindle)" },
                      { id: "sans", label: "Sans (AO3)" },
                      { id: "mono", label: "Mono" },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFontFamily(f.id)}
                      className="flex-1 py-1 px-1.5 border rounded-sm text-[11px]"
                      style={{
                        borderColor:
                          fontFamily === f.id
                            ? activeTheme.accent
                            : activeTheme.border,
                        fontWeight: fontFamily === f.id ? 700 : 400,
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] mb-1 opacity-80">
                  Tamanho da Fonte: <strong>{fontSize}px</strong>
                </label>
                <input
                  type="range"
                  min={13}
                  max={30}
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full accent-[#990000]"
                />
              </div>

              <div>
                <label className="block text-[11px] mb-1 opacity-80">
                  Espaçamento: <strong>{lineHeight}x</strong> | Largura:{" "}
                  <strong>{maxWidth}px</strong>
                </label>
                <div className="flex gap-2">
                  <input
                    type="range"
                    min={1.35}
                    max={2.2}
                    step={0.05}
                    value={lineHeight}
                    onChange={(e) => setLineHeight(Number(e.target.value))}
                    className="w-1/2 accent-[#990000]"
                  />
                  <input
                    type="range"
                    min={520}
                    max={1050}
                    step={20}
                    value={maxWidth}
                    onChange={(e) => setMaxWidth(Number(e.target.value))}
                    className="w-1/2 accent-[#990000]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] mb-1 opacity-80">
                  Velocidade de Leitura: <strong>{wpm} WPM</strong>
                </label>
                <input
                  type="range"
                  min={130}
                  max={400}
                  step={10}
                  value={wpm}
                  onChange={(e) => setWpm(Number(e.target.value))}
                  className="w-full accent-[#990000]"
                />
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ================= BANNER DE RETORNO INSTANTÂNEO (PÁGINA ESPECIAL) ================= */}
      {returnAnchor && (
        <div className="shrink-0 z-20 bg-[#990000] text-white px-4 py-1.5 shadow-md flex flex-wrap items-center justify-between gap-2 text-[12px]">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 animate-pulse shrink-0" />
            <span>
              Consultando Página Especial:{" "}
              <strong>{viewingPinnedPage?.title || "Referência"}</strong>.
              Leitura pausada em <em>{returnAnchor.label}</em>.
            </span>
          </div>
          <button
            type="button"
            onClick={handleReturnFromSpecialPage}
            className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-white text-[#990000] font-bold rounded-sm shadow hover:bg-[#f5f5f5] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Voltar Instantaneamente para Onde Eu Estava
          </button>
        </div>
      )}

      {/* ================= BARRA FLUTUANTE DE SELEÇÃO (DESTAQUE ESTILO KINDLE) ================= */}
      {selectedQuote && (
        <div className="fixed bottom-14 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-lg bg-white text-[#222] border-2 border-[#990000] rounded-sm shadow-2xl p-3 font-ao3Sans text-[12.5px]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-bold text-[#990000] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              Destacar Trecho Selecionado (Estilo Kindle)
            </span>
            <button
              type="button"
              onClick={() => setSelectedQuote("")}
              className="text-[#666] hover:text-black"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="italic text-[12px] text-[#444] bg-[#f7f7f7] p-2 border-l-2 border-[#990000] line-clamp-2 mb-2">
            &ldquo;{selectedQuote}&rdquo;
          </p>

          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[11.5px] text-[#555]">Cor:</span>
              {HIGHLIGHT_COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setHighlightColor(c.id)}
                  className={`w-5 h-5 rounded-full border-2 ${
                    highlightColor === c.id
                      ? "border-black scale-110"
                      : "border-transparent"
                  }`}
                  style={{ backgroundColor: c.bg }}
                  title={c.label}
                />
              ))}
            </div>

            <input
              type="text"
              value={highlightNote}
              onChange={(e) => setHighlightNote(e.target.value)}
              placeholder="Adicionar nota ao destaque (opcional)..."
              className="flex-1 min-w-[180px] border border-[#ccc] px-2 py-1 text-[12px] rounded-sm"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setSelectedQuote("")}
              className="px-2.5 py-1 border border-[#ccc] text-[12px] rounded-sm"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveHighlight}
              className="px-3 py-1 bg-[#990000] text-white font-medium text-[12px] rounded-sm"
            >
              Salvar Destaque
            </button>
          </div>
        </div>
      )}

      {/* ================= ÁREA DE LEITURA: MODO PAGINADO KINDLE (SEM SCROLL) vs MODO ROLAGEM ================= */}
      {isPaginated ? (
        <main
          onClick={handleKindleSurfaceClick}
          onMouseUp={handleMouseUpSelection}
          className="flex-1 relative flex items-center justify-center overflow-hidden px-8 sm:px-14 py-4 cursor-pointer"
          title="Clique no lado direito para avançar a página ou no lado esquerdo para voltar"
        >
          {/* Zona / Botão Lateral Esquerdo (Página Anterior) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handlePrevPage();
            }}
            disabled={currentChapterIndex === 0 && currentPageIndex === 0}
            className="absolute left-1.5 sm:left-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full border opacity-40 hover:opacity-100 disabled:opacity-10 transition-opacity"
            style={{
              backgroundColor: activeTheme.surface,
              borderColor: activeTheme.border,
              color: activeTheme.text,
            }}
            title="Página Anterior (ou clique no lado esquerdo da página)"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Container da Página do Kindle que mede exatamente a altura e largura disponíveis na tela */}
          <div
            ref={kindleViewportRef}
            className="w-full h-full overflow-hidden relative"
            style={{ maxWidth: `${maxWidth}px` }}
          >
            <div
              ref={kindleColumnsRef}
              className={`${fontClass} reader-prose kindle-columns-flow h-full transition-transform duration-300 ease-out`}
              style={{
                fontSize: `${fontSize}px`,
                lineHeight: lineHeight,
                height: `${viewportDims.height}px`,
                columnWidth: `${viewportDims.width}px`,
                columnGap: `${COLUMN_GAP}px`,
                columnFill: "auto",
                transform: `translate3d(-${
                  currentPageIndex * (viewportDims.width + COLUMN_GAP)
                }px, 0, 0)`,
              }}
            >
              {/* Cabeçalho compacto no início do capítulo */}
              <div
                className="mb-4 pb-2 border-b"
                style={{ borderColor: activeTheme.border }}
              >
                <div
                  className="text-[11px] uppercase tracking-wider font-ao3Sans"
                  style={{ color: activeTheme.muted }}
                >
                  {work.title} • {work.author}
                </div>
                <h2
                  className="text-[1.2em] font-serif font-bold mt-0.5"
                  style={{ color: activeTheme.accent }}
                >
                  {currentChapter?.title ||
                    `Capítulo ${currentChapterIndex + 1}`}
                </h2>
              </div>

              {/* Caso esteja consultando uma Página Especial Fixada */}
              {viewingPinnedPage && (
                <div
                  className="mb-4 p-3 rounded-sm border"
                  style={{
                    borderColor: activeTheme.accent,
                    backgroundColor: activeTheme.surface,
                  }}
                >
                  <div className="font-bold text-[0.9em] mb-1">
                    📌 {viewingPinnedPage.title}
                  </div>
                  {viewingPinnedPage.customHtmlOrNotes && (
                    <p className="text-[0.88em] whitespace-pre-line">
                      {viewingPinnedPage.customHtmlOrNotes}
                    </p>
                  )}
                  {viewingPinnedPage.imageDataUrl && (
                    <img
                      src={viewingPinnedPage.imageDataUrl}
                      alt={viewingPinnedPage.title}
                      className="max-h-[260px] w-auto mx-auto rounded my-2"
                    />
                  )}
                </div>
              )}

              {/* Conteúdo HTML do capítulo paginado automaticamente pelas colunas do tamanho da tela */}
              <div
                dangerouslySetInnerHTML={{
                  __html: decoratedChapterHtml,
                }}
              />
            </div>
          </div>

          {/* Zona / Botão Lateral Direito (Próxima Página) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNextPage();
            }}
            disabled={
              currentChapterIndex === work.chapters.length - 1 &&
              currentPageIndex >= totalPagesInChapter - 1
            }
            className="absolute right-1.5 sm:right-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full border opacity-40 hover:opacity-100 disabled:opacity-10 transition-opacity"
            style={{
              backgroundColor: activeTheme.surface,
              borderColor: activeTheme.border,
              color: activeTheme.text,
            }}
            title="Próxima Página (ou clique no lado direito da página)"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </main>
      ) : (
        /* ================= MODO ROLAGEM VERTICAL CONTÍNUA ================= */
        <main
          className="flex-1 w-full mx-auto px-4 sm:px-8 py-6 sm:py-10"
          style={{ maxWidth: `${maxWidth + 80}px` }}
          onMouseUp={handleMouseUpSelection}
        >
          {currentChapterIndex === 0 && (
            <section
              className="mb-8 p-4 rounded-sm border text-[12.5px] font-ao3Sans"
              style={{
                backgroundColor: activeTheme.surface,
                borderColor: activeTheme.border,
              }}
            >
              <div className="flex items-start gap-3 mb-3">
                <StatusIconsGrid
                  rating={work.rating}
                  category={work.category}
                  warningStatus={work.warningStatus}
                  completionStatus={work.completionStatus}
                />
                <div>
                  <h2
                    className="text-[20px] font-serif font-bold leading-snug"
                    style={{ color: activeTheme.accent }}
                  >
                    {work.title}
                  </h2>
                  <p
                    className="text-[13px]"
                    style={{ color: activeTheme.muted }}
                  >
                    por <strong>{work.author}</strong> • Fandom:{" "}
                    {work.fandoms.join(", ")}
                  </p>
                </div>
              </div>

              <div
                className="space-y-1 text-[12px] border-t pt-2.5"
                style={{ borderColor: activeTheme.border }}
              >
                <div>
                  <strong>Avisos:</strong> {work.tags.warnings.join(", ")}
                </div>
                {work.tags.relationships.length > 0 && (
                  <div>
                    <strong>Relacionamentos:</strong>{" "}
                    {work.tags.relationships.join(", ")}
                  </div>
                )}
                {work.tags.characters.length > 0 && (
                  <div>
                    <strong>Personagens:</strong>{" "}
                    {work.tags.characters.join(", ")}
                  </div>
                )}
                {work.tags.freeforms.length > 0 && (
                  <div>
                    <strong>Tags Adicionais:</strong>{" "}
                    {work.tags.freeforms.join(", ")}
                  </div>
                )}
              </div>

              {work.summary && (
                <blockquote
                  className="mt-3 pt-2.5 border-t italic text-[12.5px]"
                  style={{ borderColor: activeTheme.border }}
                >
                  {work.summary}
                </blockquote>
              )}
            </section>
          )}

          {viewingPinnedPage && (
            <div
              className="mb-6 p-4 rounded-sm border-2"
              style={{
                borderColor: activeTheme.accent,
                backgroundColor: activeTheme.surface,
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-[13px] font-bold uppercase tracking-wider flex items-center gap-1.5"
                  style={{ color: activeTheme.accent }}
                >
                  <MapPin className="w-4 h-4" />
                  Página Especial de Referência: {viewingPinnedPage.title}
                </span>
                {returnAnchor && (
                  <button
                    type="button"
                    onClick={handleReturnFromSpecialPage}
                    className="text-[12px] underline font-semibold"
                    style={{ color: activeTheme.accent }}
                  >
                    Fechar e voltar para a leitura
                  </button>
                )}
              </div>
              {viewingPinnedPage.customHtmlOrNotes && (
                <p className="text-[13.5px] whitespace-pre-line mb-3">
                  {viewingPinnedPage.customHtmlOrNotes}
                </p>
              )}
              {viewingPinnedPage.imageDataUrl && (
                <img
                  src={viewingPinnedPage.imageDataUrl}
                  alt={viewingPinnedPage.title}
                  className="max-h-[460px] w-auto mx-auto rounded border"
                />
              )}
            </div>
          )}

          <div
            className="mb-6 pb-3 border-b flex flex-wrap items-center justify-between gap-2"
            style={{ borderColor: activeTheme.border }}
          >
            <h3 className="text-[18px] font-serif font-bold">
              {currentChapter?.title || `Capítulo ${currentChapterIndex + 1}`}
            </h3>
            <span
              className="text-[11.5px]"
              style={{ color: activeTheme.muted }}
            >
              Selecione qualquer frase com o mouse para destacar (Estilo Kindle)
            </span>
          </div>

          <article
            className={`${fontClass} reader-prose select-text space-y-4`}
            style={{
              fontSize: `${fontSize}px`,
              lineHeight: lineHeight,
              maxWidth: `${maxWidth}px`,
              margin: "0 auto",
            }}
            dangerouslySetInnerHTML={{
              __html: decoratedChapterHtml,
            }}
          />

          <div
            className="mt-12 pt-5 border-t flex items-center justify-between gap-4 font-ao3Sans text-[13px]"
            style={{ borderColor: activeTheme.border }}
          >
            <button
              type="button"
              onClick={() => {
                if (currentChapterIndex > 0) {
                  setCurrentChapterIndex((c) => c - 1);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
              disabled={currentChapterIndex === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-sm border font-medium disabled:opacity-40"
              style={{
                backgroundColor: activeTheme.surface,
                borderColor: activeTheme.border,
              }}
            >
              <ChevronLeft className="w-4 h-4" />
              Capítulo Anterior
            </button>

            <button
              type="button"
              onClick={async () => {
                if (currentChapterIndex + 1 < work.chapters.length) {
                  setCurrentChapterIndex((c) => c + 1);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                } else {
                  await db.works.update(work.id, {
                    readingProgress: {
                      currentChapterIndex,
                      scrollPercentage: 100,
                      wordsRead: work.wordCount,
                      lastReadAt: new Date().toISOString(),
                    },
                    stats: {
                      ...work.stats,
                      rereadCount: (work.stats?.rereadCount || 0) + 1,
                    },
                  });
                  alert(
                    `Parabéns! Você concluiu "${work.title}". O contador de leituras foi atualizado!`
                  );
                }
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-sm border font-medium"
              style={{
                backgroundColor: activeTheme.accent,
                color: "#ffffff",
                borderColor: activeTheme.accent,
              }}
            >
              {currentChapterIndex + 1 < work.chapters.length
                ? "Próximo Capítulo →"
                : "✓ Concluir Leitura (+1 Leitura)"}
            </button>
          </div>
        </main>
      )}

      {/* ================= RODAPÉ DE PÁGINA E MÉTRICAS EM TEMPO REAL (ESTILO KINDLE) ================= */}
      <footer
        className="shrink-0 z-20 border-t px-4 py-1.5 font-ao3Sans text-[11.5px]"
        style={{
          backgroundColor: activeTheme.surface,
          borderColor: activeTheme.border,
          color: activeTheme.text,
        }}
      >
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <BookOpen
                className="w-3.5 h-3.5"
                style={{ color: activeTheme.accent }}
              />
              Cap. <strong>{currentChapterIndex + 1}</strong>/
              {work.chapters.length}
            </span>

            {isPaginated ? (
              <span>
                • Página{" "}
                <strong style={{ color: activeTheme.accent }}>
                  {currentPageIndex + 1}
                </strong>{" "}
                de <strong>{totalPagesInChapter}</strong> (Clique nas laterais
                da tela ou use ← → para virar a página)
              </span>
            ) : (
              <span>
                • Progresso do capítulo:{" "}
                <strong>{effectiveChapterPercent}%</strong>
              </span>
            )}
          </div>

          {/* Métricas de Tempo em Tempo Real */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-5">
            <span className="inline-flex items-center gap-1">
              <Clock
                className="w-3.5 h-3.5"
                style={{ color: activeTheme.accent }}
              />
              Restante no capítulo:{" "}
              <strong style={{ color: activeTheme.accent }}>
                {metrics.chapterTimeRemaining}
              </strong>
            </span>

            <span>
              Restante no livro:{" "}
              <strong style={{ color: activeTheme.accent }}>
                {metrics.bookTimeRemaining}
              </strong>{" "}
              ({metrics.overallPercent}%)
            </span>
          </div>
        </div>
      </footer>

      {/* ================= DRAWER LATERAL: DESTAQUES & MARCADORES (ESTILO KINDLE) ================= */}
      {showHighlightsDrawer && (
        <div className="fixed inset-0 z-50 bg-black/50 flex justify-end font-ao3Sans">
          <div className="w-full max-w-md bg-white text-[#222] h-full overflow-y-auto p-4 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#ddd]">
              <h3 className="font-serif font-bold text-[16px] text-[#990000] flex items-center gap-1.5">
                <Highlighter className="w-4 h-4" />
                Caderno de Destaques & Marcadores (Kindle)
              </h3>
              <button
                type="button"
                onClick={() => setShowHighlightsDrawer(false)}
                className="p-1 hover:bg-[#eee] rounded-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-3 space-y-5 flex-1 overflow-y-auto text-[12.5px]">
              {/* Seção 1: Trechos Destacados */}
              <div>
                <h4 className="font-bold text-[#333] mb-2 uppercase tracking-wider text-[11px]">
                  Frases e Trechos Favoritos ({highlights.length})
                </h4>
                {highlights.length === 0 ? (
                  <p className="text-[#666] text-[12px] bg-[#f9f9f9] p-3 border border-[#e5e5e5] rounded-sm">
                    Nenhum trecho destacado ainda. Selecione qualquer frase do
                    texto com o mouse para abrir o marca-texto colorido!
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {highlights.map((hl) => {
                      const cDef =
                        HIGHLIGHT_COLORS.find((c) => c.id === hl.color) ||
                        HIGHLIGHT_COLORS[0];
                      return (
                        <div
                          key={hl.id}
                          className="p-3 border border-[#ddd] rounded-sm bg-[#fafafa] hover:border-[#990000] transition-colors"
                        >
                          <div className="flex items-center justify-between text-[11px] text-[#666] mb-1">
                            <span>
                              Capítulo {hl.chapterIndex + 1} •{" "}
                              {hl.scrollPercentage}%
                            </span>
                            <button
                              type="button"
                              onClick={() => db.highlights.delete(hl.id)}
                              className="text-[#888] hover:text-[#990000]"
                              title="Excluir destaque"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <blockquote
                            onClick={() =>
                              jumpToPosition(
                                hl.chapterIndex,
                                hl.scrollPercentage,
                                hl.pageNumber
                              )
                            }
                            className="p-2 rounded-sm text-[#111] cursor-pointer text-[12.5px] leading-snug"
                            style={{
                              backgroundColor: cDef.bg,
                              borderLeft: `3px solid ${cDef.border}`,
                            }}
                          >
                            &ldquo;{hl.selectedText}&rdquo;
                          </blockquote>

                          {hl.note && (
                            <p className="mt-1.5 text-[11.5px] text-[#444]">
                              <strong>Nota:</strong> {hl.note}
                            </p>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              jumpToPosition(
                                hl.chapterIndex,
                                hl.scrollPercentage,
                                hl.pageNumber
                              )
                            }
                            className="mt-2 text-[11.5px] text-[#990000] font-semibold hover:underline"
                          >
                            Ir direto ao trecho no texto →
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Seção 2: Marcadores de Página */}
              <div className="pt-3 border-t border-[#eee]">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-[#333] uppercase tracking-wider text-[11px]">
                    Marcadores de Posição ({bookmarks.length})
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddBookmarkHere}
                    className="text-[11.5px] text-[#990000] font-semibold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Marcar página atual
                  </button>
                </div>

                {bookmarks.length === 0 ? (
                  <p className="text-[#666] text-[12px] bg-[#f9f9f9] p-3 border border-[#e5e5e5] rounded-sm">
                    Nenhum marcador salvo. Clique no ícone de marcador na barra
                    superior para salvar um ponto de parada.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {bookmarks.map((bm) => (
                      <div
                        key={bm.id}
                        className="p-2.5 border border-[#ddd] rounded-sm bg-white flex items-center justify-between gap-2"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            jumpToPosition(
                              bm.chapterIndex,
                              bm.scrollPercentage,
                              bm.pageNumber
                            )
                          }
                          className="text-left flex-1 hover:text-[#990000]"
                        >
                          <div className="font-semibold text-[12.5px]">
                            {bm.label}
                          </div>
                          {bm.snippet && (
                            <div className="text-[11px] text-[#666] line-clamp-1">
                              {bm.snippet}
                            </div>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => db.bookmarks.delete(bm.id)}
                          className="text-[#888] hover:text-[#990000]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL DE PÁGINAS ESPECIAIS (MAPAS, ÁRVORES GENEALÓGICAS, GLOSSÁRIOS) ================= */}
      {showPinnedModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 font-ao3Sans">
          <div className="bg-white text-[#222] border-2 border-[#990000] w-full max-w-2xl rounded-sm shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-[#990000] text-white px-4 py-3 flex items-center justify-between sticky top-0">
              <h3 className="font-serif text-[16px] font-bold flex items-center gap-2">
                <Compass className="w-4 h-4" />
                Páginas Especiais de Acesso Rápido (Mapas, Árvores Genealógicas,
                Glossários)
              </h3>
              <button
                type="button"
                onClick={() => setShowPinnedModal(false)}
                className="p-1 hover:bg-[#700000] rounded-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 text-[13px]">
              <p className="text-[#444] text-[12.5px]">
                Fixe capítulos de referência, mapas do mundo, árvores
                genealógicas ou glossários. Ao clicar em{" "}
                <strong>&ldquo;Consultar Agora&rdquo;</strong>, o leitor leva
                você até a referência e exibe um botão no topo para{" "}
                <strong>
                  voltar instantaneamente para a página exata onde sua leitura
                  estava!
                </strong>
              </p>

              <div className="space-y-2">
                <h4 className="font-bold text-[#222]">
                  Referências Fixadas neste Livro ({pinnedPages.length})
                </h4>
                {pinnedPages.length === 0 ? (
                  <p className="text-[#666] bg-[#f8f8f8] p-3 border border-[#ddd] rounded-sm text-[12px]">
                    Nenhuma página especial fixada neste livro ainda. Use o
                    formulário abaixo para fixar a página atual ou adicionar um
                    mapa/glossário!
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-2.5">
                    {pinnedPages.map((pin) => (
                      <div
                        key={pin.id}
                        className="p-3 border border-[#cccccc] bg-[#fafafa] rounded-sm flex flex-wrap items-center justify-between gap-3"
                      >
                        <div className="space-y-0.5 flex-1 min-w-[220px]">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 text-[10px] uppercase font-bold bg-[#990000] text-white rounded-sm">
                              {pin.category === "map"
                                ? "Mapa"
                                : pin.category === "family_tree"
                                ? "Árvore Genealógica"
                                : pin.category === "glossary"
                                ? "Glossário"
                                : "Referência"}
                            </span>
                            <span className="font-bold text-[13.5px] text-[#222]">
                              {pin.title}
                            </span>
                          </div>
                          <p className="text-[11.5px] text-[#555] line-clamp-2">
                            {pin.customHtmlOrNotes}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleConsultSpecialPage(pin)}
                            className="px-3 py-1.5 bg-[#990000] hover:bg-[#700000] text-white font-medium text-[12px] rounded-sm"
                          >
                            Consultar Agora (Com Retorno Rápido)
                          </button>
                          <button
                            type="button"
                            onClick={() => db.pinnedPages.delete(pin.id)}
                            className="p-1.5 text-[#777] hover:text-[#990000]"
                            title="Remover página fixada"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <form
                onSubmit={handlePinCurrentPage}
                className="pt-3 border-t border-[#ddd] space-y-3"
              >
                <h4 className="font-bold text-[#990000] flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  Fixar Página Atual (Cap. {currentChapterIndex + 1} - Pág.{" "}
                  {currentPageIndex + 1}) ou Adicionar Mapa/Glossário
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-2">
                    <label className="block text-[11.5px] font-medium mb-1">
                      Título da Página Especial *
                    </label>
                    <input
                      type="text"
                      required
                      value={newPinTitle}
                      onChange={(e) => setNewPinTitle(e.target.value)}
                      placeholder="Ex: Mapa da Quadra de Exy / Árvore Genealógica / Glossário Russo"
                      className="w-full border border-[#aaa] px-2.5 py-1.5 rounded-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[11.5px] font-medium mb-1">
                      Tipo de Referência
                    </label>
                    <select
                      value={newPinCategory}
                      onChange={(e) =>
                        setNewPinCategory(
                          e.target.value as PinnedSpecialPage["category"]
                        )
                      }
                      className="w-full bg-white border border-[#aaa] px-2 py-1.5 rounded-sm"
                    >
                      <option value="map">🗺️ Mapa</option>
                      <option value="family_tree">🌳 Árvore Genealógica</option>
                      <option value="glossary">📖 Glossário</option>
                      <option value="reference">📌 Outra Referência</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11.5px] font-medium mb-1">
                    Resumo / Glossário / Anotações da Página Especial
                  </label>
                  <textarea
                    rows={2}
                    value={newPinNotes}
                    onChange={(e) => setNewPinNotes(e.target.value)}
                    placeholder="Opcional: digite termos do glossário, nomes da árvore genealógica ou deixe em branco para usar o capítulo atual..."
                    className="w-full border border-[#aaa] px-2.5 py-1.5 rounded-sm"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-[11.5px] text-[#555] cursor-pointer hover:text-[#990000]">
                    <span className="underline">
                      Anexar imagem de Mapa/Árvore Genealógica (Opcional)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUploadForPin}
                      className="hidden"
                    />
                  </label>
                  {newPinImage && (
                    <span className="text-[11px] text-green-700 font-medium">
                      ✓ Imagem anexada!
                    </span>
                  )}

                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[#990000] hover:bg-[#700000] text-white font-medium rounded-sm ml-auto"
                  >
                    Fixar Página no Acesso Rápido
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
