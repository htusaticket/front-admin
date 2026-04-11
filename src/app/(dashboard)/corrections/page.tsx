"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Calendar, User, Search, MessageSquare, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

import { ReviewSubmissionModal } from "@/components/corrections/ReviewSubmissionModal";
import { useSubmissionsStore } from "@/store/submissions";
import type { AdminSubmission, SubmissionStatus } from "@/types/admin";

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleString("es-AR", { 
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getAvatarColor = (name: string): string => {
  const colors = [
    "bg-red-50 text-red-600",
    "bg-orange-50 text-orange-600",
    "bg-amber-50 text-amber-600",
    "bg-green-50 text-green-600",
    "bg-teal-50 text-teal-600",
    "bg-blue-50 text-blue-600",
    "bg-indigo-50 text-indigo-600",
    "bg-purple-50 text-purple-600",
  ];
  const charCode = name.charCodeAt(0) || 0;
  return colors[charCode % colors.length];
};

export default function CorrectionsPage() {
  const { 
    submissions, 
    isLoading, 
    error,
    pendingCount,
    fetchSubmissions, 
  } = useSubmissionsStore();

  const [activeTab, setActiveTab] = useState<SubmissionStatus | "ALL">("PENDING");
  const [selectedSubmission, setSelectedSubmission] = useState<AdminSubmission | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchSubmissions({ 
      limit: 50,
      status: activeTab !== "ALL" ? activeTab : undefined, 
    });
  }, [fetchSubmissions, activeTab]);

  const filteredSubmissions = submissions.filter(s => {
    const matchesSearch = searchQuery 
      ? s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.challengeTitle.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesSearch;
  });

  const handleReviewClick = (submission: AdminSubmission) => {
    setSelectedSubmission(submission);
    setIsReviewModalOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-brand-primary">
            Corrections Zone
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Review and provide feedback on student submissions.
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Tabs & Filters */}
      <div className="flex flex-col gap-3 border-b border-gray-200 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-4 overflow-x-auto">
          <button 
            onClick={() => setActiveTab("PENDING")}
            className={`pb-4 text-sm font-bold transition-all relative ${
              activeTab === "PENDING" ? "text-brand-primary" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Pending Review
            {activeTab === "PENDING" && (
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />
            )}
            <span className="ml-2 bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs">
              {pendingCount}
            </span>
          </button>
          <button 
            onClick={() => setActiveTab("APPROVED")}
            className={`pb-4 text-sm font-bold transition-all relative ${
              activeTab === "APPROVED" ? "text-brand-primary" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Approved
            {activeTab === "APPROVED" && (
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />
            )}
          </button>
          <button 
            onClick={() => setActiveTab("NEEDS_IMPROVEMENT")}
            className={`pb-4 text-sm font-bold transition-all relative ${
              activeTab === "NEEDS_IMPROVEMENT" ? "text-brand-primary" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Needs Improvement
            {activeTab === "NEEDS_IMPROVEMENT" && (
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />
            )}
          </button>
        </div>
          
        <div className="pb-0 sm:pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search students or challenges..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-brand-primary w-full sm:w-64"
            />
          </div>
        </div>
      </div>

      {/* List */}
      {isLoading && submissions.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredSubmissions.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <CheckCircle2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">
                {activeTab === "PENDING" 
                  ? "No pending submissions to review." 
                  : `No ${activeTab.toLowerCase().replace("_", " ")} submissions found.`}
              </p>
            </div>
          ) : (
            filteredSubmissions.map((submission) => (
              <motion.div 
                key={submission.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => handleReviewClick(submission)}
                className="flex flex-wrap items-center justify-between gap-y-3 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center gap-6">
                  {/* Avatar */}
                  <div className={`h-12 w-12 rounded-full font-bold text-lg flex items-center justify-center ${getAvatarColor(submission.studentName)}`}>
                    {submission.studentName.charAt(0)}
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="font-bold text-gray-900">{submission.challengeTitle}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <User className="h-3.5 w-3.5" />
                      <span>{submission.studentName}</span>
                      <span className="text-gray-300">•</span>
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{formatDate(submission.submittedAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {submission.status === "PENDING" ? (
                    <button 
                      onClick={() => handleReviewClick(submission)}
                      className="flex items-center gap-2 px-6 py-2.5 bg-brand-primary text-white rounded-xl font-bold hover:bg-brand-primary/90 transition-all shadow-lg shadow-brand-primary/20"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Review
                    </button>
                  ) : (
                    <button
                      onClick={() => handleReviewClick(submission)}
                      className={`flex items-center gap-2 px-4 py-2 font-bold rounded-xl border cursor-pointer transition-all hover:shadow-md ${
                        submission.status === "APPROVED"
                          ? "text-green-600 bg-green-50 border-green-100 hover:bg-green-100"
                          : "text-amber-600 bg-amber-50 border-amber-100 hover:bg-amber-100"
                      }`}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {submission.status === "APPROVED" ? "Approved" : "Needs Work"}
                    </button>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      <ReviewSubmissionModal
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false);
          setSelectedSubmission(null);
          // Auto-refresh submissions after review
          fetchSubmissions({ 
            limit: 50,
            status: activeTab !== "ALL" ? activeTab : undefined, 
          });
        }}
        submission={selectedSubmission}
      />
    </div>
  );
}
