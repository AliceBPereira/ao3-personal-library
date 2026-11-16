"use client";

import React, { useState } from "react";
import { CollectionShelf, WorkItem } from "@/types/work";
import { db } from "@/core/db/database";
import { FolderPlus, Trash2, X } from "lucide-react";

interface ShelvesManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  collections: CollectionShelf[];
  targetWork: WorkItem | null; // Se passado, permite marcar/desmarcar prateleiras para essa obra específica
}

const PRESET_COLORS = [
  "#990000",
  "#2b6cb0",
  "#d97706",
  "#4f46e5",
  "#15803d",
  "#9d174d",
  "#374151",
];

export function ShelvesManagerModal({
  isOpen,
  onClose,
  collections,
  targetWork,
}: ShelvesManagerModalProps) {
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newColor, setNewColor] = useState("#990000");

  if (!isOpen) return null;

  const handleCreateShelf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const shelf: CollectionShelf = {
      id: `shelf-${Date.now()}`,
      name: newName.trim(),
      description: newDesc.trim() || "Coleção personalizada",
      icon: "Bookmark",
      color: newColor,
      createdAt: new Date().toISOString(),
    };

    await db.collections.put(shelf);
    if (targetWork) {
      await db.works.update(targetWork.id, {
        collectionIds: [...targetWork.collectionIds, shelf.id],
      });
    }
    setNewName("");
    setNewDesc("");
  };

  const handleToggleWorkInShelf = async (shelfId: string) => {
    if (!targetWork) return;
    const exists = targetWork.collectionIds.includes(shelfId);
    const updated = exists
      ? targetWork.collectionIds.filter((id) => id !== shelfId)
      : [...targetWork.collectionIds, shelfId];

    await db.works.update(targetWork.id, { collectionIds: updated });
  };

  const handleDeleteShelf = async (shelfId: string) => {
    await db.collections.delete(shelfId);
    const allWorks = await db.works.toArray();
    for (const w of allWorks) {
      if (w.collectionIds.includes(shelfId)) {
        await db.works.update(w.id, {
          collectionIds: w.collectionIds.filter((id) => id !== shelfId),
        });
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 font-ao3Sans">
      <div className="bg-white border-2 border-[#990000] w-full max-w-lg rounded-sm shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="bg-[#990000] text-white px-4 py-3 flex items-center justify-between sticky top-0">
          <h3 className="font-serif text-[16px] font-bold">
            {targetWork
              ? `Prateleiras para "${targetWork.title}"`
              : "Gerenciar Coleções e Prateleiras Personalizadas"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-[#700000] rounded-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4 text-[13px]">
          {/* Lista de Prateleiras */}
          <div className="space-y-2">
            <h4 className="font-semibold text-[#222]">
              Suas Prateleiras ({collections.length})
            </h4>
            {collections.map((shelf) => {
              const isAssigned = targetWork?.collectionIds.includes(shelf.id);
              return (
                <div
                  key={shelf.id}
                  className="flex items-center justify-between gap-2 p-2.5 border border-[#dddddd] bg-[#fafafa] rounded-sm"
                >
                  <label className="flex items-start gap-2.5 cursor-pointer flex-1">
                    {targetWork && (
                      <input
                        type="checkbox"
                        checked={!!isAssigned}
                        onChange={() => handleToggleWorkInShelf(shelf.id)}
                        className="mt-1 accent-[#990000]"
                      />
                    )}
                    <span
                      className="w-3 h-3 rounded-full mt-1 shrink-0"
                      style={{ backgroundColor: shelf.color }}
                    />
                    <div>
                      <div className="font-medium text-[#222]">{shelf.name}</div>
                      <div className="text-[11.5px] text-[#666]">
                        {shelf.description}
                      </div>
                    </div>
                  </label>

                  <button
                    type="button"
                    onClick={() => handleDeleteShelf(shelf.id)}
                    className="p-1 text-[#777] hover:text-[#990000]"
                    title="Excluir prateleira"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Criar Nova Prateleira */}
          <form
            onSubmit={handleCreateShelf}
            className="pt-3 border-t border-[#dddddd] space-y-2.5"
          >
            <h4 className="font-semibold text-[#990000] flex items-center gap-1.5">
              <FolderPlus className="w-4 h-4" />
              Criar Nova Prateleira / Coleção
            </h4>

            <div>
              <label className="block text-[12px] mb-1">Nome da Coleção *</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: Para Ler no Fim de Semana, Favoritos Andriel..."
                className="w-full border border-[#aaaaaa] px-2.5 py-1.5 rounded-sm"
              />
            </div>

            <div>
              <label className="block text-[12px] mb-1">Descrição</label>
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Breve descrição da prateleira..."
                className="w-full border border-[#aaaaaa] px-2.5 py-1.5 rounded-sm"
              />
            </div>

            <div>
              <label className="block text-[12px] mb-1">Cor da Etiqueta</label>
              <div className="flex items-center gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewColor(color)}
                    className={`w-6 h-6 rounded-full border-2 ${
                      newColor === color
                        ? "border-black scale-110"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#990000] hover:bg-[#700000] text-white font-medium rounded-sm"
              >
                Criar Prateleira
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
