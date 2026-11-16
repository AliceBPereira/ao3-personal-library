"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, ensureDatabaseSeeded } from "@/core/db/database";
import { filterAndSortWorks } from "@/core/services/tagFilterEngine";
import { useLibraryStore } from "@/store/useLibraryStore";
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

  // Título dinâmico estilo AO3 ("1 - 5 de 5 obras em Neil Josten/Andrew Minyard")
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
    <div className="min-h-screen flex flex-col bg-white font-ao3Sans">
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

      {/* Banner Amarelo Clássico Estilo AO3 */}
      {showBanner && (
        <div className="max-w-[1360px] w-full mx-auto px-4 mt-3">
          <div className="bg-[#f9e398] border border-[#e4be44] px-4 py-2.5 text-[12.5px] text-[#2a2a2a] relative rounded-sm shadow-sm">
            <p className="pr-6 leading-relaxed">
              <strong>Sua Biblioteca Pessoal AO3 está ativa!</strong> Você pode
              importar livros e fanfics em{" "}
              <strong>EPUB, PDF, MOBI e HTML</strong>, clicar em qualquer tag
              para filtrar (incluir/excluir), organizar obras em{" "}
              <strong>Prateleiras</strong> e ler com{" "}
              <strong>6 temas de papel confortáveis</strong> (Claro, Escuro,
              Sépia, Papel Creme, Cinza Fosco e Verde Sálvia), destaques estilo
              Kindle e acesso rápido a <strong>Páginas Especiais Fixadas</strong>{" "}
              (mapas, árvores genealógicas e glossários).
            </p>
            <button
              type="button"
              onClick={() => setShowBanner(false)}
              className="absolute right-2.5 top-2.5 w-5 h-5 rounded-full bg-white/80 hover:bg-white border border-[#cca832] flex items-center justify-center text-[#555]"
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
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#dddddd]">
          <h2 className="text-[20px] sm:text-[23px] font-serif text-[#2a2a2a]">
            {filteredWorks.length > 0
              ? `${(currentPage - 1) * ITEMS_PER_PAGE + 1} - ${Math.min(
                  currentPage * ITEMS_PER_PAGE,
                  filteredWorks.length
                )} de ${filteredWorks.length} obras em `
              : "0 obras encontradas em "}
            <span className="border-b border-dotted border-[#2a2a2a]">
              {contextHeading}
            </span>
          </h2>

          <div className="flex flex-wrap items-center gap-1.5 text-[12px]">
            <button
              type="button"
              onClick={() => filterState.setActiveCollectionId(null)}
              className={`px-2.5 py-1 border rounded-sm transition-colors ${
                filterState.activeCollectionId === null
                  ? "bg-[#990000] text-white border-[#990000] font-medium"
                  : "bg-[#eeeeee] text-[#222] border-[#bbbbbb] hover:bg-[#e0e0e0]"
              }`}
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
                  className={`px-2.5 py-1 border rounded-sm flex items-center gap-1.5 transition-colors ${
                    isActive
                      ? "bg-[#990000] text-white border-[#990000] font-medium"
                      : "bg-[#eeeeee] text-[#222] border-[#bbbbbb] hover:bg-[#e0e0e0]"
                  }`}
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
              className="px-2 py-1 border border-dashed border-[#990000] text-[#990000] hover:bg-[#fdf2f2] rounded-sm inline-flex items-center gap-1"
              title="Criar ou gerenciar Prateleiras"
            >
              <FolderHeart className="w-3.5 h-3.5" />
              + Prateleira
            </button>
          </div>
        </div>

        {/* Chips de Filtros Ativos (Incluir / Excluir) */}
        {(filterState.includeTags.length > 0 ||
          filterState.excludeTags.length > 0 ||
          filterState.activeFandom ||
          filterState.searchQuery.trim()) && (
          <div className="flex flex-wrap items-center gap-1.5 py-2.5 text-[12px]">
            <span className="text-[#555] font-medium">Filtros ativos:</span>
            {filterState.activeFandom && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#f2f2f2] border border-[#ccc] rounded-sm">
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
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#990000] text-white rounded-sm"
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
              className="text-[#990000] underline ml-2 text-[11.5px]"
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
              className="px-2 py-0.5 border border-[#ccc] bg-[#f5f5f5] disabled:opacity-40"
            >
              ← Anterior
            </button>
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentPage(idx + 1)}
                className={`px-2 py-0.5 border ${
                  currentPage === idx + 1
                    ? "bg-[#aaaaaa] text-white border-[#888888] font-bold"
                    : "bg-[#f5f5f5] border-[#ccc] hover:bg-[#e5e5e5]"
                }`}
              >
                {idx + 1}
              </button>
            ))}
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2 py-0.5 border border-[#ccc] bg-[#f5f5f5] disabled:opacity-40"
            >
              Próximo →
            </button>
          </div>
        )}

        {/* Layout de 2 Colunas do AO3: Lista de Cards (Esquerda) + Sidebar Classificar e Filtrar (Direita) */}
        <div className="mt-4 flex flex-col lg:flex-row items-start gap-5">
          {/* Coluna Principal: Cards de Obras */}
          <div className="flex-1 w-full min-w-0">
            {paginatedWorks.length === 0 ? (
              <div className="border border-[#dddddd] bg-[#fafafa] p-8 text-center rounded-sm space-y-3">
                <Sparkles className="w-8 h-8 text-[#990000] mx-auto" />
                <h3 className="font-serif text-[17px] text-[#222]">
                  Nenhuma obra corresponde aos filtros selecionados
                </h3>
                <p className="text-[13px] text-[#555] max-w-md mx-auto">
                  Você pode limpar os filtros ativos na barra lateral ou
                  importar um novo livro/fanfic nos formatos EPUB, PDF, MOBI ou
                  HTML.
                </p>
                <div className="flex justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => filterState.resetAllFilters()}
                    className="px-3 py-1.5 border border-[#aaaaaa] bg-white text-[12.5px] rounded-sm"
                  >
                    Resetar Filtros
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingWork(null);
                      setIsImportModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#990000] text-white text-[12.5px] rounded-sm"
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

          {/* Coluna Direita: Classificar e Filtrar (Estilo AO3) */}
          <FilterSidebar allWorks={allWorks} filteredWorks={filteredWorks} />
        </div>
      </main>

      {/* Rodapé Clássico Estilo AO3 */}
      <footer className="mt-12 bg-[#990000] text-white py-5 px-4 text-[12px]">
        <div className="max-w-[1360px] mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <strong>Arquivo de Nossa Autoria (Biblioteca Pessoal)</strong> —
            Inspirado na arquitetura de informação do Archive of Our Own (OTW).
          </div>
          <div className="text-white/80">
            Suporte a EPUB, PDF, MOBI e HTML • Armazenamento Offline via
            IndexedDB
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
