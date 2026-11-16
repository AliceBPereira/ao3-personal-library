"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLibraryStore } from "@/store/useLibraryStore";
import { READER_THEMES, useReaderStore } from "@/store/useReaderStore";
import { ReaderThemeId } from "@/types/work";
import { exportEntireLibraryBackup } from "@/core/exporters/libraryExporter";
import {
  BookPlus,
  DownloadCloud,
  FolderHeart,
  Library,
  Palette,
  Search,
  X,
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
  const { theme, setTheme } = useReaderStore();
  const [showThemePicker, setShowThemePicker] = useState(false);

  const activeTheme = READER_THEMES[theme] || READER_THEMES.cream;

  return (
    <header
      className="sticky top-0 z-40 w-full border-b font-ao3Sans shadow-sm transition-colors duration-200"
      style={{
        backgroundColor: activeTheme.bg,
        borderColor: activeTheme.border,
        color: activeTheme.text,
      }}
    >
      {/* Topo com Logo AO3 + Ações + Seletor Global de Tema */}
      <div className="max-w-[1360px] mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/"
          onClick={() => resetAllFilters()}
          className="flex items-center gap-2.5 group"
        >
          <div
            className="w-9 h-9 rounded-sm text-white flex items-center justify-center font-serif font-bold text-lg tracking-tighter shadow-sm transition-colors"
            style={{ backgroundColor: activeTheme.accent }}
          >
            AO3
          </div>
          <div>
            <span
              className="text-[19px] sm:text-[21px] font-serif tracking-tight block leading-none font-bold"
              style={{ color: activeTheme.accent }}
            >
              Arquivo de Nossa Autoria
            </span>
            <span
              className="text-[11px] block mt-0.5"
              style={{ color: activeTheme.muted }}
            >
              Biblioteca Pessoal de Livros & Fanfics • EPUB • PDF • MOBI • HTML
            </span>
          </div>
        </Link>

        {/* Botões rápidos no canto superior direito */}
        <div className="flex flex-wrap items-center gap-2 text-[12px]">
          <button
            type="button"
            onClick={onOpenImportModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-white font-medium rounded-sm shadow-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: activeTheme.accent }}
          >
            <BookPlus className="w-4 h-4" />
            Importar Livro / Fanfic
          </button>

          <button
            type="button"
            onClick={onOpenShelvesModal}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border rounded-sm transition-colors hover:opacity-85"
            style={{
              backgroundColor: activeTheme.surface,
              borderColor: activeTheme.border,
              color: activeTheme.text,
            }}
          >
            <FolderHeart
              className="w-4 h-4"
              style={{ color: activeTheme.accent }}
            />
            Coleções / Prateleiras
          </button>

          <button
            type="button"
            onClick={() => setShowThemePicker((v) => !v)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border rounded-sm font-medium transition-colors"
            style={{
              backgroundColor: showThemePicker
                ? activeTheme.accent
                : activeTheme.surface,
              borderColor: activeTheme.border,
              color: showThemePicker ? "#ffffff" : activeTheme.text,
            }}
            title="Mudar o tema de cores do site inteiro e do leitor"
          >
            <Palette className="w-4 h-4" />
            Temas ({activeTheme.name})
          </button>

          <button
            type="button"
            onClick={() => exportEntireLibraryBackup()}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border rounded-sm transition-colors hover:opacity-85"
            style={{
              backgroundColor: activeTheme.surface,
              borderColor: activeTheme.border,
              color: activeTheme.text,
            }}
            title="Exportar Backup JSON de toda a biblioteca e anotações"
          >
            <DownloadCloud className="w-4 h-4" />
            Backup
          </button>
        </div>
      </div>

      {/* Painel Global de Temas (Vale para o site todo e para dentro dos livros) */}
      {showThemePicker && (
        <div
          className="max-w-[1360px] mx-auto px-4 py-3 border-t"
          style={{
            backgroundColor: activeTheme.surface,
            borderColor: activeTheme.border,
          }}
        >
          <div className="flex items-center justify-between mb-2 text-[12.5px]">
            <span className="font-bold">
              Escolha o Tema do Site e do Leitor (Sincronizado em todas as páginas):
            </span>
            <button
              type="button"
              onClick={() => setShowThemePicker(false)}
              className="p-1 opacity-75 hover:opacity-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
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
                  <div className="flex items-center justify-between mb-0.5">
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
        </div>
      )}

      {/* Barra Vermelha Clássica do AO3 */}
      <div
        className="w-full text-white shadow-inner"
        style={{
          background: `linear-gradient(to bottom, ${activeTheme.accent}, #6b0000)`,
        }}
      >
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
                className="w-full text-[12px] pl-2.5 pr-7 py-1 rounded-sm border focus:outline-none"
                style={{
                  backgroundColor: activeTheme.bg,
                  color: activeTheme.text,
                  borderColor: activeTheme.border,
                }}
              />
              <Search
                className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2"
                style={{ color: activeTheme.muted }}
              />
            </div>
            <button
              type="button"
              onClick={() => {}}
              className="px-2.5 py-1 text-[12px] rounded-sm border font-medium"
              style={{
                backgroundColor: activeTheme.surface,
                color: activeTheme.text,
                borderColor: activeTheme.border,
              }}
            >
              Pesquisar
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
