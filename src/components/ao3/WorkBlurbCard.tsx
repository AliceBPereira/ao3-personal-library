"use client";

import React from "react";
import Link from "next/link";
import { WorkItem, CollectionShelf } from "@/types/work";
import { StatusIconsGrid } from "./StatusIconsGrid";
import {
  formatDateAO3,
  formatNumberPT,
  formatReadingTime,
} from "@/core/services/readingMetrics";
import { useLibraryStore } from "@/store/useLibraryStore";
import { useReaderStore } from "@/store/useReaderStore";
import {
  BookOpen,
  Download,
  Edit3,
  FolderPlus,
  Heart,
  Trash2,
} from "lucide-react";

interface WorkBlurbCardProps {
  work: WorkItem;
  collections: CollectionShelf[];
  onEdit: (work: WorkItem) => void;
  onExport: (work: WorkItem) => void;
  onDelete: (work: WorkItem) => void;
  onToggleKudos: (work: WorkItem) => void;
  onManageCollections: (work: WorkItem) => void;
}

export function WorkBlurbCard({
  work,
  collections,
  onEdit,
  onExport,
  onDelete,
  onToggleKudos,
  onManageCollections,
}: WorkBlurbCardProps) {
  const { toggleIncludeTag, includeTags, setActiveFandom } = useLibraryStore();
  const { wpm } = useReaderStore();

  const estimatedTime = formatReadingTime(work.wordCount, wpm);
  const workShelves = collections.filter((c) => work.collectionIds.includes(c.id));

  // Construir a lista de tags em linha exatamente como no AO3, mas mantendo o estilo de cada categoria
  const warningTags = work.tags.warnings || [];
  const relationshipTags = work.tags.relationships || [];
  const characterTags = work.tags.characters || [];
  const freeformTags = work.tags.freeforms || [];

  const allTagEntries: Array<{
    text: string;
    type: "warning" | "relationship" | "character" | "freeform";
  }> = [
    ...warningTags.map((text) => ({ text, type: "warning" as const })),
    ...relationshipTags.map((text) => ({ text, type: "relationship" as const })),
    ...characterTags.map((text) => ({ text, type: "character" as const })),
    ...freeformTags.map((text) => ({ text, type: "freeform" as const })),
  ];

  return (
    <article className="border border-[#dddddd] bg-white p-3 sm:p-4 mb-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)] font-ao3Sans text-[13px] text-[#2a2a2a] transition-colors hover:border-[#bbbbbb]">
      {/* Cabeçalho do Card: Ícones 2x2 + Título/Autor/Fandoms + Data */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0 flex-1">
          <StatusIconsGrid
            rating={work.rating}
            category={work.category}
            warningStatus={work.warningStatus}
            completionStatus={work.completionStatus}
          />

          <div className="min-w-0 flex-1">
            {/* Linha 1: Título por Autor */}
            <h4 className="text-[15px] leading-snug font-normal text-[#2a2a2a] break-words">
              <Link
                href={`/reader/${work.id}`}
                className="text-[#990000] hover:bg-[#990000] hover:text-white underline decoration-[#990000]/60 transition-colors px-0.5 -mx-0.5 font-medium"
              >
                {work.title}
              </Link>{" "}
              <span className="text-[#444444]">por</span>{" "}
              <button
                type="button"
                onClick={() => useLibraryStore.getState().setSearchQuery(work.author)}
                className="text-[#990000] hover:bg-[#990000] hover:text-white underline decoration-[#990000]/60 transition-colors px-0.5"
                title={`Filtrar obras de ${work.author}`}
              >
                {work.author}
              </button>
              <span className="ml-2 inline-block text-[10px] uppercase tracking-wider px-1.5 py-0.2 bg-[#f0f0f0] border border-[#ccc] text-[#555] rounded-sm align-middle">
                {work.format.toUpperCase()}
              </span>
            </h4>

            {/* Linha 2: Fandoms */}
            <h5 className="text-[12.5px] leading-snug mt-0.5 text-[#333333]">
              {work.fandoms.map((fandom, idx) => (
                <React.Fragment key={`${fandom}-${idx}`}>
                  <button
                    type="button"
                    onClick={() => setActiveFandom(fandom)}
                    className="border-b border-dotted border-[#555555] hover:bg-[#990000] hover:text-white hover:border-solid transition-colors text-left"
                  >
                    {fandom}
                  </button>
                  {idx < work.fandoms.length - 1 && <span>, </span>}
                </React.Fragment>
              ))}
            </h5>
          </div>
        </div>

        {/* Canto Superior Direito: Data de atualização */}
        <div className="text-[11px] text-[#555555] whitespace-nowrap font-mono shrink-0">
          {formatDateAO3(work.updatedAt)}
        </div>
      </div>

      {/* Sistema de Tags em Destaque (Coração do App) */}
      <div className="mt-2.5 leading-[1.65] text-[12.5px] break-words">
        {allTagEntries.map((entry, idx) => {
          const isSelected = includeTags.includes(entry.text);
          let tagStyle =
            "border-b border-dotted border-[#444444] text-[#111111] hover:bg-[#990000] hover:text-white cursor-pointer transition-colors";

          if (entry.type === "warning") {
            tagStyle =
              "font-bold border-b border-dotted border-[#222222] text-[#111111] hover:bg-[#990000] hover:text-white cursor-pointer transition-colors";
          } else if (entry.type === "relationship") {
            tagStyle =
              "bg-[#eeeeee] px-1 py-[1px] border-b border-dotted border-[#333333] text-[#111111] hover:bg-[#990000] hover:text-white cursor-pointer transition-colors";
          }

          if (isSelected) {
            tagStyle += " !bg-[#990000] !text-white px-1";
          }

          return (
            <React.Fragment key={`${entry.type}-${entry.text}-${idx}`}>
              <button
                type="button"
                onClick={() => toggleIncludeTag(entry.text)}
                className={`${tagStyle} inline text-left`}
                title={`Clique para filtrar pela tag (${entry.type}): ${entry.text}`}
              >
                {entry.text}
              </button>
              {idx < allTagEntries.length - 1 && (
                <span className="text-[#444444]">, </span>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Sinopse */}
      <blockquote className="mt-3 mb-3 text-[13px] leading-[1.55] text-[#2a2a2a] space-y-2 pl-0">
        {work.summary.split("\n\n").map((paragraph, pIdx) => (
          <p key={pIdx} className="whitespace-pre-line">
            {paragraph}
          </p>
        ))}
      </blockquote>

      {/* Prateleiras / Coleções Pessoais + Barra de Progresso se iniciada */}
      {(workShelves.length > 0 || work.readingProgress?.scrollPercentage > 0) && (
        <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-2 border-t border-dashed border-[#e5e5e5] text-[11.5px]">
          <div className="flex flex-wrap items-center gap-1.5">
            {workShelves.map((shelf) => (
              <button
                key={shelf.id}
                type="button"
                onClick={() =>
                  useLibraryStore.getState().setActiveCollectionId(shelf.id)
                }
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-[#f7f7f7] border border-[#d4d4d4] text-[#444] hover:border-[#990000] hover:text-[#990000] transition-colors"
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: shelf.color }}
                />
                {shelf.name}
              </button>
            ))}
          </div>

          {work.readingProgress?.scrollPercentage > 0 && (
            <div className="flex items-center gap-2 text-[#555]">
              <span>
                Progresso:{" "}
                <strong className="text-[#990000]">
                  {Math.round(work.readingProgress.scrollPercentage)}%
                </strong>{" "}
                (Cap. {work.readingProgress.currentChapterIndex + 1})
              </span>
              <div className="w-20 h-1.5 bg-[#eee] border border-[#ccc] overflow-hidden">
                <div
                  className="h-full bg-[#990000]"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round(work.readingProgress.scrollPercentage)
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rodapé de Metadados + Ações Rápidas */}
      <div className="mt-2.5 pt-2 border-t border-[#eeeeee] flex flex-wrap items-center justify-between gap-3 text-[12px] text-[#444444]">
        {/* Botões de Ação Pessoal */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Link
            href={`/reader/${work.id}`}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#990000] text-white hover:bg-[#700000] rounded-sm text-[11.5px] font-medium transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
            {work.readingProgress?.scrollPercentage > 0 &&
            work.readingProgress?.scrollPercentage < 100
              ? "Continuar Leitura"
              : "Ler Obra"}
          </Link>

          <button
            type="button"
            onClick={() => onEdit(work)}
            className="inline-flex items-center gap-1 px-2 py-1 bg-[#f3f3f3] hover:bg-[#e4e4e4] border border-[#cccccc] text-[#333] rounded-sm text-[11.5px] transition-colors"
            title="Editar Tags, Sinopse e Metadados"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Editar Tags
          </button>

          <button
            type="button"
            onClick={() => onManageCollections(work)}
            className="inline-flex items-center gap-1 px-2 py-1 bg-[#f3f3f3] hover:bg-[#e4e4e4] border border-[#cccccc] text-[#333] rounded-sm text-[11.5px] transition-colors"
            title="Adicionar ou remover de Prateleiras/Coleções"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            Prateleiras
          </button>

          <button
            type="button"
            onClick={() => onExport(work)}
            className="inline-flex items-center gap-1 px-2 py-1 bg-[#f3f3f3] hover:bg-[#e4e4e4] border border-[#cccccc] text-[#333] rounded-sm text-[11.5px] transition-colors"
            title="Exportar livro, tags e anotações"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar
          </button>

          <button
            type="button"
            onClick={() => onDelete(work)}
            className="inline-flex items-center gap-1 px-1.5 py-1 text-[#777] hover:text-[#990000] transition-colors"
            title="Remover obra da biblioteca"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Estatísticas estilo AO3 alinhadas à direita */}
        <dl className="flex flex-wrap items-center gap-x-3 gap-y-1 ml-auto text-[12px]">
          <div className="inline-flex gap-1">
            <dt className="text-[#555]">Idioma:</dt>
            <dd className="text-[#222]">{work.language}</dd>
          </div>

          <div className="inline-flex gap-1">
            <dt className="text-[#555]">Palavras:</dt>
            <dd className="text-[#222]">{formatNumberPT(work.wordCount)}</dd>
          </div>

          <div className="inline-flex gap-1">
            <dt className="text-[#555]">Capítulos:</dt>
            <dd className="text-[#222]">
              <Link
                href={`/reader/${work.id}`}
                className="border-b border-dotted border-[#333] hover:bg-[#990000] hover:text-white"
              >
                {work.chaptersCurrent}
              </Link>
              /{work.chaptersTotal ?? "?"}
            </dd>
          </div>

          <div
            className="inline-flex gap-1"
            title={`Calculado a ${wpm} palavras por minuto`}
          >
            <dt className="text-[#555]">Tempo estimado:</dt>
            <dd className="font-medium text-[#990000]">{estimatedTime}</dd>
          </div>

          <div className="inline-flex gap-1">
            <dt className="text-[#555]">Destaques:</dt>
            <dd className="border-b border-dotted border-[#333]">
              {work.stats?.highlightsCount || 0}
            </dd>
          </div>

          <div className="inline-flex gap-1">
            <button
              type="button"
              onClick={() => onToggleKudos(work)}
              className={`inline-flex items-center gap-1 border-b border-dotted border-[#333] hover:text-[#990000] ${
                work.stats?.kudosGiven ? "text-[#990000] font-semibold" : ""
              }`}
              title="Marcar/Desmarcar Kudos (Favorito)"
            >
              <Heart
                className={`w-3 h-3 ${
                  work.stats?.kudosGiven ? "fill-[#990000] text-[#990000]" : ""
                }`}
              />
              <span>Favorito:</span>
              <span>{work.stats?.kudosGiven ? "Sim" : "Não"}</span>
            </button>
          </div>

          <div className="inline-flex gap-1">
            <dt className="text-[#555]">Leituras:</dt>
            <dd className="text-[#222]">{work.stats?.rereadCount || 0}</dd>
          </div>
        </dl>
      </div>
    </article>
  );
}
