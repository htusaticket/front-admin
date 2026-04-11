"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Send, CheckCircle } from "lucide-react";
import { useState } from "react";

import { useModalLock } from "@/hooks/useModalLock";

interface SuggestCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleTitle: string;
}

// Mock students for suggestion
const MOCK_STUDENTS = [
  { id: 1, name: "Jane Cooper", email: "jane@example.com", avatar: "JC" },
  { id: 2, name: "Cody Fisher", email: "cody@example.com", avatar: "CF" },
  { id: 3, name: "Esther Howard", email: "esther@example.com", avatar: "EH" },
  { id: 4, name: "Jenny Wilson", email: "jenny@example.com", avatar: "JW" },
  { id: 5, name: "Kristin Watson", email: "kristin@example.com", avatar: "KW" },
];

export function SuggestCourseModal({ isOpen, onClose, moduleTitle }: SuggestCourseModalProps) {
  useModalLock(isOpen, onClose);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const filteredStudents = MOCK_STUDENTS.filter(student => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSend = () => {
    // Simulate API call
    setTimeout(() => {
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setSelectedStudent(null);
        setSearchQuery("");
        onClose();
      }, 2000);
    }, 500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {isSuccess ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="mb-4 rounded-full bg-green-100 p-3">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-gray-900">Suggestion Sent!</h3>
                <p className="text-gray-500">
                        &quot;{moduleTitle}&quot; has been recommended to the student.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                  <h2 className="font-display text-lg font-bold text-gray-900">
                        Suggest Course
                  </h2>
                  <button
                    onClick={onClose}
                    className="rounded-full p-2 text-gray-500 hover:bg-gray-100 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="p-6">
                  <p className="mb-4 text-sm text-gray-500">
                            Select a student to recommend <span className="font-semibold text-gray-900">&quot;{moduleTitle}&quot;</span> to.
                  </p>

                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search students..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-2 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
                    />
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-2 mb-6">
                    {filteredStudents.map((student) => (
                      <button
                        key={student.id}
                        onClick={() => setSelectedStudent(student.id)}
                        className={`flex w-full items-center gap-3 rounded-xl border p-3 transition-all ${
                          selectedStudent === student.id
                            ? "border-brand-primary bg-brand-primary/5 ring-1 ring-brand-primary"
                            : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
                          {student.avatar}
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-semibold text-gray-900">{student.name}</p>
                          <p className="text-xs text-gray-500">{student.email}</p>
                        </div>
                        {selectedStudent === student.id && (
                          <div className="ml-auto text-brand-primary">
                            <CheckCircle className="h-5 w-5" />
                          </div>
                        )}
                      </button>
                    ))}
                    {filteredStudents.length === 0 && (
                      <p className="text-center text-sm text-gray-500 py-4">No students found.</p>
                    )}
                  </div>

                  <button
                    onClick={handleSend}
                    disabled={!selectedStudent}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-primary px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-primary/20 transition-all hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                  >
                    <Send className="h-4 w-4" />
                            Send Recommendation
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
