"use client";

import React, { useState } from "react";
import {
  BookFileFormat,
  CategoryAO3,
  CollectionShelf,
  CompletionStatusAO3,
  RatingAO3,
  WarningStatusAO3,
  WorkChapter,
  WorkItem,
} from "@/types/work";
import { parseUploadedBook } from "@/core/parsers";
import { db } from "@/core/db/database";
import { FileUp, Loader2, Plus, Save, Sparkles, X } from "lucide-react";

interface ImportAndEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingWork: WorkItem | null;
  collections: CollectionShelf[];
}

export function ImportAndEditModal({
  isOpen,
  onClose,
  editingWork,
  collections,
}: ImportAndEditModalProps) {
  const [isParsing, setIsParsing] = useState(false);
  const [parseMessage, setParseMessage] = useState<string | null>(null);

  const [title, setTitle] = useState(editingWork?.title || "");
  const [author, setAuthor] = useState(editingWork?.author || "");
  const [fandomsInput, setFandomsInput] = useState(
    editingWork?.fandoms.join(", ") || "Tudo Pelo Jogo - Nora Sakavic"
  );
  const [rating, setRating] = useState<RatingAO3>(
    editingWork?.rating || "teen"
  );
  const [category, setCategory] = useState<CategoryAO3>(
    editingWork?.category || "mm"
  );
  const [warningStatus, setWarningStatus] = useState<WarningStatusAO3>(
    editingWork?.warningStatus || "none"
  );
  const [completionStatus, setCompletionStatus] = useState<CompletionStatusAO3>(
    editingWork?.completionStatus || "complete"
  );
  const [warningsInput, setWarningsInput] = useState(
    editingWork?.tags.warnings.join(", ") ||
      "Não se aplicam avisos de arquivo."
  );
  const [relationshipsInput, setRelationshipsInput] = useState(
    editingWork?.tags.relationships.join(", ") || ""
  );
  const [charactersInput, setCharactersInput] = useState(
    editingWork?.tags.characters.join(", ") || ""
  );
  const [freeformsInput, setFreeformsInput] = useState(
    editingWork?.tags.freeforms.join(", ") || ""
  );
  const [summary, setSummary] = useState(editingWork?.summary || "");
  const [language, setLanguage] = useState(
    editingWork?.language || "Português"
  );
  const [wordCount, setWordCount] = useState<number>(
    editingWork?.wordCount || 1500
  );
  const [chaptersCurrent, setChaptersCurrent] = useState<number>(
    editingWork?.chaptersCurrent || 1
  );
  const [chaptersTotalInput, setChaptersTotalInput] = useState<string>(
    editingWork
      ? editingWork.chaptersTotal === null
        ? "?"
        : String(editingWork.chaptersTotal)
      : "1"
  );
  const [format, setFormat] = useState<BookFileFormat>(
    editingWork?.format || "epub"
  );
  const [selectedCollections, setSelectedCollections] = useState<string[]>(
    editingWork?.collectionIds || []
  );
  const [chapters, setChapters] = useState<WorkChapter[]>(
    editingWork?.chapters || []
  );
  const [rawBlob, setRawBlob] = useState<Blob | undefined>(
    editingWork?.rawFileBlob as Blob | undefined
  );
  const [fileName, setFileName] = useState<string | undefined>(
    editingWork?.fileName
  );
  const [manualTextContent, setManualTextContent] = useState<string>("");

  React.useEffect(() => {
    if (editingWork) {
      setTitle(editingWork.title);
      setAuthor(editingWork.author);
      setFandomsInput(editingWork.fandoms.join(", "));
      setRating(editingWork.rating);
      setCategory(editingWork.category);
      setWarningStatus(editingWork.warningStatus);
      setCompletionStatus(editingWork.completionStatus);
      setWarningsInput(editingWork.tags.warnings.join(", "));
      setRelationshipsInput(editingWork.tags.relationships.join(", "));
      setCharactersInput(editingWork.tags.characters.join(", "));
      setFreeformsInput(editingWork.tags.freeforms.join(", "));
      setSummary(editingWork.summary);
      setLanguage(editingWork.language);
      setWordCount(editingWork.wordCount);
      setChaptersCurrent(editingWork.chaptersCurrent);
      setChaptersTotalInput(
        editingWork.chaptersTotal === null
          ? "?"
          : String(editingWork.chaptersTotal)
      );
      setFormat(editingWork.format);
      setSelectedCollections(editingWork.collectionIds);
      setChapters(editingWork.chapters);
      setFileName(editingWork.fileName);
      setParseMessage(null);
    } else {
      setTitle("");
      setAuthor("");
      setFandomsInput("Tudo Pelo Jogo - Nora Sakavic");
      setRating("teen");
      setCategory("mm");
      setWarningStatus("none");
      setCompletionStatus("complete");
      setWarningsInput("Não se aplicam avisos de arquivo.");
      setRelationshipsInput("");
      setCharactersInput("");
      setFreeformsInput("");
      setSummary("");
      setLanguage("Português");
      setWordCount(0);
      setChaptersCurrent(1);
      setChaptersTotalInput("1");
      setFormat("epub");
      setSelectedCollections([]);
      setChapters([]);
      setRawBlob(undefined);
      setFileName(undefined);
      setManualTextContent("");
      setParseMessage(null);
    }
  }, [editingWork, isOpen]);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsParsing(true);
    setParseMessage(`Extraindo capítulos, palavras e metadados de "${file.name}"...`);

    try {
      const { format: detectedFormat, parsed } = await parseUploadedBook(file);
      setFormat(detectedFormat);
      setTitle(parsed.title);
      setAuthor(parsed.author);
      setFandomsInput(parsed.fandoms.join(", "));
      setRating(parsed.rating);
      setCategory(parsed.category);
      setWarningStatus(parsed.warningStatus);
      setCompletionStatus(parsed.completionStatus);
      setWarningsInput(parsed.tags.warnings.join(", "));
      setRelationshipsInput(parsed.tags.relationships.join(", "));
      setCharactersInput(parsed.tags.characters.join(", "));
      setFreeformsInput(parsed.tags.freeforms.join(", "));
      setSummary(parsed.summary);
      setLanguage(parsed.language);
      setWordCount(parsed.wordCount);
      setChaptersCurrent(parsed.chaptersCurrent);
      setChaptersTotalInput(
        parsed.chaptersTotal === null ? "?" : String(parsed.chaptersTotal)
      );
      setChapters(parsed.chapters);
      setRawBlob(file);
      setFileName(file.name);
      setParseMessage(
        `✓ Arquivo ${detectedFormat.toUpperCase()} processado com sucesso! (${parsed.chapters.length} capítulo(s), ${parsed.wordCount} palavras extraídas). Revise ou adicione tags abaixo.`
      );
    } catch (err) {
      console.error(err);
      setParseMessage(
        "Erro ao extrair automaticamente. Você pode preencher os campos manualmente abaixo."
      );
    } finally {
      setIsParsing(false);
    }
  };

  const splitCsv = (val: string) =>
    val
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  const toggleShelf = (shelfId: string) => {
    setSelectedCollections((prev) =>
      prev.includes(shelfId)
        ? prev.filter((id) => id !== shelfId)
        : [...prev, shelfId]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalChapters: WorkChapter[] =
      chapters.length > 0
        ? chapters
        : [
            {
              id: `ch-${Date.now()}`,
              index: 0,
              title: "Capítulo 1",
              htmlContent: manualTextContent
                ? manualTextContent
                    .split("\n\n")
                    .map((p) => `<p>${p}</p>`)
                    .join("")
                : `<p>${summary || "Conteúdo da obra."}</p>`,
              plainText: manualTextContent || summary || "Conteúdo da obra.",
              wordCount: wordCount || 500,
            },
          ];

    const parsedTotal =
      chaptersTotalInput.trim() === "?" || chaptersTotalInput.trim() === ""
        ? null
        : Number(chaptersTotalInput) || finalChapters.length;

    const workToSave: WorkItem = {
      id: editingWork?.id || `work-${Date.now()}`,
      title: title.trim() || "Obra Sem Título",
      author: author.trim() || "Anônimo",
      fandoms:
        splitCsv(fandomsInput).length > 0
          ? splitCsv(fandomsInput)
          : ["Fandom Original"],
      rating,
      category,
      warningStatus,
      completionStatus,
      tags: {
        warnings:
          splitCsv(warningsInput).length > 0
            ? splitCsv(warningsInput)
            : ["Não se aplicam avisos de arquivo."],
        relationships: splitCsv(relationshipsInput),
        characters: splitCsv(charactersInput),
        freeforms: splitCsv(freeformsInput),
      },
      summary: summary.trim() || "Sem sinopse cadastrada.",
      language: language.trim() || "Português",
      wordCount: Number(wordCount) || 500,
      chaptersCurrent: Number(chaptersCurrent) || finalChapters.length,
      chaptersTotal: parsedTotal,
      updatedAt: new Date().toISOString(),
      createdAt: editingWork?.createdAt || new Date().toISOString(),
      format,
      collectionIds: selectedCollections,
      readingProgress: editingWork?.readingProgress || {
        currentChapterIndex: 0,
        scrollPercentage: 0,
        wordsRead: 0,
      },
      stats: editingWork?.stats || {
        rereadCount: 0,
        kudosGiven: false,
        bookmarksCount: 0,
        highlightsCount: 0,
      },
      chapters: finalChapters,
      rawFileBlob: rawBlob || editingWork?.rawFileBlob,
      fileName: fileName || editingWork?.fileName,
    };

    await db.works.put(workToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 overflow-y-auto font-ao3Sans">
      <div className="bg-white border-2 border-[#990000] w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-sm shadow-2xl">
        {/* Header */}
        <div className="bg-[#990000] text-white px-4 py-3 flex items-center justify-between sticky top-0 z-10">
          <h3 className="font-serif text-[17px] font-bold">
            {editingWork
              ? `Editar Metadados e Tags: ${editingWork.title}`
              : "Importar Livro / Fanfic (EPUB, PDF, MOBI, HTML)"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-[#700000] rounded-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-4 sm:p-5 space-y-4 text-[13px]">
          {/* Dropzone de Importação */}
          <div className="border-2 border-dashed border-[#990000]/50 bg-[#fdf8f8] p-4 rounded-sm text-center">
            <label className="cursor-pointer flex flex-col items-center justify-center gap-1.5">
              {isParsing ? (
                <Loader2 className="w-7 h-7 text-[#990000] animate-spin" />
              ) : (
                <FileUp className="w-7 h-7 text-[#990000]" />
              )}
              <span className="font-semibold text-[#990000] text-[14px]">
                Clique para selecionar um arquivo EPUB, PDF, MOBI ou HTML
              </span>
              <span className="text-[11.5px] text-[#555]">
                Extração automática de título, autor, capítulos, contagem de palavras e tags (HTML do AO3 preenche todas as tags automaticamente!)
              </span>
              <input
                type="file"
                accept=".epub,.pdf,.mobi,.azw,.azw3,.html,.htm"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            {parseMessage && (
              <div className="mt-2.5 px-3 py-1.5 bg-[#f0f9eb] border border-[#b7eb8f] text-[#237804] text-[12px] rounded-sm">
                {parseMessage}
              </div>
            )}
          </div>

          {/* Linha 1: Título, Autor, Idioma */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="block font-semibold text-[#222] mb-1">
                Título da Obra *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Neil Abram Josten"
                className="w-full border border-[#aaaaaa] px-2.5 py-1.5 rounded-sm"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#222] mb-1">
                Autor(a) *
              </label>
              <input
                type="text"
                required
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Ex: Youriko"
                className="w-full border border-[#aaaaaa] px-2.5 py-1.5 rounded-sm"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#222] mb-1">
                Idioma
              </label>
              <input
                type="text"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                placeholder="Português / Inglês"
                className="w-full border border-[#aaaaaa] px-2.5 py-1.5 rounded-sm"
              />
            </div>
          </div>

          {/* Linha 2: Grade 2x2 de Ícones AO3 */}
          <div className="bg-[#f5f5f5] border border-[#dddddd] p-3 rounded-sm">
            <h4 className="font-semibold text-[#990000] mb-2 flex items-center gap-1.5 text-[12.5px]">
              <Sparkles className="w-3.5 h-3.5" />
              Ícones de Classificação e Status (Grade 2x2 do Canto Superior Esquerdo)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-[11.5px] font-medium mb-1">
                  Classificação Etária
                </label>
                <select
                  value={rating}
                  onChange={(e) => setRating(e.target.value as RatingAO3)}
                  className="w-full bg-white border border-[#aaaaaa] px-2 py-1 text-[12px]"
                >
                  <option value="general">G - Público Geral (Verde)</option>
                  <option value="teen">T - Adolescentes (Amarelo)</option>
                  <option value="mature">M - Maduro (Laranja)</option>
                  <option value="explicit">E - Explícito (Vermelho)</option>
                  <option value="not_rated">Sem Classificação</option>
                </select>
              </div>

              <div>
                <label className="block text-[11.5px] font-medium mb-1">
                  Categoria (Ship)
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as CategoryAO3)}
                  className="w-full bg-white border border-[#aaaaaa] px-2 py-1 text-[12px]"
                >
                  <option value="mm">M/M (Azul)</option>
                  <option value="ff">F/F (Rosa)</option>
                  <option value="fm">F/M (Roxo)</option>
                  <option value="gen">Gen (Verde)</option>
                  <option value="multi">Multi (Colorido)</option>
                  <option value="other">Outros (Preto)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11.5px] font-medium mb-1">
                  Ícone de Avisos
                </label>
                <select
                  value={warningStatus}
                  onChange={(e) =>
                    setWarningStatus(e.target.value as WarningStatusAO3)
                  }
                  className="w-full bg-white border border-[#aaaaaa] px-2 py-1 text-[12px]"
                >
                  <option value="none">Não se aplicam avisos</option>
                  <option value="chose_not">Optou por não usar avisos (?!)</option>
                  <option value="has_warnings">Possui avisos (!)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11.5px] font-medium mb-1">
                  Status da Obra
                </label>
                <select
                  value={completionStatus}
                  onChange={(e) =>
                    setCompletionStatus(e.target.value as CompletionStatusAO3)
                  }
                  className="w-full bg-white border border-[#aaaaaa] px-2 py-1 text-[12px]"
                >
                  <option value="complete">Completa (✓)</option>
                  <option value="wip">Em andamento (⊘)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Linha 3: Sistema de Tags em Destaque */}
          <div className="space-y-2.5 bg-[#fafafa] border border-[#dddddd] p-3 rounded-sm">
            <h4 className="font-semibold text-[#222] text-[13px]">
              Sistema de Tags Estilo AO3 (separe múltiplas tags por vírgula)
            </h4>

            <div>
              <label className="block text-[12px] font-medium text-[#333] mb-0.5">
                Fandoms / Série
              </label>
              <input
                type="text"
                value={fandomsInput}
                onChange={(e) => setFandomsInput(e.target.value)}
                placeholder="Ex: Tudo Pelo Jogo - Nora Sakavic, Batman - Todos os tipos de mídia"
                className="w-full border border-[#aaaaaa] px-2.5 py-1 rounded-sm"
              />
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#222] mb-0.5">
                Avisos de Arquivo (Aparecem em Negrito no card)
              </label>
              <input
                type="text"
                value={warningsInput}
                onChange={(e) => setWarningsInput(e.target.value)}
                placeholder="Ex: O criador optou por não usar avisos de arquivo."
                className="w-full border border-[#aaaaaa] px-2.5 py-1 rounded-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#222] mb-0.5">
                Relacionamentos / Ships (Aparecem com fundo destacado sutil)
              </label>
              <input
                type="text"
                value={relationshipsInput}
                onChange={(e) => setRelationshipsInput(e.target.value)}
                placeholder="Ex: Neil Josten/Andrew Minyard, Kevin Day/Aaron Minyard"
                className="w-full border border-[#aaaaaa] bg-[#f2f2f2] px-2.5 py-1 rounded-sm"
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#333] mb-0.5">
                Personagens
              </label>
              <input
                type="text"
                value={charactersInput}
                onChange={(e) => setCharactersInput(e.target.value)}
                placeholder="Ex: Neil Josten, Andrew Minyard, Kevin Day, Matt Boyd, Nicky Hemmick"
                className="w-full border border-[#aaaaaa] px-2.5 py-1 rounded-sm"
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#333] mb-0.5">
                Tags Adicionais (Freeform Tags)
              </label>
              <input
                type="text"
                value={freeformsInput}
                onChange={(e) => setFreeformsInput(e.target.value)}
                placeholder="Ex: Fluff, Humor, 5+1 Coisas, Ponto de vista de Andrew, Queima lenta?"
                className="w-full border border-[#aaaaaa] px-2.5 py-1 rounded-sm"
              />
            </div>
          </div>

          {/* Sinopse */}
          <div>
            <label className="block font-semibold text-[#222] mb-1">
              Sinopse (Resumo da Obra)
            </label>
            <textarea
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Resumo que aparecerá logo abaixo das tags no card..."
              className="w-full border border-[#aaaaaa] px-2.5 py-1.5 rounded-sm"
            />
          </div>

          {/* Caso o usuário esteja criando uma obra sem subir arquivo, permitir colar o texto */}
          {!editingWork && chapters.length === 0 && (
            <div>
              <label className="block font-semibold text-[#222] mb-1">
                Texto da Obra / Capítulo (Opcional se você já importou um arquivo acima)
              </label>
              <textarea
                rows={4}
                value={manualTextContent}
                onChange={(e) => {
                  setManualTextContent(e.target.value);
                  const w = e.target.value
                    .trim()
                    .split(/\s+/)
                    .filter(Boolean).length;
                  if (w > 0) setWordCount(w);
                }}
                placeholder="Cole aqui o texto da fanfic caso não queira subir um arquivo agora..."
                className="w-full border border-[#aaaaaa] px-2.5 py-1.5 rounded-sm"
              />
            </div>
          )}

          {/* Metadados Numéricos: Palavras, Capítulos e Formato */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11.5px] font-medium mb-1">
                Contagem de Palavras
              </label>
              <input
                type="number"
                value={wordCount}
                onChange={(e) => setWordCount(Number(e.target.value))}
                className="w-full border border-[#aaaaaa] px-2 py-1"
              />
            </div>

            <div>
              <label className="block text-[11.5px] font-medium mb-1">
                Capítulos Atuais
              </label>
              <input
                type="number"
                min={1}
                value={chaptersCurrent}
                onChange={(e) => setChaptersCurrent(Number(e.target.value))}
                className="w-full border border-[#aaaaaa] px-2 py-1"
              />
            </div>

            <div>
              <label className="block text-[11.5px] font-medium mb-1">
                Total de Capítulos (ou ?)
              </label>
              <input
                type="text"
                value={chaptersTotalInput}
                onChange={(e) => setChaptersTotalInput(e.target.value)}
                placeholder="Ex: 1, 10 ou ?"
                className="w-full border border-[#aaaaaa] px-2 py-1"
              />
            </div>

            <div>
              <label className="block text-[11.5px] font-medium mb-1">
                Formato
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as BookFileFormat)}
                className="w-full bg-white border border-[#aaaaaa] px-2 py-1"
              >
                <option value="epub">EPUB</option>
                <option value="pdf">PDF</option>
                <option value="mobi">MOBI</option>
                <option value="html">HTML</option>
              </select>
            </div>
          </div>

          {/* Prateleiras / Coleções */}
          <div>
            <label className="block font-semibold text-[#222] mb-1.5">
              Adicionar às Prateleiras / Coleções:
            </label>
            <div className="flex flex-wrap gap-2">
              {collections.map((shelf) => {
                const active = selectedCollections.includes(shelf.id);
                return (
                  <button
                    key={shelf.id}
                    type="button"
                    onClick={() => toggleShelf(shelf.id)}
                    className={`px-2.5 py-1 rounded-sm text-[12px] border flex items-center gap-1.5 transition-colors ${
                      active
                        ? "bg-[#990000] text-white border-[#990000]"
                        : "bg-[#f5f5f5] text-[#333] border-[#ccc] hover:border-[#990000]"
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: active ? "#fff" : shelf.color,
                      }}
                    />
                    {shelf.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Botões de rodapé */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#dddddd]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 border border-[#aaaaaa] bg-[#f3f3f3] hover:bg-[#e2e2e2] rounded-sm text-[13px]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#990000] hover:bg-[#700000] text-white font-medium rounded-sm text-[13px]"
            >
              {editingWork ? (
                <>
                  <Save className="w-4 h-4" />
                  Salvar Alterações
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Adicionar à Biblioteca
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
