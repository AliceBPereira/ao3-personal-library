"use client";

import React from "react";
import { useLibraryStore } from "@/store/useLibraryStore";
import { READER_THEMES, useReaderStore } from "@/store/useReaderStore";
import {
  computeFacetCounts,
  SortFieldAO3,
} from "@/core/services/tagFilterEngine";
import {
  CategoryAO3,
  CompletionStatusAO3,
  RatingAO3,
  WarningStatusAO3,
  WorkItem,
} from "@/types/work";
import { ChevronDown, ChevronRight, RotateCcw } from "lucide-react";

interface FilterSidebarProps {
  allWorks: WorkItem[];
  filteredWorks: WorkItem[];
}

const RATING_LABELS: Array<{ id: RatingAO3; label: string }> = [
  { id: "general", label: "Público Geral (G)" },
  { id: "teen", label: "Adolescentes e Acima (T)" },
  { id: "mature", label: "Maduro (M)" },
  { id: "explicit", label: "Explícito (E)" },
  { id: "not_rated", label: "Sem Classificação" },
];

const WARNING_LABELS: Array<{ id: WarningStatusAO3; label: string }> = [
  { id: "none", label: "Não se aplicam avisos de arquivo" },
  { id: "chose_not", label: "O criador optou por não usar avisos" },
  { id: "has_warnings", label: "Possui avisos de arquivo (!)" },
];

const CATEGORY_LABELS: Array<{ id: CategoryAO3; label: string }> = [
  { id: "mm", label: "M/M" },
  { id: "ff", label: "F/F" },
  { id: "fm", label: "F/M" },
  { id: "gen", label: "Gen" },
  { id: "multi", label: "Multi" },
  { id: "other", label: "Outros" },
];

const COMPLETION_LABELS: Array<{ id: CompletionStatusAO3; label: string }> = [
  { id: "complete", label: "Apenas obras completas" },
  { id: "wip", label: "Apenas obras em andamento (WIP)" },
];

