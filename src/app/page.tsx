"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, ensureDatabaseSeeded } from "@/core/db/database";
import { filterAndSortWorks } from "@/core/services/tagFilterEngine";
import { useLibraryStore } from "@/store/useLibraryStore";
import { READER_THEMES, useReaderStore } from "@/store/useReaderStore";
import { HeaderAO3 } from "@/components/ao3/HeaderAO3";
import { WorkBlurbCard } from "@/components/ao3/WorkBlurbCard";
import { FilterSidebar } from "@/components/ao3/FilterSidebar";
import { ImportAndEditModal } from "@/components/library/ImportAndEditModal";
import { ExportWorkModal } from "@/components/library/ExportWorkModal";
import { ShelvesManagerModal } from "@/components/library/ShelvesManagerModal";
import { WorkItem } from "@/types/work";
import { BookPlus, FolderHeart, Sparkles, X } from "lucide-react";

const ITEMS_PER_PAGE = 10;

export default function LibraryHomePage() {
  const filterState = useLibraryStore();
  const { theme } = useReaderStore();
  const activeTheme = READER_THEMES[theme] || READER_THEMES.cream;

  const [showBanner, setShowBanner] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Modais
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingWork, setEditingWork] = useState<WorkItem | null>(null);
  const [exportingWork, setExportingWork] = useState<WorkItem | null>(null);
  const [isShelvesModalOpen, setIsShelvesModalOpen] = useState(false);
  const [shelfTargetWork, setShelfTargetWork] = useState<WorkItem | null>(null);

  useEffect(() => {
    ensureDatabaseSeeded();
  }, []);

  const allWorks = useLiveQuery(() => db.works.toArray(), []) || [];
  const collections = useLiveQuery(() => db.collections.toArray(), []) || [];

  const filteredWorks = useMemo(
    () => filterAndSortWorks(allWorks, filterState),
    [allWorks, filterState]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [
    filterState.searchQuery,
    filterState.activeCollectionId,
    filterState.activeFandom,
    filterState.includeTags,
    filterState.excludeTags,
    filterState.includeRatings,
    filterState.excludeRatings,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredWorks.length / ITEMS_PER_PAGE)
  );
  const paginatedWorks = filteredWorks.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const activeCollection = collections.find(
    (c) => c.id === filterState.activeCollectionId
  );

  const contextHeading = useMemo(() => {
    if (activeCollection) return activeCollection.name;
    if (filterState.includeTags.length > 0)
      return filterState.includeTags.join(" + ");
    if (filterState.activeFandom) return filterState.activeFandom;
    if (filterState.searchQuery.trim())
      return `"${filterState.searchQuery.trim()}"`;
    return "Sua Biblioteca Pessoal";
  }, [
    activeCollection,
    filterState.includeTags,
    filterState.activeFandom,
    filterState.searchQuery,
  ]);

  const handleToggleKudos = async (work: WorkItem) => {
    await db.works.update(work.id, {
      stats: {
        ...work.stats,
        kudosGiven: !work.stats?.kudosGiven,
      },
    });
  };

  const handleDeleteWork = async (work: WorkItem) => {
    if (
      window.confirm(
        `Deseja realmente remover "${work.title}" da sua biblioteca?`
      )
    ) {
      await db.works.delete(work.id);
      await db.highlights.where("workId").equals(work.id).delete();
      await db.bookmarks.where("workId").equals(work.id).delete();
      await db.pinnedPages.where("workId").equals(work.id).delete();
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col font-ao3Sans transition-colors duration-200"
      style={{
        backgroundColor: activeTheme.bg,
        color: activeTheme.text,
      }}
    >
      <HeaderAO3
        onOpenImportModal={() => {
          setEditingWork(null);
          setIsImportModalOpen(true);
        }}
        onOpenShelvesModal={() => {
          setShelfTargetWork(null);
          setIsShelvesModalOpen(true);
        }}
      />

      {/* Banner Estilo AO3 */}
      {showBanner && (
        <div className="max-w-[1360px] w-full mx-auto px-4 mt-3">
          <div
            className="border px-4 py-2.5 text-[12.5px] relative rounded-sm shadow-sm"
            style={{
              backgroundColor: activeTheme.surface,
              borderColor: activeTheme.border,
              color: activeTheme.text,
            }}
          >
            <p className="pr-6 leading-relaxed">
              <strong>Sua Biblioteca Pessoal AO3 está ativa!</strong> Você pode
              importar livros e fanfics em{" "}
              <strong>EPUB, PDF, MOBI e HTML</strong>, traduzir livros inteiros{" "}
              <strong>sem internet (Inglês/Russo → Português)</strong>, e o{" "}
              <strong>Tema escolhido</strong> vale tanto para a Biblioteca
              quanto para dentro dos livros.
            </p>
            <button
              type="button"
              onClick={() => setShowBanner(false)}
              className="absolute right-2.5 top-2.5 w-5 h-5 rounded-full border flex items-center justify-center opacity-75 hover:opacity-100"
              style={{
                backgroundColor: activeTheme.bg,
                borderColor: activeTheme.border,
              }}
              title="Fechar aviso"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Container Principal */}
      <main className="max-w-[1360px] w-full mx-auto px-4 py-4 flex-1">
        {/* Linha de Título de Contagem Estilo AO3 + Botões de Prateleiras */}
        <div
          className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b"
          style={{ borderColor: activeTheme.border }}
        >
          <h2 className="text-[20px] sm:text-[23px] font-serif">
            {filteredWorks.length > 0
              ? `${(currentPage - 1) * ITEMS_PER_PAGE + 1} - ${Math.min(
                  currentPage * ITEMS_PER_PAGE,
                  filteredWorks.length
                )} de ${filteredWorks.length} obras em `
              : "0 obras encontradas em "}
            <span
              className="border-b border-dotted"
              style={{ borderColor: activeTheme.text }}
            >
              {contextHeading}
            </span>
          </h2>

          <div className="flex flex-wrap items-center gap-1.5 text-[12px]">
            <button
              type="button"
              onClick={() => filterState.setActiveCollectionId(null)}
              className="px-2.5 py-1 border rounded-sm transition-colors"
              style={{
                backgroundColor:
                  filterState.activeCollectionId === null
                    ? activeTheme.accent
                    : activeTheme.surface,
                color:
                  filterState.activeCollectionId === null
                    ? "#ffffff"
                    : activeTheme.text,
                borderColor:
                  filterState.activeCollectionId === null
                    ? activeTheme.accent
                    : activeTheme.border,
              }}
            >
              Todas ({allWorks.length})
            </button>
            {collections.map((shelf) => {
              const isActive = filterState.activeCollectionId === shelf.id;
              const count = allWorks.filter((w) =>
                w.collectionIds.includes(shelf.id)
              ).length;
              return (
                <button
                  key={shelf.id}
                  type="button"
                  onClick={() =>
                    filterState.setActiveCollectionId(
                      isActive ? null : shelf.id
                    )
                  }
                  className="px-2.5 py-1 border rounded-sm flex items-center gap-1.5 transition-colors"
                  style={{
                    backgroundColor: isActive
                      ? activeTheme.accent
                      : activeTheme.surface,
                    color: isActive ? "#ffffff" : activeTheme.text,
                    borderColor: isActive
                      ? activeTheme.accent
                      : activeTheme.border,
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: isActive ? "#ffffff" : shelf.color,
                    }}
                  />
                  <span>
                    {shelf.name} ({count})
                  </span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => {
                setShelfTargetWork(null);
                setIsShelvesModalOpen(true);
              }}
              className="px-2 py-1 border border-dashed rounded-sm inline-flex items-center gap-1"
              style={{
                borderColor: activeTheme.accent,
                color: activeTheme.accent,
              }}
              title="Criar ou gerenciar Prateleiras"
            >
              <FolderHeart className="w-3.5 h-3.5" />
              + Prateleira
            </button>
          </div>
        </div>

        {/* Chips de Filtros Ativos */}
        {(filterState.includeTags.length > 0 ||
          filterState.excludeTags.length > 0 ||
          filterState.activeFandom ||
          filterState.searchQuery.trim()) && (
          <div className="flex flex-wrap items-center gap-1.5 py-2.5 text-[12px]">
            <span className="font-medium" style={{ color: activeTheme.muted }}>
              Filtros ativos:
            </span>
            {filterState.activeFandom && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 border rounded-sm"
                style={{
                  backgroundColor: activeTheme.surface,
                  borderColor: activeTheme.border,
                }}
              >
                Fandom: <strong>{filterState.activeFandom}</strong>
                <button
                  type="button"
                  onClick={() => filterState.setActiveFandom(null)}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filterState.includeTags.map((tag) => (
              <span
                key={`inc-${tag}`}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-white rounded-sm"
                style={{ backgroundColor: activeTheme.accent }}
              >
                + {tag}
                <button
                  type="button"
                  onClick={() => filterState.toggleIncludeTag(tag)}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {filterState.excludeTags.map((tag) => (
              <span
                key={`exc-${tag}`}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#333333] text-white rounded-sm line-through"
              >
                - {tag}
                <button
                  type="button"
                  onClick={() => filterState.toggleExcludeTag(tag)}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={() => filterState.resetAllFilters()}
              className="underline ml-2 text-[11.5px]"
              style={{ color: activeTheme.accent }}
            >
              Limpar tudo
            </button>
          </div>
        )}

        {/* Paginação Superior Estilo AO3 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1 my-3 text-[12px]">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2 py-0.5 border disabled:opacity-40"
              style={{
                backgroundColor: activeTheme.surface,
                borderColor: activeTheme.border,
              }}
            >
              ← Anterior
            </button>
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentPage(idx + 1)}
                className="px-2 py-0.5 border"
                style={{
                  backgroundColor:
                    currentPage === idx + 1
                      ? activeTheme.accent
                      : activeTheme.surface,
                  color: currentPage === idx + 1 ? "#ffffff" : activeTheme.text,
                  borderColor: activeTheme.border,
                }}
              >
                {idx + 1}
              </button>
            ))}
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2 py-0.5 border disabled:opacity-40"
              style={{
                backgroundColor: activeTheme.surface,
                borderColor: activeTheme.border,
              }}
            >
              Próximo →
            </button>
          </div>
        )}

        {/* Layout de 2 Colunas do AO3: Lista de Cards (Esquerda) + Sidebar Classificar e Filtrar (Direita) */}
        <div className="mt-4 flex flex-col lg:flex-row items-start gap-5">
          <div className="flex-1 w-full min-w-0">
            {paginatedWorks.length === 0 ? (
              <div
                className="border p-8 text-center rounded-sm space-y-3"
                style={{
                  backgroundColor: activeTheme.surface,
                  borderColor: activeTheme.border,
                }}
              >
                <Sparkles
                  className="w-8 h-8 mx-auto"
                  style={{ color: activeTheme.accent }}
                />
                <h3 className="font-serif text-[17px]">
                  Nenhuma obra corresponde aos filtros selecionados
                </h3>
                <p
                  className="text-[13px] max-w-md mx-auto"
                  style={{ color: activeTheme.muted }}
                >
                  Você pode limpar os filtros ativos na barra lateral ou
                  importar um novo livro/fanfic nos formatos EPUB, PDF, MOBI ou
                  HTML.
                </p>
                <div className="flex justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => filterState.resetAllFilters()}
                    className="px-3 py-1.5 border text-[12.5px] rounded-sm"
                    style={{
                      backgroundColor: activeTheme.bg,
                      borderColor: activeTheme.border,
                    }}
                  >
                    Resetar Filtros
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingWork(null);
                      setIsImportModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-white text-[12.5px] rounded-sm"
                    style={{ backgroundColor: activeTheme.accent }}
                  >
                    <BookPlus className="w-4 h-4" />
                    Importar Livro
                  </button>
                </div>
              </div>
            ) : (
              paginatedWorks.map((work) => (
                <WorkBlurbCard
                  key={work.id}
                  work={work}
                  collections={collections}
                  onEdit={(w) => {
                    setEditingWork(w);
                    setIsImportModalOpen(true);
                  }}
                  onExport={(w) => setExportingWork(w)}
                  onDelete={handleDeleteWork}
                  onToggleKudos={handleToggleKudos}
                  onManageCollections={(w) => {
                    setShelfTargetWork(w);
                    setIsShelvesModalOpen(true);
                  }}
                />
              ))
            )}
          </div>

          <FilterSidebar allWorks={allWorks} filteredWorks={filteredWorks} />
        </div>
      </main>

      {/* Rodapé Clássico Estilo AO3 */}
      <footer
        className="mt-12 text-white py-5 px-4 text-[12px]"
        style={{ backgroundColor: activeTheme.accent }}
      >
        <div className="max-w-[1360px] mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <strong>Arquivo de Nossa Autoria (Biblioteca Pessoal)</strong> —
            Inspirado na arquitetura de informação do Archive of Our Own (OTW).
          </div>
          <div className="text-white/80">
            Suporte a EPUB, PDF, MOBI e HTML • Funcionamento 100% Offline via
            IndexedDB & Service Worker
          </div>
        </div>
      </footer>

      {/* Modais */}
      <ImportAndEditModal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          setEditingWork(null);
        }}
        editingWork={editingWork}
        collections={collections}
      />

      <ExportWorkModal
        work={exportingWork}
        onClose={() => setExportingWork(null)}
      />

      <ShelvesManagerModal
        isOpen={isShelvesModalOpen}
        onClose={() => {
          setIsShelvesModalOpen(false);
          setShelfTargetWork(null);
        }}
        collections={collections}
        targetWork={shelfTargetWork}
      />
    </div>
  );
}
