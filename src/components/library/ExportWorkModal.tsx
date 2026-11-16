"use client";

import React from "react";
import { WorkItem } from "@/types/work";
import {
  exportWorkAsEpub,
  exportWorkAsHtmlAO3,
  exportWorkBundleZip,
} from "@/core/exporters/libraryExporter";
import { BookDown, FileArchive, FileCode, X } from "lucide-react";

interface ExportWorkModalProps {
  work: WorkItem | null;
  onClose: () => void;
}

export function ExportWorkModal({ work, onClose }: ExportWorkModalProps) {
  if (!work) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 font-ao3Sans">
      <div className="bg-white border-2 border-[#990000] w-full max-w-md rounded-sm shadow-xl">
        <div className="bg-[#990000] text-white px-4 py-3 flex items-center justify-between">
          <h3 className="font-serif text-[16px] font-bold">
            Exportar Obra: {work.title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-[#700000] rounded-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3 text-[13px]">
          <p className="text-[#444]">
            Escolha como deseja exportar <strong>{work.title}</strong> (por{" "}
            {work.author}):
          </p>

          <button
            type="button"
            onClick={async () => {
              await exportWorkAsHtmlAO3(work);
              onClose();
            }}
            className="w-full flex items-start gap-3 p-3 border border-[#cccccc] hover:border-[#990000] bg-[#fafafa] hover:bg-[#fdf5f5] rounded-sm text-left transition-colors"
          >
            <FileCode className="w-5 h-5 text-[#990000] shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-[#222]">
                HTML Estilo AO3 (Com Tags + Destaques)
              </div>
              <div className="text-[11.5px] text-[#555]">
                Gera um arquivo .html idêntico ao download oficial do AO3, incluindo cabeçalho de tags e todos os seus trechos destacados no final.
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={async () => {
              await exportWorkAsEpub(work);
              onClose();
            }}
            className="w-full flex items-start gap-3 p-3 border border-[#cccccc] hover:border-[#990000] bg-[#fafafa] hover:bg-[#fdf5f5] rounded-sm text-left transition-colors"
          >
            <BookDown className="w-5 h-5 text-[#990000] shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-[#222]">
                Arquivo E-book (.EPUB Convertido)
              </div>
              <div className="text-[11.5px] text-[#555]">
                Empacota os capítulos e as tags da obra em um arquivo .epub compatível com Kindle, Kobo e outros leitores.
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={async () => {
              await exportWorkBundleZip(work);
              onClose();
            }}
            className="w-full flex items-start gap-3 p-3 border border-[#cccccc] hover:border-[#990000] bg-[#fafafa] hover:bg-[#fdf5f5] rounded-sm text-left transition-colors"
          >
            <FileArchive className="w-5 h-5 text-[#990000] shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-[#222]">
                Pacote Completo (.ZIP: Original + JSON de Notas/Marcadores)
              </div>
              <div className="text-[11.5px] text-[#555]">
                Exporta o arquivo original junto com um JSON contendo todas as suas tags, marcadores, destaques e páginas especiais fixadas.
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
