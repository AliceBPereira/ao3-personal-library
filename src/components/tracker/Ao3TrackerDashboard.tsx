"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db, ensureDatabaseSeeded } from "@/core/db/database";
import {
  addOrSyncTrackedWorkFromAo3Url,
  checkAllTrackedWorksOnAo3Original,
  saveTrackedWorkFromPayload,
} from "@/core/services/ao3OriginalSync";
import { READER_THEMES, useReaderStore } from "@/store/useReaderStore";
import { StatusIconsGrid } from "@/components/ao3/StatusIconsGrid";
import { AO3TrackedWork } from "@/types/work";
import {
  BellRing,
  BookCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  Loader2,
  Minus,
  Plus,
  PlusCircle,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";

type TrackerTab = "unread" | "up_to_date" | "completed" | "all";

export function Ao3TrackerDashboard() {
  const searchParams = useSearchParams();
  const { theme } = useReaderStore();
  const activeTheme = READER_THEMES[theme] || READER_THEMES.cream;

  const [activeTab, setActiveTab] = useState<TrackerTab>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Formulário para adicionar/sincronizar fanfic pelo Link ou ID do AO3 Original
  const [ao3InputUrl, setAo3InputUrl] = useState("");
  const [manualChapterRead, setManualChapterRead] = useState<string>("");
  const [manualNotes, setManualNotes] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: "success" | "info" | "error";
    message: string;
  } | null>(null);

  // Estado de sincronização em lote com o AO3 Original
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncProgressText, setSyncProgressText] = useState<string | null>(null);

  useEffect(() => {
    ensureDatabaseSeeded();
  }, []);

  // Detectar se o usuário clicou no botão da Extensão dentro do AO3 Original (?ao3Payload=... ou ?ao3Url=...)
  useEffect(() => {
    const incomingPayload = searchParams?.get("ao3Payload");
    if (incomingPayload) {
      try {
        const parsed = JSON.parse(incomingPayload);
        setIsAdding(true);
        saveTrackedWorkFromPayload(parsed)
          .then(({ work }) => {
            setFeedbackBanner({
              type: "success",
              message: `✓ Fanfic "${work.title}" (por ${work.author}) adicionada instantaneamente pela Extensão! (Você está no Cap. ${work.chaptersReadByMe} de ${work.chaptersPublishedOnAo3}).`,
            });
            // Limpar os parâmetros da URL sem recarregar a página
            window.history.replaceState({}, "", "/tracker");
          })
          .catch((err: Error) => {
            setFeedbackBanner({
              type: "error",
              message: err.message,
            });
          })
          .finally(() => setIsAdding(false));
        return;
      } catch {
        // Segue para ao3Url se não for JSON válido
      }
    }

    const incomingUrl = searchParams?.get("ao3Url");
    const incomingChapter = searchParams?.get("chapter");
    if (incomingUrl) {
      setAo3InputUrl(incomingUrl);
      if (incomingChapter) setManualChapterRead(incomingChapter);
      const chNum = incomingChapter ? parseInt(incomingChapter, 10) : undefined;
      setIsAdding(true);
      addOrSyncTrackedWorkFromAo3Url(incomingUrl, chNum)
        .then(({ work }) => {
          setFeedbackBanner({
            type: "success",
            message: `✓ Fanfic "${work.title}" sincronizada diretamente do AO3 Original! (Você está no Cap. ${work.chaptersReadByMe} de ${work.chaptersPublishedOnAo3}).`,
          });
          setAo3InputUrl("");
          window.history.replaceState({}, "", "/tracker");
        })
        .catch((err: Error) => {
          setFeedbackBanner({
            type: "error",
            message: err.message,
          });
        })
        .finally(() => setIsAdding(false));
    }
  }, [searchParams]);

  const trackedWorks =
    useLiveQuery(() => db.trackedAo3Works.toArray(), []) || [];

  // Métricas globais do painel
  const stats = useMemo(() => {
    let unreadWorksCount = 0;
    let totalUnreadChapters = 0;
    let upToDateWipCount = 0;
    let completedCount = 0;

    for (const w of trackedWorks) {
      const unread = Math.max(
        0,
        w.chaptersPublishedOnAo3 - w.chaptersReadByMe
      );
      if (unread > 0) {
        unreadWorksCount++;
        totalUnreadChapters += unread;
      } else if (w.completionStatus === "complete") {
        completedCount++;
      } else {
        upToDateWipCount++;
      }
    }

    return {
      totalTracked: trackedWorks.length,
      unreadWorksCount,
      totalUnreadChapters,
      upToDateWipCount,
      completedCount,
    };
  }, [trackedWorks]);

  // Filtrar e ordenar automaticamente (Fanfics com capítulos novos não lidos sempre primeiro!)
  const filteredWorks = useMemo(() => {
    return trackedWorks
      .filter((w) => {
        const unread = Math.max(
          0,
          w.chaptersPublishedOnAo3 - w.chaptersReadByMe
        );
        if (activeTab === "unread" && unread === 0) return false;
        if (
          activeTab === "up_to_date" &&
          (unread > 0 || w.completionStatus === "complete")
        )
          return false;
        if (
          activeTab === "completed" &&
          (unread > 0 || w.completionStatus !== "complete")
        )
          return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const inTitle = w.title.toLowerCase().includes(q);
          const inAuthor = w.author.toLowerCase().includes(q);
          const inFandom = w.fandoms.some((f) => f.toLowerCase().includes(q));
          const inNotes = (w.notes || "").toLowerCase().includes(q);
          if (!inTitle && !inAuthor && !inFandom && !inNotes) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const unreadA = Math.max(
          0,
          a.chaptersPublishedOnAo3 - a.chaptersReadByMe
        );
        const unreadB = Math.max(
          0,
          b.chaptersPublishedOnAo3 - b.chaptersReadByMe
        );
        if (unreadA > 0 && unreadB === 0) return -1;
        if (unreadB > 0 && unreadA === 0) return 1;
        return b.ao3UpdatedAt.localeCompare(a.ao3UpdatedAt);
      });
  }, [trackedWorks, activeTab, searchQuery]);

  const handleAddAo3Work = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ao3InputUrl.trim()) return;
    setIsAdding(true);
    setFeedbackBanner(null);

    try {
      const chRead =
        manualChapterRead.trim() !== ""
          ? Math.max(0, parseInt(manualChapterRead, 10) || 0)
          : undefined;

      const { work } = await addOrSyncTrackedWorkFromAo3Url(
        ao3InputUrl,
        chRead,
        manualNotes.trim() || undefined
      );

      const unread = Math.max(
        0,
        work.chaptersPublishedOnAo3 - work.chaptersReadByMe
      );

      setFeedbackBanner({
        type: "success",
        message: `✓ "${work.title}" (por ${work.author}) conectada ao AO3 Original! Capítulos no AO3: ${work.chaptersPublishedOnAo3}/${work.chaptersTotalOnAo3 ?? "?"} • Você leu até o Cap. ${work.chaptersReadByMe} (${unread} capítulo(s) não lido(s)).`,
      });
      setAo3InputUrl("");
      setManualChapterRead("");
      setManualNotes("");
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Erro ao consultar o AO3 Original.";
      setFeedbackBanner({
        type: "error",
        message: msg,
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleSyncAllNow = async () => {
    setIsSyncingAll(true);
    setFeedbackBanner(null);
    try {
      const summary = await checkAllTrackedWorksOnAo3Original(
        (curr, total, title) => {
          setSyncProgressText(
            `Consultando AO3 Original (${curr}/${total}): "${title}"...`
          );
        }
      );

      if (summary.newlyUpdatedWorksCount > 0) {
        setFeedbackBanner({
          type: "success",
          message: `🔔 NOVAS ATUALIZAÇÕES NO AO3 ORIGINAL! ${
            summary.newlyUpdatedWorksCount
          } fanfic(s) ganharam capítulos novos: ${summary.updatedTitles.join(
            ", "
          )}! Você tem ${
            summary.totalUnreadChapters
          } capítulo(s) não lido(s) no total.`,
        });
        setActiveTab("unread");
      } else {
        setFeedbackBanner({
          type: "info",
          message: `✓ Todas as ${summary.totalChecked} fanfics foram verificadas diretamente no AO3 Original! Você tem atualmente ${summary.totalUnreadChapters} capítulo(s) não lido(s) aguardando leitura.`,
        });
      }
    } finally {
      setIsSyncingAll(false);
      setSyncProgressText(null);
    }
  };

  const handleUpdateChaptersRead = async (
    work: AO3TrackedWork,
    newReadCount: number
  ) => {
    const clamped = Math.max(
      0,
      Math.min(work.chaptersPublishedOnAo3, newReadCount)
    );
    await db.trackedAo3Works.update(work.id, {
      chaptersReadByMe: clamped,
      lastReadAt: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-5 font-ao3Sans">
      {/* ================= CARDS DE RESUMO DO SEU ACOMPANHAMENTO NO AO3 ORIGINAL ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div
          onClick={() => setActiveTab("all")}
          className="p-4 rounded-sm border cursor-pointer transition-transform hover:scale-[1.01]"
          style={{
            backgroundColor: activeTheme.surface,
            borderColor: activeTheme.border,
          }}
        >
          <div className="text-[11.5px] uppercase tracking-wider opacity-75 font-bold">
            Total Acompanhando no AO3
          </div>
          <div className="text-[26px] font-serif font-bold mt-1">
            {stats.totalTracked}{" "}
            <span className="text-[13px] font-sans font-normal">fanfics</span>
          </div>
          <div
            className="text-[11.5px] mt-1"
            style={{ color: activeTheme.muted }}
          >
            Monitoradas diretamente no AO3 Original
          </div>
        </div>

        <div
          onClick={() => setActiveTab("unread")}
          className="p-4 rounded-sm border-2 cursor-pointer transition-transform hover:scale-[1.01]"
          style={{
            backgroundColor:
              stats.unreadWorksCount > 0 ? "#fff5f5" : activeTheme.surface,
            borderColor:
              stats.unreadWorksCount > 0
                ? activeTheme.accent
                : activeTheme.border,
            color: stats.unreadWorksCount > 0 ? "#222222" : activeTheme.text,
          }}
        >
          <div className="text-[11.5px] uppercase tracking-wider font-bold text-[#990000] flex items-center gap-1.5">
            <BellRing className="w-4 h-4 animate-bounce" />
            Fics Atualizadas (Não Lidas)
          </div>
          <div className="text-[26px] font-serif font-bold mt-1 text-[#990000]">
            {stats.unreadWorksCount}{" "}
            <span className="text-[13px] font-sans font-normal">
              fics com capítulos novos!
            </span>
          </div>
          <div className="text-[11.5px] mt-1 text-[#661111] font-medium">
            {stats.totalUnreadChapters} capítulo(s) novos esperando por você
          </div>
        </div>

        <div
          onClick={() => setActiveTab("up_to_date")}
          className="p-4 rounded-sm border cursor-pointer transition-transform hover:scale-[1.01]"
          style={{
            backgroundColor: activeTheme.surface,
            borderColor: activeTheme.border,
          }}
        >
          <div className="text-[11.5px] uppercase tracking-wider opacity-75 font-bold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Em Dia (Esperando o Autor)
          </div>
          <div className="text-[26px] font-serif font-bold mt-1">
            {stats.upToDateWipCount}{" "}
            <span className="text-[13px] font-sans font-normal">
              fics em andamento
            </span>
          </div>
          <div
            className="text-[11.5px] mt-1"
            style={{ color: activeTheme.muted }}
          >
            Você já leu até o último capítulo lançado
          </div>
        </div>

        <div
          onClick={() => setActiveTab("completed")}
          className="p-4 rounded-sm border cursor-pointer transition-transform hover:scale-[1.01]"
          style={{
            backgroundColor: activeTheme.surface,
            borderColor: activeTheme.border,
          }}
        >
          <div className="text-[11.5px] uppercase tracking-wider opacity-75 font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-700" />
            Concluídas e Lidas 100%
          </div>
          <div className="text-[26px] font-serif font-bold mt-1">
            {stats.completedCount}{" "}
            <span className="text-[13px] font-sans font-normal">
              fics completas
            </span>
          </div>
          <div
            className="text-[11.5px] mt-1"
            style={{ color: activeTheme.muted }}
          >
            Obras finalizadas no AO3 que você terminou
          </div>
        </div>
      </div>

      {/* ================= BARRA DE AÇÃO: ADICIONAR LINK DO AO3 ORIGINAL + BOTÃO DE ATUALIZAR TODAS ================= */}
      <div
        className="p-4 rounded-sm border space-y-3"
        style={{
          backgroundColor: activeTheme.surface,
          borderColor: activeTheme.border,
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-[16px] font-serif font-bold flex items-center gap-2">
              <Flame
                className="w-4 h-4"
                style={{ color: activeTheme.accent }}
              />
              Rastreador de Atualizações do AO3 Original (archiveofourown.org)
            </h3>
            <p className="text-[12px]" style={{ color: activeTheme.muted }}>
              Cole o link de qualquer fanfic do AO3 Original abaixo (ou use nossa
              Extensão direto no AO3). Quando quiser checar se os autores
              postaram capítulos novos, clique em{" "}
              <strong>&ldquo;Verificar Atualizações no AO3 Original&rdquo;</strong>!
            </p>
          </div>

          <button
            type="button"
            disabled={isSyncingAll}
            onClick={handleSyncAllNow}
            className="inline-flex items-center gap-2 px-4 py-2 text-white font-bold text-[12.5px] rounded-sm shadow transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: activeTheme.accent }}
          >
            <RefreshCw
              className={`w-4 h-4 ${isSyncingAll ? "animate-spin" : ""}`}
            />
            {isSyncingAll
              ? "Consultando AO3 Original..."
              : "🔄 Verificar Atualizações no AO3 Original Agora"}
          </button>
        </div>

        {syncProgressText && (
          <div className="p-2.5 bg-white text-[#990000] border border-[#990000] rounded-sm text-[12px] font-medium flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            <span>{syncProgressText}</span>
          </div>
        )}

        {feedbackBanner && (
          <div
            className={`p-3 rounded-sm border text-[12.5px] font-medium ${
              feedbackBanner.type === "error"
                ? "bg-[#fff1f0] border-[#ffa39e] text-[#cf1322]"
                : feedbackBanner.type === "success"
                ? "bg-[#f6ffed] border-[#b7eb8f] text-[#237804]"
                : "bg-[#e6f7ff] border-[#91d5ff] text-[#0958d9]"
            }`}
          >
            {feedbackBanner.message}
          </div>
        )}

        {/* Formulário de Adicionar Fanfic do AO3 Original */}
        <form
          onSubmit={handleAddAo3Work}
          className="grid grid-cols-1 md:grid-cols-12 gap-2.5 pt-2 border-t"
          style={{ borderColor: activeTheme.border }}
        >
          <div className="md:col-span-5">
            <label className="block text-[11.5px] font-semibold mb-1">
              Link da Fanfic no AO3 Original (ou ID da Obra) *
            </label>
            <input
              type="text"
              required
              value={ao3InputUrl}
              onChange={(e) => setAo3InputUrl(e.target.value)}
              placeholder="Ex: https://archiveofourown.org/works/24989932/chapters/60505264"
              className="w-full px-2.5 py-1.5 text-[12.5px] border rounded-sm"
              style={{
                backgroundColor: activeTheme.bg,
                color: activeTheme.text,
                borderColor: activeTheme.border,
              }}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-[11.5px] font-semibold mb-1">
              Em qual capítulo você parou?
            </label>
            <input
              type="number"
              min={0}
              value={manualChapterRead}
              onChange={(e) => setManualChapterRead(e.target.value)}
              placeholder="Auto pelo link"
              className="w-full px-2.5 py-1.5 text-[12.5px] border rounded-sm"
              style={{
                backgroundColor: activeTheme.bg,
                color: activeTheme.text,
                borderColor: activeTheme.border,
              }}
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-[11.5px] font-semibold mb-1">
              Nota rápida (onde parou na história)
            </label>
            <input
              type="text"
              value={manualNotes}
              onChange={(e) => setManualNotes(e.target.value)}
              placeholder="Ex: Parei quando Neil chega em..."
              className="w-full px-2.5 py-1.5 text-[12.5px] border rounded-sm"
              style={{
                backgroundColor: activeTheme.bg,
                color: activeTheme.text,
                borderColor: activeTheme.border,
              }}
            />
          </div>

          <div className="md:col-span-2 flex items-end">
            <button
              type="submit"
              disabled={isAdding}
              className="w-full py-1.5 px-3 text-white font-semibold text-[12.5px] rounded-sm flex items-center justify-center gap-1.5 transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: activeTheme.accent }}
            >
              {isAdding ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <PlusCircle className="w-4 h-4" />
              )}
              <span>Acompanhar Fic</span>
            </button>
          </div>
        </form>
      </div>

      {/* ================= ABAS DE FILTRO RÁPIDO E BUSCA ================= */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b"
        style={{ borderColor: activeTheme.border }}
      >
        <div className="flex flex-wrap items-center gap-1.5 text-[12.5px]">
          {(
            [
              {
                id: "all",
                label: `📚 Todas Acompanhadas (${stats.totalTracked})`,
              },
              {
                id: "unread",
                label: `🔥 Atualizadas / Com Capítulos Não Lidos (${stats.unreadWorksCount})`,
              },
              {
                id: "up_to_date",
                label: `⏳ Em Dia / Esperando Autor (${stats.upToDateWipCount})`,
              },
              {
                id: "completed",
                label: `✅ Completas e Lidas (${stats.completedCount})`,
              },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className="px-3 py-1.5 rounded-sm border text-[12px] transition-colors"
              style={{
                backgroundColor:
                  activeTab === tab.id
                    ? activeTheme.accent
                    : activeTheme.surface,
                color: activeTab === tab.id ? "#ffffff" : activeTheme.text,
                borderColor:
                  activeTab === tab.id
                    ? activeTheme.accent
                    : activeTheme.border,
                fontWeight: activeTab === tab.id ? 700 : 500,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrar fics acompanhadas..."
            className="w-full pl-2.5 pr-7 py-1 text-[12px] border rounded-sm"
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
      </div>

      {/* ================= LISTA DE FANFICS ACOMPANHADAS NO AO3 ORIGINAL ================= */}
      <div className="space-y-3">
        {filteredWorks.length === 0 ? (
          <div
            className="p-8 text-center border rounded-sm space-y-2"
            style={{
              backgroundColor: activeTheme.surface,
              borderColor: activeTheme.border,
            }}
          >
            <Sparkles
              className="w-7 h-7 mx-auto"
              style={{ color: activeTheme.accent }}
            />
            <div className="font-serif text-[16px] font-bold">
              Nenhuma fanfic encontrada nesta categoria
            </div>
            <p className="text-[12.5px]" style={{ color: activeTheme.muted }}>
              Cole o link de qualquer fanfic do AO3 no campo acima para começar
              a rastrear seus capítulos e atualizações automaticamente!
            </p>
          </div>
        ) : (
          filteredWorks.map((work) => {
            const unreadCount = Math.max(
              0,
              work.chaptersPublishedOnAo3 - work.chaptersReadByMe
            );
            const hasUnread = unreadCount > 0;
            const nextChapterToReadNumber = Math.min(
              work.chaptersPublishedOnAo3,
              work.chaptersReadByMe + 1
            );
            const nextChapterObj = work.chapterLinks.find(
              (c) => c.number === nextChapterToReadNumber
            );
            const directNextChapterUrl =
              nextChapterObj?.url || work.ao3Url;

            return (
              <article
                key={work.id}
                className="border p-4 rounded-sm shadow-sm transition-all"
                style={{
                  backgroundColor: activeTheme.bg,
                  borderColor: hasUnread
                    ? activeTheme.accent
                    : activeTheme.border,
                  borderWidth: hasUnread ? "2px" : "1px",
                }}
              >
                {/* Faixa Superior de Alerta se a Fanfic Tiver Capítulos Novos Não Lidos no AO3 */}
                {hasUnread ? (
                  <div
                    className="mb-3 px-3 py-2 rounded-sm text-white flex flex-wrap items-center justify-between gap-2 text-[12.5px]"
                    style={{ backgroundColor: activeTheme.accent }}
                  >
                    <div className="flex items-center gap-2 font-bold">
                      <BellRing className="w-4 h-4 shrink-0" />
                      <span>
                        ATUALIZADA NO AO3! Você tem +{unreadCount} capítulo(s)
                        novo(s) não lido(s)! (Você parou no Cap.{" "}
                        {work.chaptersReadByMe} • O AO3 já está no Cap.{" "}
                        {work.chaptersPublishedOnAo3})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={directNextChapterUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1 bg-white text-[#990000] font-bold rounded-sm text-[12px] hover:bg-[#f5f5f5] shadow-sm"
                      >
                        <span>
                          👉 Ler Cap. {nextChapterToReadNumber} no AO3 Original
                        </span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>

                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateChaptersRead(
                            work,
                            work.chaptersPublishedOnAo3
                          )
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-black/25 hover:bg-black/40 text-white rounded-sm text-[11.5px]"
                        title="Marcar todos os capítulos lançados até agora como lidos"
                      >
                        <BookCheck className="w-3.5 h-3.5" />
                        Já li até o Cap. {work.chaptersPublishedOnAo3}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="mb-3 px-3 py-1.5 rounded-sm border flex flex-wrap items-center justify-between gap-2 text-[12px]"
                    style={{
                      backgroundColor: activeTheme.surface,
                      borderColor: activeTheme.border,
                    }}
                  >
                    <span className="flex items-center gap-1.5 font-medium text-green-700">
                      <CheckCircle2 className="w-4 h-4" />
                      Em dia! Você já leu todos os {work.chaptersPublishedOnAo3}{" "}
                      capítulo(s) publicados até o momento no AO3.
                    </span>
                    <span
                      className="text-[11px]"
                      style={{ color: activeTheme.muted }}
                    >
                      Última atualização do autor no AO3: {work.ao3UpdatedAt}
                    </span>
                  </div>
                )}

                {/* Cabeçalho Estilo AO3 */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <StatusIconsGrid
                      rating={work.rating}
                      category={work.category}
                      warningStatus={work.warningStatus}
                      completionStatus={work.completionStatus}
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-[15.5px] font-medium leading-snug">
                        <a
                          href={work.ao3Url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:opacity-80 inline-flex items-center gap-1"
                          style={{ color: activeTheme.accent }}
                        >
                          {work.title}
                          <ExternalLink className="w-3.5 h-3.5 inline" />
                        </a>{" "}
                        <span
                          className="text-[13px] font-normal"
                          style={{ color: activeTheme.muted }}
                        >
                          por {work.author}
                        </span>
                      </h4>
                      <div
                        className="text-[12px] mt-0.5"
                        style={{ color: activeTheme.muted }}
                      >
                        {work.fandoms.join(", ")}
                      </div>
                    </div>
                  </div>

                  <div className="text-right text-[11.5px] shrink-0">
                    <div>
                      Atualizado no AO3:{" "}
                      <strong>{work.ao3UpdatedAt}</strong>
                    </div>
                    <div style={{ color: activeTheme.muted }}>
                      ID AO3: #{work.ao3WorkId}
                    </div>
                  </div>
                </div>

                {/* Sinopse curta */}
                <blockquote
                  className="mt-2.5 mb-3 pl-2.5 border-l-2 text-[12.5px] line-clamp-2"
                  style={{
                    borderColor: activeTheme.border,
                    color: activeTheme.text,
                  }}
                >
                  {work.summary}
                </blockquote>

                {/* Painel Interativo de Controle de Capítulos ("Qual capítulo estou" vs "Quantos saíram no AO3") */}
                <div
                  className="p-3 rounded-sm border flex flex-wrap items-center justify-between gap-3 text-[12.5px]"
                  style={{
                    backgroundColor: activeTheme.surface,
                    borderColor: activeTheme.border,
                  }}
                >
                  {/* Controle de "Em qual capítulo estou" */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold">
                        Qual capítulo eu li por último:
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateChaptersRead(
                            work,
                            work.chaptersReadByMe - 1
                          )
                        }
                        disabled={work.chaptersReadByMe <= 0}
                        className="p-1 border rounded-sm bg-white text-[#222] disabled:opacity-40"
                        title="Diminuir capítulo lido"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span
                        className="px-2.5 py-0.5 font-bold rounded-sm border bg-white text-[#222]"
                        style={{ borderColor: activeTheme.accent }}
                      >
                        Cap. {work.chaptersReadByMe}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateChaptersRead(
                            work,
                            work.chaptersReadByMe + 1
                          )
                        }
                        disabled={
                          work.chaptersReadByMe >= work.chaptersPublishedOnAo3
                        }
                        className="p-1 border rounded-sm bg-white text-[#222] disabled:opacity-40"
                        title="Marcar mais 1 capítulo como lido"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div>
                      <span>Publicado no AO3 Original: </span>
                      <strong style={{ color: activeTheme.accent }}>
                        {work.chaptersPublishedOnAo3}/
                        {work.chaptersTotalOnAo3 ?? "?"}
                      </strong>
                    </div>

                    {/* Seletor rápido para ir direto para qualquer capítulo específico no AO3 Original */}
                    {work.chapterLinks.length > 0 && (
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            window.open(
                              e.target.value,
                              "_blank",
                              "noopener,noreferrer"
                            );
                          }
                        }}
                        className="px-2 py-1 border rounded-sm text-[12px] bg-white text-[#222]"
                      >
                        <option value="">
                          Abrir capítulo específico no AO3 Original...
                        </option>
                        {work.chapterLinks.map((ch) => (
                          <option key={ch.number} value={ch.url}>
                            Cap. {ch.number}: {ch.title}{" "}
                            {ch.number <= work.chaptersReadByMe
                              ? " (✓ Já lido)"
                              : " (🔥 NÃO LIDO!)"}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Ações individuais da obra */}
                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      type="button"
                      onClick={async () => {
                        setSyncProgressText(
                          `Sincronizando "${work.title}" com o AO3 Original...`
                        );
                        try {
                          await addOrSyncTrackedWorkFromAo3Url(work.ao3WorkId);
                        } finally {
                          setSyncProgressText(null);
                        }
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 border rounded-sm text-[11.5px] bg-white text-[#222] hover:border-[#990000]"
                      title="Consultar este livro agora no AO3 Original"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Checar AO3
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (
                          window.confirm(
                            `Parar de acompanhar "${work.title}"?`
                          )
                        ) {
                          db.trackedAo3Works.delete(work.id);
                        }
                      }}
                      className="p-1 text-[#777] hover:text-[#990000]"
                      title="Remover do acompanhamento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Campo de anotação pessoal rápida (ex: onde parou na cena) */}
                <div className="mt-2 flex items-center gap-2 text-[12px]">
                  <span
                    className="font-semibold shrink-0"
                    style={{ color: activeTheme.muted }}
                  >
                    Minha nota:
                  </span>
                  <input
                    type="text"
                    value={work.notes || ""}
                    onChange={(e) =>
                      db.trackedAo3Works.update(work.id, {
                        notes: e.target.value,
                      })
                    }
                    placeholder="Clique para anotar em qual parte da história você parou..."
                    className="flex-1 bg-transparent border-b border-dashed focus:outline-none py-0.5 text-[12px]"
                    style={{
                      borderColor: activeTheme.border,
                      color: activeTheme.text,
                    }}
                  />
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
