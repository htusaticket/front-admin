"use client";

import { motion } from "framer-motion";
import { Plus, Upload, Mic, HelpCircle, Calendar, Circle } from "lucide-react";
import { useState } from "react";

import { BulkUploadChallengesModal } from "@/components/challenges/BulkUploadChallengesModal";
import { CreateChallengeModal } from "@/components/challenges/CreateChallengeModal";

// Mock Data
const challenges = [
  {
    id: 1,
    title: "Listen to Podcast #4",
    description: "Listen to the daily audio and answer the question.",
    date: new Date().toISOString().split("T")[0], // Today
    status: "Active",
    type: "Audio",
  },
  {
    id: 2,
    title: "Negotiation Quiz",
    description: "Test your knowledge on closing techniques.",
    date: new Date(Date.now() + 86400000).toISOString().split("T")[0], // Tomorrow
    status: "Scheduled",
    type: "MultipleChoice",
    options: ["Always close", "Listen first", "Speak fast"],
    correctAnswer: "Listen first",
  },
];

export default function ChallengesPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Generate next 7 days
  const today = new Date();
  const next7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return {
      date: d.toISOString().split("T")[0],
      dayName: d.toLocaleDateString("en-US", { weekday: "short" }),
      dayNumber: d.getDate(),
    };
  });

  const getChallengeForDate = (date: string) => challenges.find(c => c.date === date);

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

      {/* 7-Day Calendar View */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-gray-500" />
          <h2 className="font-bold text-gray-900">Next 7 Days</h2>
        </div>
         
        <div className="grid grid-cols-7 gap-4">
          {next7Days.map((day) => {
            const challenge = getChallengeForDate(day.date);
            const isToday = day.date === today.toISOString().split("T")[0];

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
                      challenge.type === "Audio" ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"
                    }`}>
                      {challenge.type === "Audio" ? <Mic className="h-4 w-4" /> : <HelpCircle className="h-4 w-4" />}
                    </div>
                    <span className="text-[10px] font-medium text-gray-600 truncate w-full text-center px-1">
                      {challenge.type}
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
                  challenge.type === "Audio" ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"
                }`}>
                  {challenge.type === "Audio" && <Mic className="h-5 w-5" />}
                  {challenge.type === "MultipleChoice" && <HelpCircle className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{challenge.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-1">{challenge.description}</p>
                  {challenge.type === "MultipleChoice" && (
                    <p className="mt-1 text-xs text-gray-400">
                      {challenge.options?.length} Options • Correct: {challenge.correctAnswer}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-100 rounded-md px-2 py-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {challenge.date}
                </div>
                <div className="flex gap-2">
                  <button className="text-sm font-semibold text-gray-400 hover:text-brand-primary">
                        Edit
                  </button>
                  <button className="text-sm font-semibold text-red-400 hover:text-red-600">
                        Delete
                  </button>
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
