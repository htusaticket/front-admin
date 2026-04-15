"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

import { useModalLock } from "@/hooks/useModalLock";
import { useSystemConfigStore } from "@/store/systemConfig";
import { useUsersStore } from "@/store/users";

interface IssueStrikeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
}

export function IssueStrikeModal({ isOpen, onClose, userId, userName }: IssueStrikeModalProps) {
  useModalLock(isOpen, onClose);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { issueStrike } = useUsersStore();
  const { config, fetchConfig } = useSystemConfigStore();

  // Fetch config to get maxStrikesForPunishment (only when modal is open)
  useEffect(() => {
    if (isOpen && !config) fetchConfig();
  }, [isOpen, config, fetchConfig]);

  // Clear error and reason when modal opens (adjusting state during rendering)
  const [prevIsOpen, setPrevIsOpen] = useState(false);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setError(null);
      setReason("");
    }
  }

  const maxStrikes = config?.maxStrikesForPunishment ?? 3;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = reason.trim();
    if (!trimmed) return;

    if (trimmed.length < 5) {
      setError("The reason must be at least 5 characters long.");
      return;
    }

    setIsSubmitting(true);
    const result = await issueStrike(userId, { reason: trimmed });
    setIsSubmitting(false);

    if (result.success) {
      setReason("");
      setError(null);
      onClose();
    } else {
      setError(result.message || "An error occurred while issuing the strike.");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-red-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-gray-900">
                      Issue Strike
                  </h2>
                  <p className="text-sm text-gray-500">To {userName}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-gray-500 hover:bg-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm text-amber-800">
                  <strong>Warning:</strong> If this user reaches {maxStrikes} strikes,
                    their access to live classes will be automatically restricted.
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                    Reason for Strike
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explain the reason for this strike..."
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value);
                    if (error) setError(null);
                  }}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20 resize-none"
                />
                <p className="mt-1 text-xs text-gray-400">
                  Minimum 5 characters ({reason.trim().length}/5)
                </p>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                    Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !reason.trim()}
                  className="flex items-center gap-2 rounded-xl bg-red-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-red-600/20 transition-all hover:bg-red-700 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                    Issue Strike
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
