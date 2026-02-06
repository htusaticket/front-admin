"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Play, Pause, AlertCircle, CheckCircle2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface Submission {
    id: number;
    studentName: string;
    studentAvatar?: string;
    challengeTitle: string;
    challengeDescription: string;
    submittedAt: string;
    audioUrl?: string; // Mock URL for now
    status: 'Pending' | 'Reviewed';
}

interface ReviewSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: Submission | null;
  onSubmitFeedback: (id: number, feedback: string) => void;
}

export function ReviewSubmissionModal({ isOpen, onClose, submission, onSubmitFeedback }: ReviewSubmissionModalProps) {
  const [feedback, setFeedback] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Reset state when submission changes
  useEffect(() => {
    if (submission) {
        setFeedback("");
        setIsPlaying(false);
    }
  }, [submission]);

  const togglePlay = () => {
    if (audioRef.current) {
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!submission) return;
    
    onSubmitFeedback(submission.id, feedback);
    onClose();
  };

  if (!submission) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                        {submission.studentAvatar ? (
                           <img src={submission.studentAvatar} alt={submission.studentName} className="h-full w-full object-cover"/>
                        ) : (
                           <span className="font-bold text-gray-400">{submission.studentName.charAt(0)}</span>
                        )}
                    </div>
                    <div>
                        <h2 className="font-display text-lg font-bold text-gray-900">{submission.studentName}</h2>
                        <p className="text-xs text-gray-500">Submitted {submission.submittedAt}</p>
                    </div>
                </div>
                <button onClick={onClose} className="rounded-full p-2 hover:bg-gray-100">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                 {/* Challenge Context */}
                 <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Challenge</h3>
                    <p className="font-bold text-gray-900">{submission.challengeTitle}</p>
                    <p className="text-sm text-gray-600 mt-1">{submission.challengeDescription}</p>
                 </div>

                 {/* Audio Player */}
                 <div className="flex flex-col items-center justify-center py-4 space-y-3">
                     <div className="relative">
                         {/* Visualizer Placeholder */}
                         <div className="flex items-center gap-1 h-8">
                             {[...Array(20)].map((_, i) => (
                                 <motion.div 
                                    key={i}
                                    animate={{ height: isPlaying ? [10, 24, 8, 16, 10] : 8 }}
                                    transition={{ 
                                        duration: 0.5, 
                                        repeat: Infinity, 
                                        repeatType: "reverse",
                                        delay: i * 0.05 
                                    }}
                                    className={`w-1 rounded-full ${isPlaying ? 'bg-brand-primary' : 'bg-gray-300'}`}
                                 />
                             ))}
                         </div>
                     </div>
                     
                     <audio 
                       ref={audioRef} 
                       src={submission.audioUrl || "https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav"} 
                       onEnded={() => setIsPlaying(false)}
                       className="hidden"
                     />
                     
                     <button 
                       onClick={togglePlay}
                       className="flex items-center gap-2 px-6 py-2 bg-brand-primary text-white rounded-full font-bold hover:bg-brand-primary/90 transition-all shadow-lg shadow-brand-primary/20"
                     >
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        {isPlaying ? "Pause Audio" : "Play Submission"}
                     </button>
                 </div>

                 {/* Feedback Form */}
                 <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t border-gray-100">
                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">
                           Your Feedback
                        </label>
                        <textarea 
                           required
                           rows={4}
                           className="w-full rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all"
                           placeholder="Write your constructive feedback here..."
                           value={feedback}
                           onChange={(e) => setFeedback(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 font-semibold text-gray-600 hover:bg-gray-200">
                          Cancel
                        </button>
                        <button 
                          type="submit" 
                          disabled={!feedback.trim()}
                          className="flex items-center gap-2 rounded-xl bg-green-600 px-6 py-2 font-bold text-white transition-all hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Send className="h-4 w-4" />
                          Send Feedback
                        </button>
                    </div>
                 </form>
              </div>

            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
