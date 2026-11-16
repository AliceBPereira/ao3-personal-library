"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/core/db/database";
import { READER_THEMES, useReaderStore } from "@/store/useReaderStore";
import { HeaderAO3 } from "@/components/ao3/HeaderAO3";
import { Ao3TrackerDashboard } from "@/components/tracker/Ao3TrackerDashboard";
import { ImportAndEditModal } from "@/components/library/ImportAndEditModal";
import { ShelvesManagerModal } from "@/components/library/ShelvesManagerModal";
import { ArrowLeft, Compass, Puzzle } from "lucide-react";

export default function Ao3TrackerPage() {
  const { theme } = useReaderStore();
  const activeTheme = READER_THEMES[theme] || READER_THEMES.cream;

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isShelvesModalOpen, setIsShelvesModalOpen] = useState(false);
  const [showExtensionGuide, setShowExtensionGuide] = useState(false);

  const collections = useLiveQuery(() => db.collections.toArray(), []) || [];

  const appOrigin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://ao3-personal-library.vercel.app";

  // Bookmarklet de 1 clique que funciona em qualquer navegador ( inclusive Mobile!) dentro do AO3 Original
  const bookmarkletCode = `javascript:(function(){var m=location.href.match(/works\\/(\\d+)/);if(!m){alert('Abra uma fanfic no Archive of Our Own (archiveofourown.org) primeiro!');return;}var ch=1;var sel=document.querySelector('#selected_id');if(sel){ch=sel.selectedIndex+1;}window.open('${appOrigin}/tracker?ao3Url='+encodeURIComponent(location.href)+'&chapter='+ch,'_blank');})();`;

  return (
    <div
      className="min-h-screen flex flex-col font-ao3Sans transition-colors duration-200"
      style={{
        backgroundColor: activeTheme.bg,
        color: activeTheme.text,
      }}
    >
      <HeaderAO3
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onOpenShelvesModal={() => setIsShelvesModalOpen(true)}
      />

      <main className="max-w-[1360px] w-full mx-auto px-4 py-5 flex-1 space-y-5">
        {/* Topo da página de acompanhamento */}
        <div
          className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b"
          style={{ borderColor: activeTheme.border }}
        >
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-sm text-[12.5px] font-medium hover:opacity-80"
              style={{
                backgroundColor: activeTheme.surface,
                borderColor: activeTheme.border,
              }}
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para Biblioteca
            </Link>
            <div>
              <h1 className="text-[20px] sm:text-[23px] font-serif font-bold">
                📡 Acompanhamento de Fanfics & Atualizações no AO3 Original
              </h1>
              <p className="text-[12px]" style={{ color: activeTheme.muted }}>
                Saiba exatamente quantas fics está lendo, em qual capítulo parou,
                quais atualizaram no AO3 Original e quantos capítulos faltam ler.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowExtensionGuide((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-sm text-[12px] font-semibold"
            style={{
              borderColor: activeTheme.accent,
              color: activeTheme.accent,
              backgroundColor: activeTheme.surface,
            }}
          >
            <Puzzle className="w-4 h-4" />
            {showExtensionGuide
              ? "Ocultar Extensão / Botão para AO3"
              : "🧩 Como Enviar Fics Direto de Dentro do AO3 Original (Extensão)"}
          </button>
        </div>

        {/* Guia da Extensão Chrome/Edge + Botão Favorito (Bookmarklet) para clicar dentro do AO3 Original */}
        {showExtensionGuide && (
          <div
            className="p-4 rounded-sm border-2 space-y-3 text-[12.5px]"
            style={{
              backgroundColor: activeTheme.surface,
              borderColor: activeTheme.accent,
            }}
          >
            <h3 className="font-serif font-bold text-[15px] flex items-center gap-2">
              <Compass
                className="w-4 h-4"
                style={{ color: activeTheme.accent }}
              />
              Duas Formas de Clicar na Fanfic Dentro do Próprio AO3 Original e
              Atualizar Automaticamente:
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                className="p-3 rounded-sm border"
                style={{
                  backgroundColor: activeTheme.bg,
                  borderColor: activeTheme.border,
                }}
              >
                <div className="font-bold text-[13px] mb-1">
                  Opção 1: Extensão do Navegador (`extension-ao3-tracker`)
                </div>
                <p className="text-[12px] mb-2" style={{ color: activeTheme.muted }}>
                  Criamos uma extensão pronta na pasta{" "}
                  <code>extension-ao3-tracker</code> do seu projeto! Ela injeta
                  um botão <strong>&ldquo;📌 Acompanhar no AO3 Personal&rdquo;</strong>{" "}
                  direto na barra de cada fanfic quando você está navegando no{" "}
                  <code>archiveofourown.org</code> e detecta sozinha em qual
                  capítulo você está:
                </p>
                <ol className="list-decimal pl-5 space-y-1 text-[11.5px]">
                  <li>
                    Abra <code>chrome://extensions</code> (ou{" "}
                    <code>edge://extensions</code>) no seu navegador.
                  </li>
                  <li>
                    Ative a chave <strong>Modo do desenvolvedor</strong> no
                    canto superior direito.
                  </li>
                  <li>
                    Clique em <strong>Carregar sem compactação</strong> e
                    selecione a pasta{" "}
                    <code>c:\Users\alici\Documents\site fanfic\extension-ao3-tracker</code>.
                  </li>
                </ol>
              </div>

              <div
                className="p-3 rounded-sm border"
                style={{
                  backgroundColor: activeTheme.bg,
                  borderColor: activeTheme.border,
                }}
              >
                <div className="font-bold text-[13px] mb-1">
                  Opção 2: Botão de Barra de Favoritos (Sem instalar nada!)
                </div>
                <p className="text-[12px] mb-2" style={{ color: activeTheme.muted }}>
                  Arraste o botão vermelho abaixo para a sua{" "}
                  <strong>Barra de Favoritos</strong> do navegador. Quando
                  estiver lendo qualquer fanfic lá no AO3 Original, basta clicar
                  nele na barra de favoritos que ele identifica o capítulo atual
                  e envia direto para cá!
                </p>
                <div className="pt-1">
                  <a
                    href={bookmarkletCode}
                    onClick={(e) => {
                      e.preventDefault();
                      alert(
                        "Arraste este botão com o mouse para a Barra de Favoritos do seu navegador! Depois, quando estiver no site do AO3 Original, clique nele para enviar a fanfic automaticamente."
                      );
                    }}
                    className="inline-block px-3.5 py-2 bg-[#990000] text-white font-bold rounded-sm shadow cursor-move text-[12px]"
                  >
                    📌 + Acompanhar Fic no AO3 Personal
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        <Suspense fallback={<div className="p-8 text-center">Carregando rastreador do AO3...</div>}>
          <Ao3TrackerDashboard />
        </Suspense>
      </main>

      <ImportAndEditModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        editingWork={null}
        collections={collections}
      />

      <ShelvesManagerModal
        isOpen={isShelvesModalOpen}
        onClose={() => setIsShelvesModalOpen(false)}
        collections={collections}
        targetWork={null}
      />
    </div>
  );
}
