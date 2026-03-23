"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Play, Pause, ThumbsUp, AlertTriangle, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useState, useRef, useEffect } from "react";

import { useModalLock } from "@/hooks/useModalLock";
import { useSubmissionsStore } from "@/store/submissions";
import type { AdminSubmission } from "@/types/admin";

interface ReviewSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: AdminSubmission | null;
}

export function ReviewSubmissionModal({ isOpen, onClose, submission }: ReviewSubmissionModalProps) {
  useModalLock(isOpen, onClose);
  const { reviewSubmission, isLoading } = useSubmissionsStore();
  
  const [feedback, setFeedback] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<"APPROVED" | "NEEDS_IMPROVEMENT" | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Reset state when submission changes - this is a valid use case for setState in effect
  useEffect(() => {
    if (submission) {
       
      setFeedback("");
       
      setSelectedStatus(null);
       
      setIsPlaying(false);
       
      setError(null);

      setAudioError(null);

      setAudioLoading(false);
    }
  }, [submission]);

  const togglePlay = async () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        try {
          setAudioError(null);
          setAudioLoading(true);
          await audioRef.current.play();
          setIsPlaying(true);
        } catch {
          setAudioError("Could not play audio. The file may be unavailable or in an unsupported format.");
          setIsPlaying(false);
        } finally {
          setAudioLoading(false);
        }
      }
    }
  };

  const handleAudioError = () => {
    setIsPlaying(false);
    setAudioLoading(false);
    setAudioError("Failed to load audio. The file may not exist or the server returned an error.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submission || !selectedStatus) return;
    
    setError(null);

    const result = await reviewSubmission(submission.id, {
      status: selectedStatus,
      feedback: feedback.trim() || "",
    });

    if (result.success) {
      onClose();
    } else {
      setError(result.message || "Error submitting review");
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  if (!submission) return null;

  const studentName = submission.studentName;
  const studentInitial = submission.studentName?.charAt(0) || "?";
  const isAlreadyReviewed = submission.status !== "PENDING";

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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-brand-primary/10 flex items-center justify-center overflow-hidden">
                  <span className="font-bold text-brand-primary">{studentInitial}</span>
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-gray-900">{studentName}</h2>
                  <p className="text-xs text-gray-500">
                          Submitted {new Date(submission.submittedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button onClick={handleClose} className="rounded-full p-2 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="mx-6 mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="p-6 space-y-6">
              {/* Challenge Context */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Challenge</h3>
                <p className="font-bold text-gray-900">{submission.challengeTitle}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${
                    submission.challengeType === "AUDIO" 
                      ? "bg-purple-100 text-purple-700" 
                      : "bg-blue-100 text-blue-700"
                  }`}>
                    {submission.challengeType}
                  </span>
                </div>
              </div>

              {/* Audio Player (for audio submissions) */}
              {submission.challengeType === "AUDIO" && submission.fileUrl && (
                <div className="flex flex-col items-center justify-center py-4 space-y-3">
                  {audioError && (
                    <div className="w-full rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 text-center">
                      {audioError}
                    </div>
                  )}

                  <div className="relative">
                    {/* Visualizer Placeholder */}
                    <div className="flex items-center gap-1 h-8">
                      {[...Array(20)].map((_, i) => (
                        <motion.div
                          // eslint-disable-next-line react/no-array-index-key
                          key={`visualizer-bar-${i}`}
                          animate={{ height: isPlaying ? [10, 24, 8, 16, 10] : 8 }}
                          transition={{ 
                            duration: 0.5, 
                            repeat: Infinity, 
                            repeatType: "reverse",
                            delay: i * 0.05, 
                          }}
                          className={`w-1 rounded-full ${isPlaying ? "bg-brand-primary" : audioError ? "bg-red-300" : "bg-gray-300"}`}
                        />
                      ))}
                    </div>
                  </div>
                       
                  <audio 
                    ref={audioRef} 
                    src={submission.fileUrl} 
                    onEnded={() => setIsPlaying(false)}
                    onError={handleAudioError}
                    preload="metadata"
                    className="hidden"
                  />
                       
                  <button 
                    onClick={togglePlay}
                    disabled={audioLoading}
                    className="flex items-center gap-2 px-6 py-2 bg-brand-primary text-white rounded-full font-bold hover:bg-brand-primary/90 transition-all shadow-lg shadow-brand-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {audioLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    {audioLoading ? "Loading..." : isPlaying ? "Pause Audio" : "Play Submission"}
                  </button>
                </div>
              )}

              {/* Quiz submission - show questions and answers */}
              {submission.challengeType === "MULTIPLE_CHOICE" && submission.questions && (
                <div className="space-y-4">
                  {submission.score !== null && (
                    <div className={`rounded-xl p-4 border ${
                      submission.score >= 70 
                        ? "bg-green-50 border-green-200" 
                        : "bg-amber-50 border-amber-200"
                    }`}>
                      <h3 className="text-xs font-bold uppercase tracking-wider mb-1 text-gray-500">Quiz Score</h3>
                      <p className={`text-2xl font-bold ${submission.score >= 70 ? "text-green-700" : "text-amber-700"}`}>
                        {submission.score}%
                        <span className="text-sm font-normal ml-2">
                          {submission.score >= 70 ? "Passed" : "Needs Improvement"}
                        </span>
                      </p>
                    </div>
                  )}
                  {submission.questions.map((question, qIdx) => {
                    const userAnswer = submission.answers?.find(
                      (a: { questionId: number; selectedOption: number }) => a.questionId === question.id,
                    );
                    const isCorrect = userAnswer?.selectedOption === question.correctAnswer;
                    return (
                      <div key={question.id || qIdx} className="rounded-xl border border-gray-200 p-4 space-y-2">
                        <div className="flex items-start gap-2">
                          {userAnswer ? (
                            isCorrect ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                            )
                          ) : (
                            <span className="h-5 w-5 rounded-full border-2 border-gray-300 mt-0.5 shrink-0 inline-block" />
                          )}
                          <p className="font-semibold text-gray-900 text-sm">{qIdx + 1}. {question.text}</p>
                        </div>
                        <div className="ml-7 space-y-1">
                          {question.options.map((opt: string, optIdx: number) => {
                            const isUserChoice = userAnswer?.selectedOption === optIdx;
                            const isCorrectOption = question.correctAnswer === optIdx;
                            let optClass = "bg-white border-gray-200 text-gray-700";
                            if (isCorrectOption) optClass = "bg-green-50 border-green-300 text-green-800";
                            if (isUserChoice && !isCorrect) optClass = "bg-red-50 border-red-300 text-red-800";
                            return (
                              <div key={`q${question.id}-${opt}`} className={`rounded-lg border px-3 py-1.5 text-sm ${optClass}`}>
                                {isUserChoice && "→ "}{opt}
                                {isCorrectOption && <span className="ml-1 text-xs font-bold">(correct)</span>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Quiz submission without questions data */}
              {submission.challengeType === "MULTIPLE_CHOICE" && !submission.questions && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Quiz Submission</h3>
                  <p className="text-sm text-gray-600">
                    {submission.score !== null ? `Score: ${submission.score}%` : "Quiz data not available."}
                  </p>
                </div>
              )}

              {/* Review Form or Read-only Feedback */}
              {isAlreadyReviewed ? (
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-3">
                      Review Decision
                    </label>
                    <div className={`flex items-center gap-2 p-4 rounded-xl border-2 ${
                      submission.status === "APPROVED"
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-amber-500 bg-amber-50 text-amber-700"
                    }`}>
                      {submission.status === "APPROVED" ? (
                        <ThumbsUp className="h-5 w-5" />
                      ) : (
                        <AlertTriangle className="h-5 w-5" />
                      )}
                      <span className="font-bold">
                        {submission.status === "APPROVED" ? "Approved" : "Needs Improvement"}
                      </span>
                    </div>
                  </div>
                  {submission.feedback && (
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">
                        Feedback
                      </label>
                      <div className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 whitespace-pre-wrap">
                        {submission.feedback}
                      </div>
                    </div>
                  )}
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="rounded-xl px-6 py-2 font-semibold text-gray-600 hover:bg-gray-200"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t border-gray-100">
                  {/* Status Selection */}
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-3">
                        Review Decision
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedStatus("APPROVED")}
                        className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                          selectedStatus === "APPROVED"
                            ? "border-green-500 bg-green-50 text-green-700"
                            : "border-gray-200 hover:border-green-200 text-gray-600"
                        }`}
                      >
                        <ThumbsUp className="h-5 w-5" />
                        <span className="font-bold">Approve</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedStatus("NEEDS_IMPROVEMENT")}
                        className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                          selectedStatus === "NEEDS_IMPROVEMENT"
                            ? "border-amber-500 bg-amber-50 text-amber-700"
                            : "border-gray-200 hover:border-amber-200 text-gray-600"
                        }`}
                      >
                        <AlertTriangle className="h-5 w-5" />
                        <span className="font-bold">Needs Work</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                           Feedback {selectedStatus === "NEEDS_IMPROVEMENT" && <span className="text-red-500">*</span>}
                    </label>
                    <textarea 
                      required={selectedStatus === "NEEDS_IMPROVEMENT"}
                      rows={4}
                      className="w-full rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all"
                      placeholder="Write your constructive feedback here..."
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                    />
                    {selectedStatus === "NEEDS_IMPROVEMENT" && (
                      <p className="text-xs text-gray-500 mt-1">
                            Feedback is required when requesting improvements
                      </p>
                    )}
                  </div>
                    
                  <div className="flex justify-end gap-3">
                    <button 
                      type="button" 
                      onClick={handleClose} 
                      className="rounded-xl px-4 py-2 font-semibold text-gray-600 hover:bg-gray-200"
                    >
                          Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={!selectedStatus || isLoading || (selectedStatus === "NEEDS_IMPROVEMENT" && !feedback.trim())}
                      className="flex items-center gap-2 rounded-xl bg-green-600 px-6 py-2 font-bold text-white transition-all hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                          Submit Review
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
