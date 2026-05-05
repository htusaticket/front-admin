"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Loader2 } from "lucide-react";

import { useModalLock } from "@/hooks/useModalLock";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  isLoading = false,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  useModalLock(isOpen, onClose);

  const isDanger = variant === "danger";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-6"
          onClick={() => {
            if (!isLoading) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="flex w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4 p-6">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                  isDanger ? "bg-red-100 text-red-600" : "bg-brand-primary/10 text-brand-primary"
                }`}
              >
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-lg font-bold text-gray-900">{title}</h2>
                <p className="mt-1 text-sm text-gray-600">{description}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 bg-white px-6 py-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isLoading}
                className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white shadow-lg transition-all disabled:opacity-50 ${
                  isDanger
                    ? "bg-red-600 shadow-red-600/20 hover:bg-red-700"
                    : "bg-brand-primary shadow-brand-primary/20 hover:bg-brand-primary/90"
                }`}
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
