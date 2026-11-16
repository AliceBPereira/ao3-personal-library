"use client";

import React from "react";
import {
  CategoryAO3,
  CompletionStatusAO3,
  RatingAO3,
  WarningStatusAO3,
} from "@/types/work";

interface StatusIconsGridProps {
  rating: RatingAO3;
  category: CategoryAO3;
  warningStatus: WarningStatusAO3;
  completionStatus: CompletionStatusAO3;
}

export function StatusIconsGrid({
  rating,
  category,
  warningStatus,
  completionStatus,
}: StatusIconsGridProps) {
  // Quadrante 1 (Superior Esquerdo): Rating
  const renderRatingBox = () => {
    switch (rating) {
      case "general":
        return (
          <div
            title="Classificação: Público Geral (General Audiences)"
            className="w-[15px] h-[15px] bg-[#77a800] text-white font-bold text-[11px] leading-none flex items-center justify-center select-none"
          >
            G
          </div>
        );
      case "teen":
        return (
          <div
            title="Classificação: Adolescentes e Acima (Teen And Up)"
            className="w-[15px] h-[15px] bg-[#d8b600] text-white font-bold text-[11px] leading-none flex items-center justify-center select-none"
          >
            T
          </div>
        );
      case "mature":
        return (
          <div
            title="Classificação: Maduro (Mature)"
            className="w-[15px] h-[15px] bg-[#e27800] text-white font-bold text-[11px] leading-none flex items-center justify-center select-none"
          >
            M
          </div>
        );
      case "explicit":
        return (
          <div
            title="Classificação: Explícito (Explicit)"
            className="w-[15px] h-[15px] bg-[#990000] text-white font-bold text-[11px] leading-none flex items-center justify-center select-none"
          >
            E
          </div>
        );
      case "not_rated":
      default:
        return (
          <div
            title="Sem Classificação (Not Rated)"
            className="w-[15px] h-[15px] bg-[#e8e8e8] border border-[#cccccc] text-transparent text-[10px] leading-none flex items-center justify-center select-none"
          >
            -
          </div>
        );
    }
  };

  // Quadrante 2 (Superior Direito): Categoria (Ship)
  const renderCategoryBox = () => {
    switch (category) {
      case "mm":
        return (
          <div
            title="Categoria: M/M"
            className="w-[15px] h-[15px] bg-[#0055aa] text-white font-bold text-[10px] leading-none flex items-center justify-center select-none"
          >
            ♂
          </div>
        );
      case "ff":
        return (
          <div
            title="Categoria: F/F"
            className="w-[15px] h-[15px] bg-[#b5005a] text-white font-bold text-[10px] leading-none flex items-center justify-center select-none"
          >
            ♀
          </div>
        );
      case "fm":
        return (
          <div
            title="Categoria: F/M"
            className="w-[15px] h-[15px] bg-[#6c2882] text-white font-bold text-[9px] leading-none flex items-center justify-center select-none"
          >
            ⚤
          </div>
        );
      case "gen":
        return (
          <div
            title="Categoria: Gen (Geral / Sem foco romântico)"
            className="w-[15px] h-[15px] bg-[#7fb800] text-white font-bold text-[10px] leading-none flex items-center justify-center select-none"
          >
            ○
          </div>
        );
      case "multi":
        return (
          <div
            title="Categoria: Multi"
            className="w-[15px] h-[15px] bg-gradient-to-br from-[#0055aa] via-[#b5005a] to-[#7fb800] text-white font-bold text-[9px] leading-none flex items-center justify-center select-none"
          >
            +
          </div>
        );
      default:
        return (
          <div
            title="Categoria: Outros"
            className="w-[15px] h-[15px] bg-[#333333] text-white font-bold text-[10px] leading-none flex items-center justify-center select-none"
          >
            *
          </div>
        );
    }
  };

  // Quadrante 3 (Inferior Esquerdo): Avisos de Arquivo
  const renderWarningBox = () => {
    switch (warningStatus) {
      case "chose_not":
        return (
          <div
            title="O criador optou por não usar avisos de arquivo"
            className="w-[15px] h-[15px] bg-[#e27800] text-white font-bold text-[10px] leading-none flex items-center justify-center select-none"
          >
            ?!
          </div>
        );
      case "has_warnings":
        return (
          <div
            title="Aplicam-se avisos de arquivo"
            className="w-[15px] h-[15px] bg-[#990000] text-white font-bold text-[11px] leading-none flex items-center justify-center select-none"
          >
            !
          </div>
        );
      case "none":
      default:
        return (
          <div
            title="Não se aplicam avisos de arquivo"
            className="w-[15px] h-[15px] bg-[#e8e8e8] border border-[#cccccc] text-transparent text-[10px] leading-none flex items-center justify-center select-none"
          >
            -
          </div>
        );
    }
  };

  // Quadrante 4 (Inferior Direito): Status da Obra
  const renderCompletionBox = () => {
    switch (completionStatus) {
      case "complete":
        return (
          <div
            title="Obra Completa"
            className="w-[15px] h-[15px] bg-[#77a800] text-white font-bold text-[10px] leading-none flex items-center justify-center select-none"
          >
            ✓
          </div>
        );
      case "wip":
      case "abandoned":
      default:
        return (
          <div
            title="Obra em Andamento (WIP)"
            className="w-[15px] h-[15px] bg-[#990000] text-white font-bold text-[10px] leading-none flex items-center justify-center select-none"
          >
            ⊘
          </div>
        );
    }
  };

  return (
    <div
      className="grid grid-cols-2 gap-[2px] w-[32px] h-[32px] shrink-0 border border-[#d0d0d0] p-[1px] bg-white"
      aria-label="Ícones de classificação da obra"
    >
      {renderRatingBox()}
      {renderCategoryBox()}
      {renderWarningBox()}
      {renderCompletionBox()}
    </div>
  );
}
