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
import { READER_THEMES, useReaderStore } from "@/store/useReaderStore";
import {
  translatePlainStringOffline,
  translateStringsBatchNeural,
} from "@/core/services/offlineTranslator";
import { db } from "@/core/db/database";
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
  const { wpm, theme, translateToPt, sourceLang } = useReaderStore();
  const activeTheme = READER_THEMES[theme] || READER_THEMES.cream;

  React.useEffect(() => {
    if (!translateToPt) return;
    if (work.translatedTitlePt && work.translatedSummaryPt) return;
    let cancelled = false;
    translateStringsBatchNeural([work.title, work.summary], sourceLang).then(
      ([tTitle, tSum]) => {
        if (!cancelled && tTitle) {
          db.works.update(work.id, {
            translatedTitlePt: tTitle,
            translatedSummaryPt: tSum || work.summary,
          });
        }
      }
    );
    return () => {
      cancelled = true;
    };
  }, [
    translateToPt,
    sourceLang,
    work.id,
    work.title,
    work.summary,
    work.translatedTitlePt,
    work.translatedSummaryPt,
  ]);

  const displayedTitle = translateToPt
    ? work.translatedTitlePt ||
      translatePlainStringOffline(work.title, sourceLang)
    : work.title;
  const displayedSummary = translateToPt
    ? work.translatedSummaryPt ||
      translatePlainStringOffline(work.summary, sourceLang)
    : work.summary;

  const estimatedTime = formatReadingTime(work.wordCount, wpm);
  const workShelves = collections.filter((c) => work.collectionIds.includes(c.id));

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
    <article
      className="border p-3 sm:p-4 mb-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)] font-ao3Sans text-[13px] transition-colors"
      style={{
        backgroundColor: activeTheme.bg,
        borderColor: activeTheme.border,
        color: activeTheme.text,
      }}
    >
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
            <h4 className="text-[15px] leading-snug font-normal break-words">
              <Link
                href={`/reader/${work.id}`}
                className="underline transition-colors px-0.5 -mx-0.5 font-medium hover:opacity-80"
                style={{ color: activeTheme.accent }}
              >
                {displayedTitle}
              </Link>{" "}
              <span style={{ color: activeTheme.muted }}>por</span>{" "}
              <button
                type="button"
                onClick={() =>
                  useLibraryStore.getState().setSearchQuery(work.author)
                }
                className="underline transition-colors px-0.5 hover:opacity-80"
                style={{ color: activeTheme.accent }}
                title={`Filtrar obras de ${work.author}`}
              >
                {work.author}
              </button>
              <span
                className="ml-2 inline-block text-[10px] uppercase tracking-wider px-1.5 py-0.2 border rounded-sm align-middle"
                style={{
                  backgroundColor: activeTheme.surface,
                  borderColor: activeTheme.border,
                  color: activeTheme.muted,
                }}
              >
                {work.format.toUpperCase()}
              </span>
            </h4>

            {/* Linha 2: Fandoms */}
            <h5
              className="text-[12.5px] leading-snug mt-0.5"
              style={{ color: activeTheme.muted }}
            >
              {work.fandoms.map((fandom, idx) => (
                <React.Fragment key={`${fandom}-${idx}`}>
                  <button
                    type="button"
                    onClick={() => setActiveFandom(fandom)}
                    className="border-b border-dotted hover:opacity-80 transition-opacity text-left"
                    style={{
                      borderColor: activeTheme.muted,
                      color: activeTheme.text,
                    }}
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
        <div
          className="text-[11px] whitespace-nowrap font-mono shrink-0"
          style={{ color: activeTheme.muted }}
        >
          {formatDateAO3(work.updatedAt)}
        </div>
      </div>

      {/* Sistema de Tags em Destaque */}
      <div className="mt-2.5 leading-[1.65] text-[12.5px] break-words">
        {allTagEntries.map((entry, idx) => {
          const isSelected = includeTags.includes(entry.text);
          const isRelationship = entry.type === "relationship";
          const isWarning = entry.type === "warning";

          return (
            <React.Fragment key={`${entry.type}-${entry.text}-${idx}`}>
              <button
                type="button"
                onClick={() => toggleIncludeTag(entry.text)}
                className={`inline text-left border-b border-dotted transition-colors cursor-pointer ${
                  isWarning ? "font-bold" : ""
                } ${isRelationship ? "px-1 py-[1px] rounded-[2px]" : ""}`}
                style={{
                  backgroundColor: isSelected
                    ? activeTheme.accent
                    : isRelationship
                    ? activeTheme.surface
                    : "transparent",
                  color: isSelected ? "#ffffff" : activeTheme.text,
                  borderColor: activeTheme.muted,
                }}
                title={`Clique para filtrar pela tag (${entry.type}): ${entry.text}`}
              >
                {translateToPt
                  ? translatePlainStringOffline(entry.text, sourceLang)
                  : entry.text}
              </button>
              {idx < allTagEntries.length - 1 && (
                <span style={{ color: activeTheme.muted }}>, </span>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Sinopse */}
      <blockquote
        className="mt-3 mb-3 text-[13px] leading-[1.55] space-y-2 pl-2.5 border-l-2"
        style={{
          color: activeTheme.text,
          borderColor: activeTheme.border,
        }}
      >
        {displayedSummary.split("\n\n").map((paragraph, pIdx) => (
          <p key={pIdx} className="whitespace-pre-line">
            {paragraph}
          </p>
        ))}
      </blockquote>

      {/* Prateleiras / Coleções Pessoais + Barra de Progresso */}
      {(workShelves.length > 0 || work.readingProgress?.scrollPercentage > 0) && (
        <div
          className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-2 border-t border-dashed text-[11.5px]"
          style={{ borderColor: activeTheme.border }}
        >
          <div className="flex flex-wrap items-center gap-1.5">
            {workShelves.map((shelf) => (
              <button
                key={shelf.id}
                type="button"
                onClick={() =>
                  useLibraryStore.getState().setActiveCollectionId(shelf.id)
                }
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm border transition-colors"
                style={{
                  backgroundColor: activeTheme.surface,
                  borderColor: activeTheme.border,
                  color: activeTheme.text,
                }}
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
            <div
              className="flex items-center gap-2"
              style={{ color: activeTheme.muted }}
            >
              <span>
                Progresso:{" "}
                <strong style={{ color: activeTheme.accent }}>
                  {Math.round(work.readingProgress.scrollPercentage)}%
                </strong>{" "}
                (Cap. {work.readingProgress.currentChapterIndex + 1})
              </span>
              <div
                className="w-20 h-1.5 border overflow-hidden"
                style={{
                  backgroundColor: activeTheme.surface,
                  borderColor: activeTheme.border,
                }}
              >
                <div
                  className="h-full"
                  style={{
                    backgroundColor: activeTheme.accent,
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
      <div
        className="mt-2.5 pt-2 border-t flex flex-wrap items-center justify-between gap-3 text-[12px]"
        style={{
          borderColor: activeTheme.border,
          color: activeTheme.muted,
        }}
      >
        <div className="flex flex-wrap items-center gap-1.5">
          <Link
            href={`/reader/${work.id}`}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-white rounded-sm text-[11.5px] font-medium transition-opacity hover:opacity-90"
            style={{ backgroundColor: activeTheme.accent }}
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
            className="inline-flex items-center gap-1 px-2 py-1 border rounded-sm text-[11.5px] transition-opacity hover:opacity-80"
            style={{
              backgroundColor: activeTheme.surface,
              borderColor: activeTheme.border,
              color: activeTheme.text,
            }}
          >
            <Edit3 className="w-3.5 h-3.5" />
            Editar Tags
          </button>

          <button
            type="button"
            onClick={() => onManageCollections(work)}
            className="inline-flex items-center gap-1 px-2 py-1 border rounded-sm text-[11.5px] transition-opacity hover:opacity-80"
            style={{
              backgroundColor: activeTheme.surface,
              borderColor: activeTheme.border,
              color: activeTheme.text,
            }}
          >
            <FolderPlus className="w-3.5 h-3.5" />
            Prateleiras
          </button>

          <button
            type="button"
            onClick={() => onExport(work)}
            className="inline-flex items-center gap-1 px-2 py-1 border rounded-sm text-[11.5px] transition-opacity hover:opacity-80"
            style={{
              backgroundColor: activeTheme.surface,
              borderColor: activeTheme.border,
              color: activeTheme.text,
            }}
          >
            <Download className="w-3.5 h-3.5" />
            Exportar
          </button>

          <button
            type="button"
            onClick={() => onDelete(work)}
            className="inline-flex items-center gap-1 px-1.5 py-1 hover:opacity-100 opacity-70 transition-opacity"
            style={{ color: activeTheme.accent }}
            title="Remover obra da biblioteca"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Estatísticas estilo AO3 alinhadas à direita */}
        <dl className="flex flex-wrap items-center gap-x-3 gap-y-1 ml-auto text-[12px]">
          <div className="inline-flex gap-1">
            <dt>Idioma:</dt>
            <dd style={{ color: activeTheme.text }}>{work.language}</dd>
          </div>

          <div className="inline-flex gap-1">
            <dt>Palavras:</dt>
            <dd style={{ color: activeTheme.text }}>
              {formatNumberPT(work.wordCount)}
            </dd>
          </div>

          <div className="inline-flex gap-1">
            <dt>Capítulos:</dt>
            <dd style={{ color: activeTheme.text }}>
              <Link
                href={`/reader/${work.id}`}
                className="border-b border-dotted"
                style={{ borderColor: activeTheme.text }}
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
            <dt>Tempo estimado:</dt>
            <dd className="font-medium" style={{ color: activeTheme.accent }}>
              {estimatedTime}
            </dd>
          </div>

          <div className="inline-flex gap-1">
            <dt>Destaques:</dt>
            <dd
              className="border-b border-dotted"
              style={{
                color: activeTheme.text,
                borderColor: activeTheme.muted,
              }}
            >
              {work.stats?.highlightsCount || 0}
            </dd>
          </div>

          <div className="inline-flex gap-1">
            <button
              type="button"
              onClick={() => onToggleKudos(work)}
              className="inline-flex items-center gap-1 border-b border-dotted"
              style={{
                borderColor: activeTheme.muted,
                color: work.stats?.kudosGiven
                  ? activeTheme.accent
                  : activeTheme.text,
                fontWeight: work.stats?.kudosGiven ? 600 : 400,
              }}
            >
              <Heart
                className="w-3 h-3"
                style={{
                  fill: work.stats?.kudosGiven
                    ? activeTheme.accent
                    : "transparent",
                  color: work.stats?.kudosGiven
                    ? activeTheme.accent
                    : "currentColor",
                }}
              />
              <span>Favorito:</span>
              <span>{work.stats?.kudosGiven ? "Sim" : "Não"}</span>
            </button>
          </div>

          <div className="inline-flex gap-1">
            <dt>Leituras:</dt>
            <dd style={{ color: activeTheme.text }}>
              {work.stats?.rereadCount || 0}
            </dd>
          </div>
        </dl>
      </div>
    </article>
  );
}
