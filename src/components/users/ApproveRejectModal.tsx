"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, XCircle, Loader2, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useModalLock } from "@/hooks/useModalLock";
import { useUsersStore } from "@/store/users";
import type { UserPlan } from "@/types/admin";

interface ApproveRejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  userEmail: string;
}

const PLANS: { value: UserPlan; label: string; description: string }[] = [
  { value: "PRO", label: "Pro", description: "Full access to all features" },
  { value: "ELITE", label: "Elite", description: "Full access to all features" },
  { value: "LEVEL_UP", label: "Level Up", description: "Full access to all features" },
  { value: "HIRING_HUB", label: "Hiring Hub", description: "Content + Job Board (no live classes)" },
  { value: "SKILL_BUILDER", label: "Skill Builder", description: "Content only" },
  { value: "SKILL_BUILDER_LIVE", label: "Skill Builder Live", description: "Content + Live classes" },
];

export function ApproveRejectModal({ 
  isOpen, 
  onClose, 
  userId, 
  userName,
  userEmail,
}: ApproveRejectModalProps) {
  useModalLock(isOpen, onClose);
  const [mode, setMode] = useState<"approve" | "reject" | null>(null);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  
  // Plan form state
  const [selectedPlan, setSelectedPlan] = useState<UserPlan>("PRO");
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1); // Default: 1 month
    return date.toISOString().split("T")[0];
  });

  const { approveRegistration, rejectRegistration } = useUsersStore();

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan || !startDate) return;

    setIsSubmitting(true);
    const result = await approveRegistration(userId, {
      plan: selectedPlan,
      startDate,
      endDate: endDate || "2099-12-31",
    });
    setIsSubmitting(false);

    if (result.success) {
      resetForm();
      onClose();
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    if (reason.trim().length < 10) {
      setReasonError("El motivo debe tener al menos 10 caracteres");
      return;
    }
    setReasonError("");

    setIsSubmitting(true);
    const result = await rejectRegistration(userId, { reason: reason.trim() });
    setIsSubmitting(false);

    if (result.success) {
      resetForm();
      onClose();
      router.push("/users");
    }
  };

  const resetForm = () => {
    setMode(null);
    setReason("");
    setReasonError("");
    setSelectedPlan("PRO");
    const today = new Date();
    setStartDate(today.toISOString().split("T")[0]);
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setEndDate(nextMonth.toISOString().split("T")[0]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-amber-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  {mode === "reject" ? (
                    <XCircle className="h-5 w-5 text-red-600" />
                  ) : mode === "approve" ? (
                    <CreditCard className="h-5 w-5 text-green-600" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-amber-600" />
                  )}
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-gray-900">
                    {mode === "reject"
                      ? "Reject Registration"
                      : mode === "approve"
                        ? "Assign Plan"
                        : "Pending Registration"}
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
              {/* Initial state - Choose action */}
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
                      onClick={() => setMode("approve")}
                      disabled={isSubmitting}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      <CheckCircle className="h-4 w-4" />
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

              {/* Approve mode - Plan selection form */}
              {mode === "approve" && (
                <form onSubmit={handleApprove} className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <p className="text-sm text-green-800">
                        Assign a plan to <strong>{userName}</strong> to complete the approval.
                        The user will receive an email notification and can start using the platform.
                    </p>
                  </div>

                  {/* Plan Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Select Plan *
                    </label>
                    <div className="space-y-2">
                      {PLANS.map((plan) => (
                        <label
                          key={plan.value}
                          className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                            selectedPlan === plan.value
                              ? "border-brand-primary bg-brand-primary/5"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <input
                            type="radio"
                            name="plan"
                            value={plan.value}
                            checked={selectedPlan === plan.value}
                            onChange={(e) => setSelectedPlan(e.target.value as UserPlan)}
                            className="h-4 w-4 text-brand-primary focus:ring-brand-primary"
                          />
                          <div className="flex-1">
                            <span className="font-semibold text-gray-900">{plan.label}</span>
                            <p className="text-xs text-gray-500">{plan.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Date Selection */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                          Start Date *
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        required
                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                          End Date
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={startDate}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
                      />
                    </div>
                  </div>

                  {/* Quick Duration Buttons */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Quick Duration
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const start = new Date(startDate);
                          start.setMonth(start.getMonth() + 3);
                          setEndDate(start.toISOString().split("T")[0]);
                        }}
                        className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-bold text-gray-700 hover:border-brand-primary hover:bg-brand-primary/5 hover:text-brand-primary transition-all"
                      >
                          3 Months
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const start = new Date(startDate);
                          start.setMonth(start.getMonth() + 4);
                          setEndDate(start.toISOString().split("T")[0]);
                        }}
                        className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-bold text-gray-700 hover:border-brand-primary hover:bg-brand-primary/5 hover:text-brand-primary transition-all"
                      >
                          4 Months
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEndDate("");
                        }}
                        className={`flex-1 rounded-xl border px-3 py-2 text-sm font-bold transition-all ${
                          !endDate
                            ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                            : "border-gray-200 text-gray-700 hover:border-brand-primary hover:bg-brand-primary/5 hover:text-brand-primary"
                        }`}
                      >
                          ∞ Infinite
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
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
                      disabled={isSubmitting || !selectedPlan || !startDate}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                        Approve & Assign Plan
                    </button>
                  </div>
                </form>
              )}

              {/* Reject mode */}
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
                      onChange={(e) => { setReason(e.target.value); if (reasonError) setReasonError(""); }}
                      placeholder="Please provide a reason for rejecting this registration..."
                      className={`w-full h-24 rounded-xl border p-3 text-sm outline-none resize-none ${reasonError ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-red-400"}`}
                      required
                    />
                    {reasonError && (
                      <p className="text-xs text-red-500 mt-1">{reasonError}</p>
                    )}
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}
