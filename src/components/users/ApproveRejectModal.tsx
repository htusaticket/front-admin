"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useState } from "react";

import { useUsersStore } from "@/store/users";

interface ApproveRejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  userEmail: string;
}

export function ApproveRejectModal({ 
  isOpen, 
  onClose, 
  userId, 
  userName,
  userEmail,
}: ApproveRejectModalProps) {
  const [mode, setMode] = useState<"approve" | "reject" | null>(null);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { approveRegistration, rejectRegistration } = useUsersStore();

  const handleApprove = async () => {
    setIsSubmitting(true);
    const result = await approveRegistration(userId);
    setIsSubmitting(false);

    if (result.success) {
      onClose();
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setIsSubmitting(true);
    const result = await rejectRegistration(userId, { reason: reason.trim() });
    setIsSubmitting(false);

    if (result.success) {
      setReason("");
      setMode(null);
      onClose();
    }
  };

  const handleClose = () => {
    setMode(null);
    setReason("");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-amber-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    {mode === "reject" ? (
                      <XCircle className="h-5 w-5 text-red-600" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-amber-600" />
                    )}
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-bold text-gray-900">
                      {mode === "reject" ? "Reject Registration" : "Pending Registration"}
                    </h2>
                    <p className="text-sm text-gray-500">{userName}</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="rounded-full p-2 text-gray-500 hover:bg-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {mode === null && (
                  <>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <p className="text-sm text-blue-800">
                        <strong>{userName}</strong> has requested to join the platform. 
                        Review their registration and choose to approve or reject.
                      </p>
                      <p className="text-sm text-blue-600 mt-2">
                        Email: {userEmail}
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={handleApprove}
                        disabled={isSubmitting}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        {isSubmitting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => setMode("reject")}
                        disabled={isSubmitting}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </button>
                    </div>
                  </>
                )}

                {mode === "reject" && (
                  <form onSubmit={handleReject} className="space-y-4">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <p className="text-sm text-red-800">
                        <strong>Warning:</strong> Rejecting this registration will permanently delete the user account. 
                        They will receive an email with the reason for rejection and can register again.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reason for Rejection *
                      </label>
                      <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Please provide a reason for rejecting this registration..."
                        className="w-full h-24 rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-red-400 resize-none"
                        required
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setMode(null)}
                        disabled={isSubmitting}
                        className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting || !reason.trim()}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                      >
                        {isSubmitting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        Confirm Rejection
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
