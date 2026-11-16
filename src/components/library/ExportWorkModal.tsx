"use client";

import React, { useState } from "react";
import { WorkItem } from "@/types/work";
import {
  exportWorkAsEpub,
  exportWorkAsHtmlAO3,
  exportWorkBundleZip,
} from "@/core/exporters/libraryExporter";
import { useReaderStore } from "@/store/useReaderStore";
import {
  BookDown,
  FileArchive,
  FileCode,
  Languages,
  Loader2,
  X,
} from "lucide-react";

interface ExportWorkModalProps {
  work: WorkItem | null;
  onClose: () => void;
}

export function ExportWorkModal({ work, onClose }: ExportWorkModalProps) {
  const { translateToPt, sourceLang } = useReaderStore();
  const [exportInPortuguese, setExportInPortuguese] = useState<boolean>(
    translateToPt || true
  );
  const [isExporting, setIsExporting] = useState(false);
  const [progressText, setProgressText] = useState<string | null>(null);

  if (!work) return null;

  const hasSavedTranslation =
    work.translatedChaptersPt &&
    work.translatedChaptersPt.length === work.chapters.length;

  const handleRunExport = async (type: "html" | "epub" | "zip") => {
    setIsExporting(true);
    setProgressText("Preparando arquivo para download...");
    try {
      const opts = {
        exportTranslatedPt: exportInPortuguese,
        sourceLang,
        onProgress: (msg: string) => setProgressText(msg),
      };

      if (type === "html") {
        await exportWorkAsHtmlAO3(work, opts);
      } else if (type === "epub") {
        await exportWorkAsEpub(work, opts);
      } else {
        await exportWorkBundleZip(work, opts);
      }
      onClose();
    } finally {
      setIsExporting(false);
      setProgressText(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 font-ao3Sans">
      <div className="bg-white text-[#222] border-2 border-[#990000] w-full max-w-lg rounded-sm shadow-xl overflow-hidden">
        <div className="bg-[#990000] text-white px-4 py-3 flex items-center justify-between">
          <h3 className="font-serif text-[16px] font-bold">
            Exportar Obra: {work.title}
          </h3>
          <button
            type="button"
            disabled={isExporting}
            onClick={onClose}
            className="p-1 hover:bg-[#700000] rounded-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4 text-[13px]">
          {/* Seletor de Idioma da Exportação: Traduzido em Português vs Original */}
          <div className="p-3 bg-[#fdf5f5] border border-[#e3baba] rounded-sm space-y-2">
            <div className="font-bold text-[#990000] flex items-center gap-1.5">
              <Languages className="w-4 h-4" />
              Idioma do Livro Exportado:
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                disabled={isExporting}
                onClick={() => setExportInPortuguese(true)}
                className={`p-2.5 rounded-sm border text-left transition-all ${
                  exportInPortuguese
                    ? "bg-[#990000] text-white border-[#990000] font-semibold shadow-sm"
                    : "bg-white text-[#222] border-[#ccc] hover:border-[#990000]"
                }`}
              >
                <div className="text-[12.5px]">
                  🇧🇷 Livro Completo Traduzido (Português)
                </div>
                <div
                  className={`text-[10.5px] font-normal mt-0.5 ${
                    exportInPortuguese ? "text-white/90" : "text-[#666]"
                  }`}
                >
                  {hasSavedTranslation
                    ? "✓ Tradução completa já pronta no cache!"
                    : `Traduz todos os ${work.chapters.length} capítulo(s) automaticamente`}
                </div>
              </button>

              <button
                type="button"
                disabled={isExporting}
                onClick={() => setExportInPortuguese(false)}
                className={`p-2.5 rounded-sm border text-left transition-all ${
                  !exportInPortuguese
                    ? "bg-[#333333] text-white border-[#333333] font-semibold shadow-sm"
                    : "bg-white text-[#222] border-[#ccc] hover:border-[#333]"
                }`}
              >
                <div className="text-[12.5px]">🌐 Idioma Original</div>
                <div
                  className={`text-[10.5px] font-normal mt-0.5 ${
                    !exportInPortuguese ? "text-white/90" : "text-[#666]"
                  }`}
                >
                  Exporta o texto original sem alterações ({work.language})
                </div>
              </button>
            </div>
          </div>

          {isExporting && progressText && (
            <div className="p-3 bg-[#f5f5f5] border border-[#ccc] rounded-sm flex items-center gap-2.5 text-[#990000] font-medium">
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              <span>{progressText}</span>
            </div>
          )}

          <p className="text-[#444] font-medium">
            Escolha o formato para baixar{" "}
            <strong>
              {exportInPortuguese
                ? "a versão traduzida em Português"
                : "a versão original"}
            </strong>
            :
          </p>

          <div className="space-y-2.5">
            <button
              type="button"
              disabled={isExporting}
              onClick={() => handleRunExport("epub")}
              className="w-full flex items-start gap-3 p-3 border border-[#cccccc] hover:border-[#990000] bg-[#fafafa] hover:bg-[#fdf5f5] rounded-sm text-left transition-colors disabled:opacity-50"
            >
              <BookDown className="w-5 h-5 text-[#990000] shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-[#222]">
                  Arquivo E-book (.EPUB{" "}
                  {exportInPortuguese ? "Traduzido em Português" : "Original"})
                </div>
                <div className="text-[11.5px] text-[#555]">
                  Gera um arquivo .epub completo com todos os capítulos, título,
                  sinopse e tags em{" "}
                  {exportInPortuguese ? "Português (PT-BR)" : "idioma original"},
                  pronto para Kindle, Kobo ou celular.
                </div>
              </div>
            </button>

            <button
              type="button"
              disabled={isExporting}
              onClick={() => handleRunExport("html")}
              className="w-full flex items-start gap-3 p-3 border border-[#cccccc] hover:border-[#990000] bg-[#fafafa] hover:bg-[#fdf5f5] rounded-sm text-left transition-colors disabled:opacity-50"
            >
              <FileCode className="w-5 h-5 text-[#990000] shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-[#222]">
                  HTML Estilo AO3 (
                  {exportInPortuguese ? "Traduzido em Português" : "Original"} +
                  Destaques)
                </div>
                <div className="text-[11.5px] text-[#555]">
                  Gera um arquivo .html idêntico ao download oficial do AO3 com
                  todos os capítulos{" "}
                  {exportInPortuguese ? "traduzidos para Português" : ""} e seus
                  trechos destacados no final.
                </div>
              </div>
            </button>

            <button
              type="button"
              disabled={isExporting}
              onClick={() => handleRunExport("zip")}
              className="w-full flex items-start gap-3 p-3 border border-[#cccccc] hover:border-[#990000] bg-[#fafafa] hover:bg-[#fdf5f5] rounded-sm text-left transition-colors disabled:opacity-50"
            >
              <FileArchive className="w-5 h-5 text-[#990000] shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-[#222]">
                  Pacote Completo (.ZIP:{" "}
                  {exportInPortuguese ? "Livro Traduzido" : "Original"} + JSON
                  de Notas/Marcadores)
                </div>
                <div className="text-[11.5px] text-[#555]">
                  Exporta o pacote completo com o livro{" "}
                  {exportInPortuguese ? "traduzido em Português" : ""}, arquivo
                  original e JSON de metadados, marcadores e páginas especiais.
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
