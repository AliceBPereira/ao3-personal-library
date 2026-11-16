"use client";

import React, { useState } from "react";
import { WorkItem } from "@/types/work";
import { exportWorkAsEpub } from "@/core/exporters/libraryExporter";
import { useReaderStore } from "@/store/useReaderStore";
import { BookDown, Languages, Loader2, X } from "lucide-react";

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

  const handleDownloadCleanEpub = async () => {
    setIsExporting(true);
    setProgressText("Gerando livro EPUB limpo...");
    try {
      await exportWorkAsEpub(work, {
        exportTranslatedPt: exportInPortuguese,
        sourceLang,
        onProgress: (msg: string) => setProgressText(msg),
      });
      onClose();
    } finally {
      setIsExporting(false);
      setProgressText(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 font-ao3Sans">
      <div className="bg-white text-[#222] border-2 border-[#990000] w-full max-w-md rounded-sm shadow-xl overflow-hidden">
        <div className="bg-[#990000] text-white px-4 py-3 flex items-center justify-between">
          <h3 className="font-serif text-[16px] font-bold">
            Exportar Livro (.EPUB): {work.title}
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
          {/* Seletor de Idioma do Livro EPUB */}
          <div className="space-y-2">
            <div className="font-bold text-[#222] flex items-center gap-1.5">
              <Languages className="w-4 h-4 text-[#990000]" />
              Escolha o Idioma do EPUB:
            </div>

            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                disabled={isExporting}
                onClick={() => setExportInPortuguese(true)}
                className={`p-3 rounded-sm border text-left transition-all ${
                  exportInPortuguese
                    ? "bg-[#990000] text-white border-[#990000] font-semibold shadow-sm"
                    : "bg-[#fafafa] text-[#222] border-[#ccc] hover:border-[#990000]"
                }`}
              >
                <div className="text-[13px]">
                  🇧🇷 Livro Completo Traduzido em Português (.EPUB)
                </div>
                <div
                  className={`text-[11px] font-normal mt-0.5 ${
                    exportInPortuguese ? "text-white/90" : "text-[#666]"
                  }`}
                >
                  {hasSavedTranslation
                    ? "✓ Tradução completa já pronta! Exporta apenas o texto do livro formatado."
                    : `Traduz todos os ${work.chapters.length} capítulo(s) e exporta apenas o texto limpo de livro.`}
                </div>
              </button>

              <button
                type="button"
                disabled={isExporting}
                onClick={() => setExportInPortuguese(false)}
                className={`p-3 rounded-sm border text-left transition-all ${
                  !exportInPortuguese
                    ? "bg-[#333333] text-white border-[#333333] font-semibold shadow-sm"
                    : "bg-[#fafafa] text-[#222] border-[#ccc] hover:border-[#333]"
                }`}
              >
                <div className="text-[13px]">
                  🌐 Livro no Idioma Original (.EPUB)
                </div>
                <div
                  className={`text-[11px] font-normal mt-0.5 ${
                    !exportInPortuguese ? "text-white/90" : "text-[#666]"
                  }`}
                >
                  Exporta o livro no idioma original ({work.language}) apenas
                  com o texto limpo.
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

          {/* Botão Principal de Download do EPUB Limpo */}
          <button
            type="button"
            disabled={isExporting}
            onClick={handleDownloadCleanEpub}
            className="w-full py-2.5 px-4 bg-[#990000] hover:bg-[#700000] text-white font-bold rounded-sm shadow flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <BookDown className="w-5 h-5" />
            <span>
              Baixar Livro .EPUB{" "}
              {exportInPortuguese ? "(Traduzido PT-BR)" : "(Original)"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
