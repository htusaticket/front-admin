"use client";

import { motion } from "framer-motion";
import { Plus, Upload, Mic, HelpCircle, Calendar, Circle, Loader2, AlertCircle, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";

import { BulkUploadChallengesModal } from "@/components/challenges/BulkUploadChallengesModal";
import { CreateChallengeModal } from "@/components/challenges/CreateChallengeModal";
import { useAuthStore } from "@/store/auth";
import { useChallengesStore, type Challenge } from "@/store/challenges";

export default function ChallengesPage() {
  const { user } = useAuthStore();
  const { 
    challenges, 
    isLoading, 
    isSaving, 
    error, 
    fetchChallenges, 
    deleteChallenge, 
  } = useChallengesStore();
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  
  const isSuperAdmin = user?.role === "SUPERADMIN";
  
  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  // Generate next 7 days
  const today = new Date();
  const next7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    // Use local date format YYYY-MM-DD to match backend
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return {
      date: `${year}-${month}-${day}`,
      dayName: d.toLocaleDateString("en-US", { weekday: "short" }),
      dayNumber: d.getDate(),
    };
  });

  const getChallengeForDate = (date: string) => 
    challenges.find(c => c.scheduledDate === date);
  
  const handleDeleteChallenge = async (challenge: Challenge) => {
    if (!isSuperAdmin) return;
    
    if (confirm(`¿Estás seguro de eliminar el reto "${challenge.title}"?`)) {
      setDeletingId(challenge.id);
      await deleteChallenge(challenge.id);
      setDeletingId(null);
    }
  };
  
  if (isLoading && challenges.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-brand-primary">
            Daily Challenges
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Create and manage daily missions. One challenge per day.
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 transition-all hover:border-brand-primary/20 hover:bg-brand-primary/5 hover:text-brand-primary"
          >
            <Upload className="h-4 w-4" />
             Bulk Upload (Excel)
          </button>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-brand-primary/90 hover:shadow-lg hover:shadow-brand-primary/20"
          >
            <Plus className="h-4 w-4" />
             New Challenge
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* 7-Day Calendar View */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-gray-500" />
          <h2 className="font-bold text-gray-900">Next 7 Days</h2>
        </div>
         
        <div className="grid grid-cols-7 gap-4">
          {next7Days.map((day) => {
            const challenge = getChallengeForDate(day.date);
            const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
            const isToday = day.date === todayStr;

            return (
              <div 
                key={day.date} 
                className={`relative flex flex-col items-center justify-between rounded-xl border p-4 h-32 transition-all ${
                  isToday ? "border-brand-primary bg-brand-primary/5" : "border-gray-100 bg-gray-50"
                }`}
              >
                <div className="text-center">
                  <p className="text-xs font-medium text-gray-500 uppercase">{day.dayName}</p>
                  <p className={`text-lg font-bold ${isToday ? "text-brand-primary" : "text-gray-900"}`}>{day.dayNumber}</p>
                </div>
                        
                {challenge ? (
                  <div className="flex flex-col items-center gap-1">
                    <div className={`p-1.5 rounded-full ${
                      challenge.type === "AUDIO" ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"
                    }`}>
                      {challenge.type === "AUDIO" ? <Mic className="h-4 w-4" /> : <HelpCircle className="h-4 w-4" />}
                    </div>
                    <span className="text-[10px] font-medium text-gray-600 truncate w-full text-center px-1">
                      {challenge.type === "AUDIO" ? "Audio" : "Quiz"}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-gray-400">
                    <Circle className="h-5 w-5 opacity-20" />
                    <span className="text-[10px] mt-1">Empty</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Challenges List */ }
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4">
          <h2 className="font-display text-lg font-bold text-gray-900">Scheduled Challenges</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {challenges.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No challenges scheduled.</div>
          ) : challenges.map((challenge) => (
            <motion.div 
              key={challenge.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                  challenge.type === "AUDIO" ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"
                }`}>
                  {challenge.type === "AUDIO" ? <Mic className="h-5 w-5" /> : <HelpCircle className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{challenge.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-1">{challenge.description}</p>
                  {challenge.type === "MULTIPLE_CHOICE" && challenge.quizQuestions && challenge.quizQuestions.length > 0 && (
                    <p className="mt-1 text-xs text-gray-400">
                      {challenge.quizQuestions.length} Question(s)
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-100 rounded-md px-2 py-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {challenge.scheduledDate}
                </div>
                <div className="flex gap-2">
                  {isSuperAdmin && (
                    <button 
                      onClick={() => handleDeleteChallenge(challenge)}
                      disabled={isSaving && deletingId === challenge.id}
                      className="flex items-center gap-1 text-sm font-semibold text-red-400 hover:text-red-600 disabled:opacity-50"
                    >
                      {isSaving && deletingId === challenge.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    Delete
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <CreateChallengeModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <BulkUploadChallengesModal 
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
    </div>
  );
}