export function FilterSidebar({ allWorks }: FilterSidebarProps) {
  const store = useLibraryStore();
  const { theme } = useReaderStore();
  const activeTheme = READER_THEMES[theme] || READER_THEMES.cream;

  const facets = React.useMemo(() => computeFacetCounts(allWorks), [allWorks]);

  const [openSections, setOpenSections] = React.useState<
    Record<string, boolean>
  >({
    inc_ratings: false,
    inc_warnings: false,
    inc_categories: false,
    inc_fandoms: true,
    inc_characters: false,
    inc_relationships: true,
    inc_freeforms: true,
    exc_ratings: false,
    exc_warnings: false,
    exc_categories: false,
    exc_fandoms: false,
    exc_characters: false,
    exc_relationships: false,
    exc_freeforms: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderAccordionHeader = (key: string, label: string) => {
    const isOpen = !!openSections[key];
    return (
      <button
        type="button"
        onClick={() => toggleSection(key)}
        className="w-full flex items-center gap-1.5 py-1.5 px-2 text-left text-[12.5px] border-b transition-opacity hover:opacity-85"
        style={{
          backgroundColor: activeTheme.surface,
          color: activeTheme.text,
          borderColor: activeTheme.border,
        }}
      >
        {isOpen ? (
          <ChevronDown className="w-3.5 h-3.5 shrink-0" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        )}
        <span>{label}</span>
      </button>
    );
  };

  return (
    <aside
      className="w-full lg:w-[270px] shrink-0 border p-3 font-ao3Sans text-[12.5px] self-start transition-colors"
      style={{
        backgroundColor: activeTheme.surface,
        borderColor: activeTheme.border,
        color: activeTheme.text,
      }}
    >
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="w-full py-1 px-3 mb-3 border rounded-sm font-medium text-[12.5px] shadow-sm transition-opacity hover:opacity-90"
        style={{
          backgroundColor: activeTheme.bg,
          borderColor: activeTheme.border,
          color: activeTheme.text,
        }}
      >
        Classificar e Filtrar
      </button>

      {/* Classificar por */}
      <div className="mb-4">
        <label className="block text-[12px] mb-1 font-medium">
          Classificar por
        </label>
        <select
          value={store.sortBy}
          onChange={(e) => store.setSortBy(e.target.value as SortFieldAO3)}
          className="w-full border px-2 py-1 text-[12px] rounded-sm focus:outline-none"
          style={{
            backgroundColor: activeTheme.bg,
            borderColor: activeTheme.border,
            color: activeTheme.text,
          }}
        >
          <option value="updatedAt">Data da atualização</option>
          <option value="wordCount">Contagem de palavras</option>
          <option value="rereadCount">Leituras / Visualizações</option>
          <option value="title">Título (A-Z)</option>
          <option value="author">Autor(a) (A-Z)</option>
        </select>
      </div>

      {/* ================= INCLUIR ================= */}
      <div className="mb-4">
        <div
          className="flex items-center justify-between border-b pb-1 mb-1.5"
          style={{ borderColor: activeTheme.border }}
        >
          <h4 className="text-[14px] font-serif">
            Incluir{" "}
            <span
              className="inline-flex items-center justify-center w-4 h-4 text-[10px] rounded-full border cursor-help"
              style={{
                backgroundColor: activeTheme.bg,
                borderColor: activeTheme.border,
              }}
              title="Selecione tags ou classificações que as obras DEVEM conter."
            >
              ?
            </span>
          </h4>
        </div>

        <div
          className="border divide-y"
          style={{
            backgroundColor: activeTheme.bg,
            borderColor: activeTheme.border,
          }}
        >
          <div>
            {renderAccordionHeader("inc_ratings", "avaliações")}
            {openSections.inc_ratings && (
              <div className="p-2 space-y-1">
                {RATING_LABELS.map((r) => (
                  <label
                    key={r.id}
                    className="flex items-center gap-2 text-[12px] cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={store.includeRatings.includes(r.id)}
                      onChange={() => store.toggleIncludeRating(r.id)}
                      className="accent-[#990000]"
                    />
                    <span>{r.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div>
            {renderAccordionHeader("inc_warnings", "avisos")}
            {openSections.inc_warnings && (
              <div className="p-2 space-y-1">
                {WARNING_LABELS.map((w) => (
                  <label
                    key={w.id}
                    className="flex items-center gap-2 text-[12px] cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={store.includeWarnings.includes(w.id)}
                      onChange={() => store.toggleIncludeWarning(w.id)}
                      className="accent-[#990000]"
                    />
                    <span>{w.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div>
            {renderAccordionHeader("inc_categories", "categorias")}
            {openSections.inc_categories && (
              <div className="p-2 space-y-1">
                {CATEGORY_LABELS.map((c) => (
                  <label
                    key={c.id}
                    className="flex items-center gap-2 text-[12px] cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={store.includeCategories.includes(c.id)}
                      onChange={() => store.toggleIncludeCategory(c.id)}
                      className="accent-[#990000]"
                    />
                    <span>{c.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div>
            {renderAccordionHeader("inc_fandoms", "fandoms")}
            {openSections.inc_fandoms && (
              <div className="p-2 space-y-1 max-h-40 overflow-y-auto">
                {facets.fandoms.map((f) => (
                  <label
                    key={f.name}
                    className="flex items-start gap-2 text-[11.5px] cursor-pointer leading-tight"
                  >
                    <input
                      type="checkbox"
                      checked={store.includeTags.includes(f.name)}
                      onChange={() => store.toggleIncludeTag(f.name)}
                      className="mt-0.5 accent-[#990000]"
                    />
                    <span>
                      {f.name}{" "}
                      <span style={{ color: activeTheme.muted }}>
                        ({f.count})
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div>
            {renderAccordionHeader("inc_characters", "personagens")}
            {openSections.inc_characters && (
              <div className="p-2 space-y-1 max-h-44 overflow-y-auto">
                {facets.characters.map((c) => (
                  <label
                    key={c.name}
                    className="flex items-start gap-2 text-[11.5px] cursor-pointer leading-tight"
                  >
                    <input
                      type="checkbox"
                      checked={store.includeTags.includes(c.name)}
                      onChange={() => store.toggleIncludeTag(c.name)}
                      className="mt-0.5 accent-[#990000]"
                    />
                    <span>
                      {c.name}{" "}
                      <span style={{ color: activeTheme.muted }}>
                        ({c.count})
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div>
            {renderAccordionHeader("inc_relationships", "relacionamentos")}
            {openSections.inc_relationships && (
              <div className="p-2 space-y-1 max-h-44 overflow-y-auto">
                {facets.relationships.map((rel) => (
                  <label
                    key={rel.name}
                    className="flex items-start gap-2 text-[11.5px] cursor-pointer leading-tight"
                  >
                    <input
                      type="checkbox"
                      checked={store.includeTags.includes(rel.name)}
                      onChange={() => store.toggleIncludeTag(rel.name)}
                      className="mt-0.5 accent-[#990000]"
                    />
                    <span>
                      {rel.name}{" "}
                      <span style={{ color: activeTheme.muted }}>
                        ({rel.count})
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div>
            {renderAccordionHeader("inc_freeforms", "tags adicionais")}
            {openSections.inc_freeforms && (
              <div className="p-2 space-y-1 max-h-48 overflow-y-auto">
                {facets.freeforms.map((tag) => (
                  <label
                    key={tag.name}
                    className="flex items-start gap-2 text-[11.5px] cursor-pointer leading-tight"
                  >
                    <input
                      type="checkbox"
                      checked={store.includeTags.includes(tag.name)}
                      onChange={() => store.toggleIncludeTag(tag.name)}
                      className="mt-0.5 accent-[#990000]"
                    />
                    <span>
                      {tag.name}{" "}
                      <span style={{ color: activeTheme.muted }}>
                        ({tag.count})
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-2">
          <label
            className="block text-[11.5px] mb-1"
            style={{ color: activeTheme.muted }}
          >
            Outras etiquetas a incluir (separadas por vírgula)
          </label>
          <input
            type="text"
            value={store.customIncludeInput}
            onChange={(e) => store.setCustomIncludeInput(e.target.value)}
            placeholder="Ex: Fluff, Humor, Russo"
            className="w-full border px-2 py-1 text-[12px] focus:outline-none"
            style={{
              backgroundColor: activeTheme.bg,
              borderColor: activeTheme.border,
              color: activeTheme.text,
            }}
          />
        </div>
      </div>

      {/* ================= EXCLUIR ================= */}
      <div className="mb-4">
        <div
          className="flex items-center justify-between border-b pb-1 mb-1.5"
          style={{ borderColor: activeTheme.border }}
        >
          <h4 className="text-[14px] font-serif">
            Excluir{" "}
            <span
              className="inline-flex items-center justify-center w-4 h-4 text-[10px] rounded-full border cursor-help"
              style={{
                backgroundColor: activeTheme.bg,
                borderColor: activeTheme.border,
              }}
              title="Selecione tags ou classificações que você NÃO quer ver nos resultados."
            >
              ?
            </span>
          </h4>
        </div>

        <div
          className="border divide-y"
          style={{
            backgroundColor: activeTheme.bg,
            borderColor: activeTheme.border,
          }}
        >
          <div>
            {renderAccordionHeader("exc_ratings", "classificações")}
            {openSections.exc_ratings && (
              <div className="p-2 space-y-1">
                {RATING_LABELS.map((r) => (
                  <label
                    key={r.id}
                    className="flex items-center gap-2 text-[12px] cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={store.excludeRatings.includes(r.id)}
                      onChange={() => store.toggleExcludeRating(r.id)}
                      className="accent-[#990000]"
                    />
                    <span>{r.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div>
            {renderAccordionHeader("exc_warnings", "avisos")}
            {openSections.exc_warnings && (
              <div className="p-2 space-y-1">
                {WARNING_LABELS.map((w) => (
                  <label
                    key={w.id}
                    className="flex items-center gap-2 text-[12px] cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={store.excludeWarnings.includes(w.id)}
                      onChange={() => store.toggleExcludeWarning(w.id)}
                      className="accent-[#990000]"
                    />
                    <span>{w.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div>
            {renderAccordionHeader("exc_categories", "categorias")}
            {openSections.exc_categories && (
              <div className="p-2 space-y-1">
                {CATEGORY_LABELS.map((c) => (
                  <label
                    key={c.id}
                    className="flex items-center gap-2 text-[12px] cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={store.excludeCategories.includes(c.id)}
                      onChange={() => store.toggleExcludeCategory(c.id)}
                      className="accent-[#990000]"
                    />
                    <span>{c.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div>
            {renderAccordionHeader("exc_fandoms", "fandoms")}
            {openSections.exc_fandoms && (
              <div className="p-2 space-y-1 max-h-40 overflow-y-auto">
                {facets.fandoms.map((f) => (
                  <label
                    key={f.name}
                    className="flex items-start gap-2 text-[11.5px] cursor-pointer leading-tight"
                  >
                    <input
                      type="checkbox"
                      checked={store.excludeTags.includes(f.name)}
                      onChange={() => store.toggleExcludeTag(f.name)}
                      className="mt-0.5 accent-[#990000]"
                    />
                    <span>
                      {f.name}{" "}
                      <span style={{ color: activeTheme.muted }}>
                        ({f.count})
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div>
            {renderAccordionHeader("exc_characters", "personagens")}
            {openSections.exc_characters && (
              <div className="p-2 space-y-1 max-h-44 overflow-y-auto">
                {facets.characters.map((c) => (
                  <label
                    key={c.name}
                    className="flex items-start gap-2 text-[11.5px] cursor-pointer leading-tight"
                  >
                    <input
                      type="checkbox"
                      checked={store.excludeTags.includes(c.name)}
                      onChange={() => store.toggleExcludeTag(c.name)}
                      className="mt-0.5 accent-[#990000]"
                    />
                    <span>
                      {c.name}{" "}
                      <span style={{ color: activeTheme.muted }}>
                        ({c.count})
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div>
            {renderAccordionHeader("exc_relationships", "relacionamentos")}
            {openSections.exc_relationships && (
              <div className="p-2 space-y-1 max-h-44 overflow-y-auto">
                {facets.relationships.map((rel) => (
                  <label
                    key={rel.name}
                    className="flex items-start gap-2 text-[11.5px] cursor-pointer leading-tight"
                  >
                    <input
                      type="checkbox"
                      checked={store.excludeTags.includes(rel.name)}
                      onChange={() => store.toggleExcludeTag(rel.name)}
                      className="mt-0.5 accent-[#990000]"
                    />
                    <span>
                      {rel.name}{" "}
                      <span style={{ color: activeTheme.muted }}>
                        ({rel.count})
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div>
            {renderAccordionHeader("exc_freeforms", "tags adicionais")}
            {openSections.exc_freeforms && (
              <div className="p-2 space-y-1 max-h-48 overflow-y-auto">
                {facets.freeforms.map((tag) => (
                  <label
                    key={tag.name}
                    className="flex items-start gap-2 text-[11.5px] cursor-pointer leading-tight"
                  >
                    <input
                      type="checkbox"
                      checked={store.excludeTags.includes(tag.name)}
                      onChange={() => store.toggleExcludeTag(tag.name)}
                      className="mt-0.5 accent-[#990000]"
                    />
                    <span>
                      {tag.name}{" "}
                      <span style={{ color: activeTheme.muted }}>
                        ({tag.count})
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-2">
          <label
            className="block text-[11.5px] mb-1"
            style={{ color: activeTheme.muted }}
          >
            Outras tags a serem excluídas (separadas por vírgula)
          </label>
          <input
            type="text"
            value={store.customExcludeInput}
            onChange={(e) => store.setCustomExcludeInput(e.target.value)}
            placeholder="Ex: Morte de personagem, Angst"
            className="w-full border px-2 py-1 text-[12px] focus:outline-none"
            style={{
              backgroundColor: activeTheme.bg,
              borderColor: activeTheme.border,
              color: activeTheme.text,
            }}
          />
        </div>
      </div>

      {/* ================= MAIS OPÇÕES ================= */}
      <div
        className="mb-4 pt-2 border-t"
        style={{ borderColor: activeTheme.border }}
      >
        <h5 className="text-[12.5px] font-semibold mb-1.5">
          Status de Conclusão
        </h5>
        <div className="space-y-1">
          {COMPLETION_LABELS.map((item) => (
            <label
              key={item.id}
              className="flex items-center gap-2 text-[12px] cursor-pointer"
            >
              <input
                type="checkbox"
                checked={store.includeCompletion.includes(item.id)}
                onChange={() => store.toggleIncludeCompletion(item.id)}
                className="accent-[#990000]"
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>

        <div className="mt-3">
          <label
            className="block text-[11.5px] mb-1"
            style={{ color: activeTheme.muted }}
          >
            Contagem de palavras (De / Até)
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            <input
              type="number"
              placeholder="Mín"
              value={store.minWords ?? ""}
              onChange={(e) =>
                store.setWordRange(
                  e.target.value ? Number(e.target.value) : null,
                  store.maxWords
                )
              }
              className="border px-2 py-1 text-[12px]"
              style={{
                backgroundColor: activeTheme.bg,
                borderColor: activeTheme.border,
                color: activeTheme.text,
              }}
            />
            <input
              type="number"
              placeholder="Máx"
              value={store.maxWords ?? ""}
              onChange={(e) =>
                store.setWordRange(
                  store.minWords,
                  e.target.value ? Number(e.target.value) : null
                )
              }
              className="border px-2 py-1 text-[12px]"
              style={{
                backgroundColor: activeTheme.bg,
                borderColor: activeTheme.border,
                color: activeTheme.text,
              }}
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => store.resetAllFilters()}
        className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 border rounded-sm text-[12px] font-medium transition-opacity hover:opacity-85"
        style={{
          backgroundColor: activeTheme.bg,
          borderColor: activeTheme.border,
          color: activeTheme.text,
        }}
      >
        <RotateCcw className="w-3.5 h-3.5" />
        Limpar Todos os Filtros
      </button>
    </aside>
  );
}
