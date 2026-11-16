"use client";

import React, { useState } from "react";
import { BookFileFormat, WorkItem } from "@/types/work";
import {
  exportWorkAsEpub,
  exportWorkAsHtmlBook,
  exportWorkAsMobi,
  exportWorkAsPdf,
} from "@/core/exporters/libraryExporter";
import { useReaderStore } from "@/store/useReaderStore";
import {
  BookDown,
  FileCode,
  FileText,
  Languages,
  Loader2,
  Smartphone,
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

  const handleExportFormat = async (format: BookFileFormat) => {
    setIsExporting(true);
    setProgressText(`Preparando livro em formato .${format.toUpperCase()}...`);
    try {
      const opts = {
        exportTranslatedPt: exportInPortuguese,
        sourceLang,
        onProgress: (msg: string) => setProgressText(msg),
      };

      switch (format) {
        case "epub":
          await exportWorkAsEpub(work, opts);
          break;
        case "html":
          await exportWorkAsHtmlBook(work, opts);
          break;
        case "mobi":
          await exportWorkAsMobi(work, opts);
          break;
        case "pdf":
          await exportWorkAsPdf(work, opts);
          break;
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
            Exportar Livro: {work.title}
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
          {/* 1. Escolha do Idioma (Traduzido em Português vs Original) */}
          <div className="space-y-2">
            <div className="font-bold text-[#222] flex items-center gap-1.5">
              <Languages className="w-4 h-4 text-[#990000]" />
              1. Escolha o Idioma da Exportação:
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                disabled={isExporting}
                onClick={() => setExportInPortuguese(true)}
                className={`p-2.5 rounded-sm border text-left transition-all ${
                  exportInPortuguese
                    ? "bg-[#990000] text-white border-[#990000] font-semibold shadow-sm"
                    : "bg-[#fafafa] text-[#222] border-[#ccc] hover:border-[#990000]"
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
                    ? "✓ Tradução pronta no cache local!"
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
                    : "bg-[#fafafa] text-[#222] border-[#ccc] hover:border-[#333]"
                }`}
              >
                <div className="text-[12.5px]">🌐 Idioma Original</div>
                <div
                  className={`text-[10.5px] font-normal mt-0.5 ${
                    !exportInPortuguese ? "text-white/90" : "text-[#666]"
                  }`}
                >
                  Exporta no idioma original ({work.language})
                </div>
              </button>
            </div>
          </div>

          {isExporting && progressText && (
            <div className="p-3 bg-[#fdf5f5] border border-[#e3baba] rounded-sm flex items-center gap-2.5 text-[#990000] font-medium text-[12px]">
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              <span>{progressText}</span>
            </div>
          )}

          {/* 2. Escolha do Formato (Todos os 4 formatos que podem ser recebidos: EPUB, HTML, PDF, MOBI) */}
          <div className="space-y-2">
            <div className="font-bold text-[#222]">
              2. Escolha o Formato do Livro (Apenas o texto limpo para leitura):
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* EPUB */}
              <button
                type="button"
                disabled={isExporting}
                onClick={() => handleExportFormat("epub")}
                className="flex items-start gap-2.5 p-3 border border-[#cccccc] hover:border-[#990000] bg-[#fafafa] hover:bg-[#fdf5f5] rounded-sm text-left transition-colors disabled:opacity-50"
              >
                <BookDown className="w-5 h-5 text-[#990000] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-[#222]">.EPUB (E-book)</div>
                  <div className="text-[11px] text-[#555] leading-snug">
                    Livro digital paginado limpo para leitores de e-book, celular
                    e reimportação.
                  </div>
                </div>
              </button>

              {/* HTML */}
              <button
                type="button"
                disabled={isExporting}
                onClick={() => handleExportFormat("html")}
                className="flex items-start gap-2.5 p-3 border border-[#cccccc] hover:border-[#990000] bg-[#fafafa] hover:bg-[#fdf5f5] rounded-sm text-left transition-colors disabled:opacity-50"
              >
                <FileCode className="w-5 h-5 text-[#990000] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-[#222]">.HTML (Web Book)</div>
                  <div className="text-[11px] text-[#555] leading-snug">
                    Livro em página única limpa para abrir em qualquer navegador
                    sem internet.
                  </div>
                </div>
              </button>

              {/* MOBI */}
              <button
                type="button"
                disabled={isExporting}
                onClick={() => handleExportFormat("mobi")}
                className="flex items-start gap-2.5 p-3 border border-[#cccccc] hover:border-[#990000] bg-[#fafafa] hover:bg-[#fdf5f5] rounded-sm text-left transition-colors disabled:opacity-50"
              >
                <Smartphone className="w-5 h-5 text-[#990000] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-[#222]">.MOBI (Kindle)</div>
                  <div className="text-[11px] text-[#555] leading-snug">
                    Formato binário PalmDOC/MOBI compatível com Kindle e
                    reimportação.
                  </div>
                </div>
              </button>

              {/* PDF */}
              <button
                type="button"
                disabled={isExporting}
                onClick={() => handleExportFormat("pdf")}
                className="flex items-start gap-2.5 p-3 border border-[#cccccc] hover:border-[#990000] bg-[#fafafa] hover:bg-[#fdf5f5] rounded-sm text-left transition-colors disabled:opacity-50"
              >
                <FileText className="w-5 h-5 text-[#990000] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-[#222]">.PDF (Documento)</div>
                  <div className="text-[11px] text-[#555] leading-snug">
                    Diagramação de livro pronta para salvar como PDF ou
                    imprimir.
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
