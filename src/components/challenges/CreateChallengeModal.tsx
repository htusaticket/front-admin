"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2, Mic, HelpCircle, Loader2 } from "lucide-react";
import { useState } from "react";

import { useModalLock } from "@/hooks/useModalLock";
import { useChallengesStore } from "@/store/challenges";

interface CreateChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Question {
    id: number;
    text: string;
    options: string[];
    correctAnswer: string;
}

export function CreateChallengeModal({ isOpen, onClose }: CreateChallengeModalProps) {
  useModalLock(isOpen, onClose);
  const { createChallenge, isSaving } = useChallengesStore();
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    type: "AUDIO" as "AUDIO" | "MULTIPLE_CHOICE",
    visibleForSkillBuilder: false,
    audioUrl: "",
    questions: [
      { id: 1, text: "", options: ["", "", ""], correctAnswer: "" },
    ] as Question[],
  });

  // Question Management
  const addQuestion = () => {
    const newId = Date.now();
    setFormData({
      ...formData,
      questions: [
        ...formData.questions,
        { id: newId, text: "", options: ["", "", ""], correctAnswer: "" },
      ],
    });
  };

  const removeQuestion = (index: number) => {
    if (formData.questions.length <= 1) return;
    const newQuestions = formData.questions.filter((_, i) => i !== index);
    setFormData({ ...formData, questions: newQuestions });
  };

  const updateQuestion = (index: number, field: keyof Question, value: string | string[]) => {
    const newQuestions = [...formData.questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setFormData({ ...formData, questions: newQuestions });
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const newQuestions = [...formData.questions];
    const newOptions = [...newQuestions[qIndex].options];
    newOptions[oIndex] = value;
    newQuestions[qIndex].options = newOptions;
    setFormData({ ...formData, questions: newQuestions });
  };

  const addOption = (qIndex: number) => {
    const newQuestions = [...formData.questions];
    newQuestions[qIndex].options.push("");
    setFormData({ ...formData, questions: newQuestions });
  };

  const removeOption = (qIndex: number, oIndex: number) => {
    const newQuestions = [...formData.questions];
    newQuestions[qIndex].options = newQuestions[qIndex].options.filter((_, i) => i !== oIndex);
    setFormData({ ...formData, questions: newQuestions });
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.type === "MULTIPLE_CHOICE") {
      // Validate all questions
      for (let i = 0; i < formData.questions.length; i++) {
        const q = formData.questions[i];
        if (!q.text.trim()) {
          alert(`Please enter text for Question ${i + 1}`);
          return;
        }
        if (!q.correctAnswer) {
          alert(`Please select a correct answer for Question ${i + 1}`);
          return;
        }
        if (q.options.some(opt => !opt.trim())) {
          alert(`Please fill in all options for Question ${i + 1}`);
          return;
        }
      }
    }

    // Prepare data for API
    const challengeData = {
      title: formData.title,
      description: formData.description,
      scheduledDate: formData.date,
      type: formData.type,
      visibleForSkillBuilder: formData.visibleForSkillBuilder,
      audioUrl: formData.type === "AUDIO" ? formData.audioUrl : undefined,
      quizQuestions: formData.type === "MULTIPLE_CHOICE" 
        ? formData.questions.map(q => ({
          question: q.text,
          options: q.options,
          correctAnswer: q.correctAnswer,
        }))
        : undefined,
    };
    
    const result = await createChallenge(challengeData);
    
    if (result.success) {
      // Reset form only on success
      setFormData({
        title: "",
        description: "",
        date: "",
        type: "AUDIO",
        visibleForSkillBuilder: false,
        audioUrl: "",
        questions: [{ id: 1, text: "", options: ["", "", ""], correctAnswer: "" }],
      });
      
      onClose();
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
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="font-display text-lg font-bold text-gray-900">New Daily Challenge</h2>
              <button onClick={onClose} className="rounded-full p-2 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Type Selection */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Challenge Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, type: "AUDIO"})}
                    className={`flex items-center justify-center gap-2 rounded-xl border p-3 transition-all ${
                      formData.type === "AUDIO" 
                        ? "border-brand-primary bg-brand-primary/5 text-brand-primary font-bold" 
                        : "border-gray-200 hover:bg-gray-50 text-gray-600"
                    }`}
                  >
                    <Mic className="h-4 w-4" />
                         Audio
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, type: "MULTIPLE_CHOICE"})}
                    className={`flex items-center justify-center gap-2 rounded-xl border p-3 transition-all ${
                      formData.type === "MULTIPLE_CHOICE" 
                        ? "border-brand-primary bg-brand-primary/5 text-brand-primary font-bold" 
                        : "border-gray-200 hover:bg-gray-50 text-gray-600"
                    }`}
                  >
                    <HelpCircle className="h-4 w-4" />
                         Quiz
                  </button>
                </div>
              </div>

              {/* Common Fields */}
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Title</label>
                  <input 
                    type="text" 
                    required
                    className="w-full rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-brand-primary"
                    placeholder={formData.type === "AUDIO" ? "e.g. Listen to Podcast" : "e.g. Weekly Quiz"}
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                  <textarea 
                    required
                    rows={2}
                    className="w-full rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-brand-primary"
                    placeholder="General instructions..."
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Date</label>
                  <input 
                    type="date" 
                    required
                    className="w-full rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-brand-primary"
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                  />
                </div>

                {/* Skill Builder Visibility */}
                <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.visibleForSkillBuilder}
                      onChange={(e) =>
                        setFormData({ ...formData, visibleForSkillBuilder: e.target.checked })
                      }
                      className="h-5 w-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary/20"
                    />
                    <div>
                      <span className="font-semibold text-gray-900">Visible for Skill Builder</span>
                      <p className="text-xs text-gray-500 mt-0.5">
                          Enable this to make the challenge accessible for users with the Skill Builder plan.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Multiple Choice Questions */}
              <AnimatePresence>
                {formData.type === "MULTIPLE_CHOICE" && (
                  <div className="space-y-6 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-bold text-gray-900">Questions</label>
                      <button 
                        type="button"
                        onClick={addQuestion}
                        className="text-xs font-bold text-brand-primary hover:bg-brand-primary/5 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" />
                                   Add Question
                      </button>
                    </div>
                           
                    <div className="space-y-4">
                      {formData.questions.map((q, qIndex) => (
                        <motion.div 
                          key={q.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-xl border border-gray-200 bg-gray-50/50 p-4"
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex-1 space-y-3">
                              <input 
                                type="text"
                                required
                                placeholder={`Question ${qIndex + 1} text`}
                                className="w-full rounded-lg border border-gray-200 p-2.5 text-sm font-medium outline-none focus:border-brand-primary bg-white"
                                value={q.text}
                                onChange={(e) => updateQuestion(qIndex, "text", e.target.value)}
                              />
                                              
                              <div className="pl-2 space-y-2 border-l-2 border-gray-200">
                                {q.options.map((opt, oIndex) => (
                                  <div
                                    // eslint-disable-next-line react/no-array-index-key
                                    key={`option-${q.id}-${oIndex}`}
                                    className="flex gap-2"
                                  >
                                    <div className="flex items-center h-full pt-2.5">
                                      <input 
                                        type="radio" 
                                        name={`correct-${q.id}`} 
                                        checked={q.correctAnswer === opt && opt !== ""}
                                        onChange={() => updateQuestion(qIndex, "correctAnswer", opt)}
                                        className="accent-brand-primary h-4 w-4 cursor-pointer"
                                      />
                                    </div>
                                    <input 
                                      type="text"
                                      value={opt}
                                      onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                                      placeholder={`Option ${oIndex + 1}`}
                                      className="flex-1 rounded-lg border border-gray-200 p-2 text-sm outline-none focus:border-brand-primary bg-white"
                                    />
                                    {q.options.length > 2 && (
                                      <button 
                                        type="button" 
                                        onClick={() => removeOption(qIndex, oIndex)}
                                        className="p-2 text-gray-400 hover:text-red-500"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    )}
                                  </div>
                                ))}
                                <button 
                                  type="button" 
                                  onClick={() => addOption(qIndex)}
                                  className="text-xs font-semibold text-gray-500 hover:text-brand-primary flex items-center gap-1 mt-1 ml-6"
                                >
                                  <Plus className="h-3 w-3" />
                                                      Add Option
                                </button>
                              </div>
                            </div>
                                          
                            {formData.questions.length > 1 && (
                              <button 
                                type="button" 
                                onClick={() => removeQuestion(qIndex)}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </AnimatePresence>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={onClose} disabled={isSaving} className="rounded-xl px-4 py-2 font-semibold text-gray-600 hover:bg-gray-200 disabled:opacity-50">
                      Cancel
                </button>
                <button type="submit" disabled={isSaving} className="flex items-center gap-2 rounded-xl bg-brand-primary px-6 py-2 font-bold text-white transition-all hover:bg-brand-primary/90 disabled:opacity-50">
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {isSaving ? "Creating..." : "Create Challenge"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
