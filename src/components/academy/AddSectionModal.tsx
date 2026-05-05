"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Layers, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

import { useModalLock } from "@/hooks/useModalLock";
import { useAcademyStore, type Section } from "@/store/academy";

interface AddSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleId: number;
  initialData?: Section | null;
}

export function AddSectionModal({ isOpen, onClose, moduleId, initialData }: AddSectionModalProps) {
  useModalLock(isOpen, onClose);
  const { createSection, updateSection, isSaving } = useAcademyStore();

  const [title, setTitle] = useState("");

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTitle(initialData?.title ?? "");
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (initialData) {
      await updateSection(initialData.id, { title: title.trim() });
    } else {
      await createSection(moduleId, { title: title.trim() });
    }

    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-6"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="flex w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-brand-primary/10 p-2">
                  <Layers className="h-5 w-5 text-brand-primary" />
                </div>
                <h2 className="font-display text-lg font-bold text-gray-900">
                  {initialData ? "Edit Section" : "Create New Section"}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4 p-6">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                    Section Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Module 1 — Introduction"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-brand-cyan-dark focus:ring-2 focus:ring-brand-cyan-dark/20"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 bg-white px-6 py-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSaving}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !title.trim()}
                  className="flex items-center gap-2 rounded-xl bg-brand-primary px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-primary/20 transition-all hover:bg-brand-primary/90 disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  {initialData ? "Save Changes" : "Create Section"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
