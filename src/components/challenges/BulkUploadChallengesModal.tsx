"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Upload, FileSpreadsheet, AlertCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import * as XLSX from "xlsx";

import { useModalLock } from "@/hooks/useModalLock";
import { useChallengesStore } from "@/store/challenges";

interface BulkUploadChallengesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Question {
    text: string;
    options: string[];
    correctAnswer: string;
}

interface ParsedChallenge {
  title: string;
  description: string;
  date: string;
  type: string;
  questions?: Question[]; // For MultipleChoice
}

export function BulkUploadChallengesModal({ isOpen, onClose }: BulkUploadChallengesModalProps) {
  useModalLock(isOpen, onClose);
  const { bulkCreateChallenges, isSaving } = useChallengesStore();
  
  const [file, setFile] = useState<File | null>(null);
  const [parsedChallenges, setParsedChallenges] = useState<ParsedChallenge[]>([]);
  const [error, setError] = useState("");
  const [_parsing, setParsing] = useState(false);
  const [visibleForSkillBuilder, setVisibleForSkillBuilder] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setParsing(true);
      setError("");
      setParsedChallenges([]);

      try {
        const arrayBuffer = await selectedFile.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer);
        
        // Assume first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        type ExcelRow = Record<string, string | number | undefined>;
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as ExcelRow[];
        
        // Group by Date + Title to handle multi-row questions
        const challengesMap = new Map<string, ParsedChallenge>();

        jsonData.forEach((row: ExcelRow) => {
          const date = String(row.Date || row.date || new Date().toISOString().split("T")[0]);
          const title = String(row.Title || row.title || "Untitled");
          const key = `${date}-${title}`;

          if (!challengesMap.has(key)) {
            challengesMap.set(key, {
              title: title,
              description: String(row.Description || row.description || ""),
              date: date,
              type: String(row.Type || row.type || "Audio"),
              questions: [],
            });
          }

          const challenge = challengesMap.get(key)!;
            
          // If MultipleChoice, add question from this row
          if (challenge.type === "MultipleChoice") {
            const qText = String(row.Question || row.question || "Untitled Question");
            const rawOptions = row.Options || row.options;
            const correctAnswer = String(row.CorrectAnswer || row.correctAnswer || "");
                
            if (qText && rawOptions && correctAnswer) {
              challenge.questions?.push({
                text: qText,
                options: String(rawOptions).split(",").map((o: string) => o.trim()),
                correctAnswer: correctAnswer,
              });
            }
          }
        });

        const challenges = Array.from(challengesMap.values());

        // Validation Loop
        const invalid = challenges.find(c => 
          c.type === "MultipleChoice" && 
            (!c.questions || c.questions.length === 0),
        );

        if (invalid) {
          setError("Some Multiple Choice challenges have no valid questions (check columns: Question, Options, CorrectAnswer).");
        } else if (challenges.length === 0) {
          setError("No valid data found in the Excel file.");
        } else {
          setParsedChallenges(challenges);
        }

      } catch (err) {
        console.error(err);
        setError("Failed to parse Excel file. Please ensure it follows the template.");
      } finally {
        setParsing(false);
      }
    }
  };

  const handleSubmit = async () => {
    // Transform parsed challenges to API format
    const challengesToCreate = parsedChallenges.map(c => {
      // Map type to correct format
      const typeMap: Record<string, "AUDIO" | "MULTIPLE_CHOICE" | "WRITING"> = {
        "Audio": "AUDIO",
        "MultipleChoice": "MULTIPLE_CHOICE", 
        "MULTIPLE_CHOICE": "MULTIPLE_CHOICE",
        "Writing": "WRITING",
        "WRITING": "WRITING",
      };
      
      return {
        title: c.title,
        description: c.description,
        scheduledDate: c.date,
        type: typeMap[c.type] || "AUDIO",
        visibleForSkillBuilder,
        quizQuestions: c.type === "MultipleChoice" || c.type === "MULTIPLE_CHOICE"
          ? c.questions?.map(q => ({
            question: q.text,
            options: q.options,
            correctAnswer: q.correctAnswer,
          }))
          : undefined,
      };
    });
    
    await bulkCreateChallenges(challengesToCreate);
    setParsedChallenges([]);
    setFile(null);
    onClose();
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
            className="flex w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-100 rounded-lg text-green-600">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <h2 className="font-display text-lg font-bold text-gray-900">Bulk Upload Challenges</h2>
              </div>
              <button onClick={onClose} className="rounded-full p-2 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* File Input */}
              <div className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all ${
                file ? "border-green-500/30 bg-green-50" : "border-gray-200 hover:border-green-500/50 hover:bg-gray-50"
              }`}>
                <input 
                  type="file" 
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  className="absolute inset-0 z-10 cursor-pointer opacity-0"
                />
                <div className="mb-3 rounded-full bg-white p-3 shadow-sm">
                  <Upload className="h-8 w-8 text-green-600" />
                </div>
                <p className="font-semibold text-gray-900">
                  {file ? file.name : "Upload Excel File"}
                </p>
                <p className="text-sm text-gray-500">
                    Supports .xlsx, .xls
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              {/* Skill Builder Visibility - applies to all uploaded challenges */}
              {parsedChallenges.length > 0 && (
                <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibleForSkillBuilder}
                      onChange={(e) => setVisibleForSkillBuilder(e.target.checked)}
                      className="h-5 w-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary/20"
                    />
                    <div>
                      <span className="font-semibold text-gray-900">Visible for Skill Builder</span>
                      <p className="text-xs text-gray-500 mt-0.5">
                          Enable this to make all uploaded challenges accessible for users with the Skill Builder plan.
                      </p>
                    </div>
                  </label>
                </div>
              )}
                 
              {/* Preview Table */}
              {parsedChallenges.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-900">Preview ({parsedChallenges.length} Challenges)</h3>
                  </div>
                  <div className="rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 text-gray-500 font-medium">
                        <tr>
                          <th className="px-4 py-2">Date</th>
                          <th className="px-4 py-2">Type</th>
                          <th className="px-4 py-2">Title</th>
                          <th className="px-4 py-2">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {parsedChallenges.map((c) => (
                          <tr key={`${c.date}-${c.title}`} className="hover:bg-gray-50/50">
                            <td className="px-4 py-2 font-medium text-gray-900">{c.date}</td>
                            <td className="px-4 py-2">
                              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                c.type === "MultipleChoice" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                              }`}>
                                {c.type}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-gray-600">{c.title}</td>
                            <td className="px-4 py-2 text-gray-500 text-xs">
                              {c.type === "MultipleChoice" 
                                ? (
                                  <div className="space-y-1">
                                    {c.questions?.map((q, qIdx) => (
                                      <div key={q.text || `q-${qIdx}`} className="flex gap-2">
                                        <span className="font-medium">Q{qIdx+1}:</span> {q.text} 
                                        <span className="text-gray-400">({q.options.length} opts)</span>
                                      </div>
                                    ))}
                                  </div>
                                )
                                : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4">
              <button onClick={onClose} disabled={isSaving} className="rounded-xl px-4 py-2 font-semibold text-gray-600 hover:bg-gray-200 disabled:opacity-50">
                  Cancel
              </button>
              <button 
                disabled={parsedChallenges.length === 0 || isSaving}
                onClick={handleSubmit}
                className="flex items-center gap-2 rounded-xl bg-brand-primary px-6 py-2 font-bold text-white transition-all hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                {isSaving ? "Importing..." : "Import Challenges"}
              </button>
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
