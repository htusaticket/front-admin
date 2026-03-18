"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, CreditCard, Loader2, CheckCircle } from "lucide-react";
import { useState } from "react";

import { useModalLock } from "@/hooks/useModalLock";
import { useUsersStore } from "@/store/users";
import type { UserPlan } from "@/types/admin";

interface ActivateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  userEmail: string;
}

const PLANS: { value: UserPlan; label: string; description: string; duration: string }[] = [
  { 
    value: "PRO", 
    label: "PRO", 
    description: "Full access to all content and features",
    duration: "1 month",
  },
  { 
    value: "ELITE", 
    label: "ELITE", 
    description: "Full access to all content and features",
    duration: "3 months",
  },
  { 
    value: "LEVEL_UP", 
    label: "LEVEL UP", 
    description: "Full access to all content and features",
    duration: "6 months",
  },
  { 
    value: "HIRING_HUB", 
    label: "HIRING HUB", 
    description: "Access to content and job board",
    duration: "1 month",
  },
  { 
    value: "SKILL_BUILDER", 
    label: "SKILL BUILDER", 
    description: "Limited content selected by admin",
    duration: "1 month",
  },
];

export function ActivateUserModal({ 
  isOpen, 
  onClose, 
  userId, 
  userName,
  userEmail,
}: ActivateUserModalProps) {
  useModalLock(isOpen, onClose);
  const [selectedPlan, setSelectedPlan] = useState<UserPlan | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { activateUser } = useUsersStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;

    setIsSubmitting(true);
    const result = await activateUser(userId, { plan: selectedPlan });
    setIsSubmitting(false);

    if (result.success) {
      setSelectedPlan(null);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedPlan(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-green-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CreditCard className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-gray-900">
                      Activate User
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
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-800">
                    Activating <strong>{userName}</strong> ({userEmail}) will grant them access to the platform 
                    based on the selected plan. The subscription period starts today.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Plan *
                </label>
                <div className="space-y-2">
                  {PLANS.map((plan) => (
                    <label
                      key={plan.value}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                        selectedPlan === plan.value
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="plan"
                        value={plan.value}
                        checked={selectedPlan === plan.value}
                        onChange={() => setSelectedPlan(plan.value)}
                        className="h-4 w-4 text-green-600 focus:ring-green-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-900">{plan.label}</span>
                          <span className="text-sm text-gray-500">{plan.duration}</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                    Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedPlan}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                    Activate User
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
