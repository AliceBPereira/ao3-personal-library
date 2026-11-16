"use client";

import React from "react";
import Link from "next/link";
import { useLibraryStore } from "@/store/useLibraryStore";
import { exportEntireLibraryBackup } from "@/core/exporters/libraryExporter";
import {
  BookPlus,
  DownloadCloud,
  FolderHeart,
  Library,
  Search,
} from "lucide-react";

interface HeaderAO3Props {
  onOpenImportModal: () => void;
  onOpenShelvesModal: () => void;
}

export function HeaderAO3({
  onOpenImportModal,
  onOpenShelvesModal,
}: HeaderAO3Props) {
  const { searchQuery, setSearchQuery, resetAllFilters } = useLibraryStore();

  return (
    <header className="w-full bg-white border-b border-[#dddddd] font-ao3Sans">
      {/* Topo branco com Logo AO3 */}
      <div className="max-w-[1360px] mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/"
          onClick={() => resetAllFilters()}
          className="flex items-center gap-2.5 group"
        >
          <div className="w-9 h-9 rounded-sm bg-[#990000] text-white flex items-center justify-center font-serif font-bold text-lg tracking-tighter shadow-sm group-hover:bg-[#700000] transition-colors">
            AO3
          </div>
          <div>
            <span className="text-[20px] sm:text-[22px] font-serif text-[#990000] tracking-tight block leading-none">
              Arquivo de Nossa Autoria
            </span>
            <span className="text-[11px] text-[#666666] block mt-0.5">
              Biblioteca Pessoal de Livros & Fanfics • EPUB • PDF • MOBI • HTML
            </span>
          </div>
        </Link>

        {/* Botões rápidos no canto superior direito */}
        <div className="flex flex-wrap items-center gap-2 text-[12px]">
          <button
            type="button"
            onClick={onOpenImportModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#990000] hover:bg-[#700000] text-white font-medium rounded-sm shadow-sm transition-colors"
          >
            <BookPlus className="w-4 h-4" />
            Importar Livro / Fanfic
          </button>

          <button
            type="button"
            onClick={onOpenShelvesModal}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#f3f3f3] hover:bg-[#e5e5e5] border border-[#cccccc] text-[#222222] rounded-sm transition-colors"
          >
            <FolderHeart className="w-4 h-4 text-[#990000]" />
            Coleções / Prateleiras
          </button>

          <button
            type="button"
            onClick={() => exportEntireLibraryBackup()}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#f3f3f3] hover:bg-[#e5e5e5] border border-[#cccccc] text-[#222222] rounded-sm transition-colors"
            title="Exportar Backup JSON de toda a biblioteca e anotações"
          >
            <DownloadCloud className="w-4 h-4 text-[#444]" />
            Backup Geral
          </button>
        </div>
      </div>

      {/* Barra Vermelha Clássica do AO3 */}
      <div className="w-full bg-gradient-to-b from-[#990000] to-[#7a0000] text-white shadow-inner">
        <div className="max-w-[1360px] mx-auto px-4 py-1.5 flex flex-wrap items-center justify-between gap-3">
          <nav className="flex flex-wrap items-center gap-4 text-[13px]">
            <Link
              href="/"
              onClick={() => resetAllFilters()}
              className="hover:underline flex items-center gap-1 font-medium"
            >
              <Library className="w-3.5 h-3.5" />
              Todas as Obras
            </Link>
            <button
              type="button"
              onClick={() =>
                useLibraryStore
                  .getState()
                  .setActiveFandom("Tudo Pelo Jogo - Nora Sakavic")
              }
              className="hover:underline"
            >
              Fandoms
            </button>
            <button
              type="button"
              onClick={onOpenShelvesModal}
              className="hover:underline"
            >
              Minhas Prateleiras
            </button>
            <button
              type="button"
              onClick={onOpenImportModal}
              className="hover:underline"
            >
              Importar (EPUB/PDF/MOBI/HTML)
            </button>
          </nav>

          {/* Barra de pesquisa estilo AO3 */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar título, autor, ship, tag..."
                className="w-full bg-white text-[#222222] text-[12px] pl-2.5 pr-7 py-1 rounded-sm border border-[#550000] focus:outline-none"
              />
              <Search className="w-3.5 h-3.5 text-[#666] absolute right-2 top-1/2 -translate-y-1/2" />
            </div>
            <button
              type="button"
              onClick={() => {}}
              className="px-2.5 py-1 bg-[#eeeeee] hover:bg-white text-[#222222] text-[12px] rounded-sm border border-[#550000] font-medium"
            >
              Pesquisar
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
