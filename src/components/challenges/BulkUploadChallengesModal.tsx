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
  const [visibleForSkillBuilderLive, setVisibleForSkillBuilderLive] = useState(false);

  const REQUIRED_HEADERS = ["date", "title", "description", "type"];
  const VALID_TYPES = ["Audio", "MultipleChoice", "AUDIO", "MULTIPLE_CHOICE"];
  const MAX_CHALLENGES = 30;

  const normalizeDate = (raw: string | number | undefined): string => {
    if (raw === undefined || raw === null || raw === "") return "";
    // Handle Excel serial date numbers (e.g. 46099)
    if (typeof raw === "number" || (!isNaN(Number(raw)) && /^\d{4,5}(\.\d+)?$/.test(String(raw)))) {
      const serial = typeof raw === "number" ? raw : Number(raw);
      const d = new Date(Date.UTC(1899, 11, 30) + serial * 86400000);
      return d.toISOString().split("T")[0];
    }
    const str = String(raw).trim();
    // Already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    // Handle slash formats: M/D/YYYY or M/D (US format from Excel)
    const slashMatch = str.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
    if (slashMatch) {
      const [, a, b, c] = slashMatch;
      let year: string;
      if (c) {
        year = c.length === 2 ? `20${c}` : c;
      } else {
        year = String(new Date().getFullYear());
      }
      // Treat as MM/DD/YYYY (US format, which is what Excel uses)
      return `${year}-${a!.padStart(2, "0")}-${b!.padStart(2, "0")}`;
    }
    // DD-MM-YYYY
    const dashMatch = str.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (dashMatch) {
      const [, day, month, year] = dashMatch;
      return `${year}-${month!.padStart(2, "0")}-${day!.padStart(2, "0")}`;
    }
    // YYYY/MM/DD
    const match2 = str.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
    if (match2) {
      const [, year, month, day] = match2;
      return `${year}-${month!.padStart(2, "0")}-${day!.padStart(2, "0")}`;
    }
    return str;
  };

  const isValidDateFormat = (dateStr: string): boolean => {
    return /^\d{4}-\d{2}-\d{2}$/.test(dateStr) && !isNaN(new Date(dateStr).getTime());
  };

  const isPastDate = (dateStr: string): boolean => {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    date.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return date < now;
  };
  const clearFile = () => {
    setFile(null);
    setParsedChallenges([]);
    setError("");
  };
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      // Validate file extension
      const fileExt = selectedFile.name.split(".").pop()?.toLowerCase();
      if (fileExt !== "xlsx" && fileExt !== "xls") {
        setError("Solo se permiten archivos Excel (.xlsx, .xls). Por favor seleccione un archivo con el formato correcto.");
        return;
      }

      setFile(selectedFile);
      setParsing(true);
      setError("");
      setParsedChallenges([]);

      try {
        const arrayBuffer = await selectedFile.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer);
        
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        type ExcelRow = Record<string, string | number | undefined>;
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: true }) as ExcelRow[];

        if (jsonData.length === 0) {
          setError("El archivo Excel está vacío.");
          return;
        }

        // Validate required column headers
        const headers = Object.keys(jsonData[0]).map(h => h.toLowerCase());
        const missingHeaders = REQUIRED_HEADERS.filter(h => !headers.includes(h));
        if (missingHeaders.length > 0) {
          setError(
            "El archivo no tiene la estructura correcta. Columnas requeridas: Date, Title, Description, Type. " +
            "Para challenges tipo MultipleChoice también se requieren: Question, Options, CorrectAnswer.",
          );
          return;
        }

        // Group by Date + Title to handle multi-row questions
        const challengesMap = new Map<string, ParsedChallenge>();

        jsonData.forEach((row: ExcelRow) => {
          const rawDate = row.Date || row.date;
          const date = normalizeDate(rawDate);
          const title = String(row.Title || row.title || "").trim();
          const key = `${date}-${title}`;

          if (!challengesMap.has(key)) {
            challengesMap.set(key, {
              title,
              description: String(row.Description || row.description || ""),
              date,
              type: String(row.Type || row.type || "Audio"),
              questions: [],
            });
          }

          const challenge = challengesMap.get(key)!;
            
          // If MultipleChoice, add question from this row
          if (challenge.type === "MultipleChoice" || challenge.type === "MULTIPLE_CHOICE") {
            const qText = String(row.Question || row.question || "");
            const rawOptions = row.Options || row.options;
            const correctAnswer = String(row.CorrectAnswer || row.correctAnswer || "");
                
            if (qText && rawOptions && correctAnswer) {
              challenge.questions?.push({
                text: qText,
                options: String(rawOptions).split(",").map((o: string) => o.trim()),
                correctAnswer,
              });
            }
          }
        });

        const challenges = Array.from(challengesMap.values());

        // --- Comprehensive Validation ---
        const validationErrors: string[] = [];

        if (challenges.length === 0) {
          validationErrors.push("No se encontraron datos válidos en el archivo Excel.");
        }

        // Max challenges limit
        if (challenges.length > MAX_CHALLENGES) {
          validationErrors.push(
            `El máximo permitido es ${MAX_CHALLENGES} challenges por carga. Se encontraron ${challenges.length}.`,
          );
        }

        // Invalid date formats
        const invalidDates = challenges.filter(c => !isValidDateFormat(c.date));
        if (invalidDates.length > 0) {
          validationErrors.push(
            `Fechas con formato inválido: ${invalidDates.map(c => `"${c.title}" → ${c.date}`).join(", ")}. ` +
            "Use formato DD-MM-YYYY, DD/MM/YYYY o YYYY-MM-DD.",
          );
        }

        // Past dates
        const pastDates = challenges.filter(c => isValidDateFormat(c.date) && isPastDate(c.date));
        if (pastDates.length > 0) {
          validationErrors.push(
            `No se permiten fechas pasadas: ${pastDates.map(c => `"${c.title}" → ${c.date}`).join(", ")}.`,
          );
        }

        // Duplicate dates within the batch
        const dateCount = new Map<string, string[]>();
        challenges.forEach(c => {
          const titles = dateCount.get(c.date) || [];
          titles.push(c.title);
          dateCount.set(c.date, titles);
        });
        const duplicates = Array.from(dateCount.entries()).filter(([, titles]) => titles.length > 1);
        if (duplicates.length > 0) {
          validationErrors.push(
            `Fechas duplicadas (solo 1 challenge diario): ${duplicates.map(([date, titles]) => `${date} (${titles.join(", ")})`).join("; ")}.`,
          );
        }

        // Invalid types
        const invalidTypes = challenges.filter(c => !VALID_TYPES.includes(c.type));
        if (invalidTypes.length > 0) {
          validationErrors.push(
            `Tipos inválidos: ${invalidTypes.map(c => `"${c.title}" → ${c.type}`).join(", ")}. Solo se permiten: Audio, MultipleChoice.`,
          );
        }

        // MultipleChoice without questions
        const mcWithoutQ = challenges.filter(c => 
          (c.type === "MultipleChoice" || c.type === "MULTIPLE_CHOICE") && 
            (!c.questions || c.questions.length === 0),
        );
        if (mcWithoutQ.length > 0) {
          validationErrors.push(
            `Challenges MultipleChoice sin preguntas: ${mcWithoutQ.map(c => `"${c.title}"`).join(", ")}. ` +
            "Requieren columnas: Question, Options, CorrectAnswer.",
          );
        }

        if (validationErrors.length > 0) {
          setError(validationErrors.join("\n"));
        } else {
          setParsedChallenges(challenges);
        }

      } catch (err) {
        console.error(err);
        setError("Error al procesar el archivo Excel. Asegúrese de que sigue la estructura requerida: Date, Title, Description, Type.");
      } finally {
        setParsing(false);
      }
    }
  };

  const handleSubmit = async () => {
    const typeMap: Record<string, "AUDIO" | "MULTIPLE_CHOICE"> = {
      "Audio": "AUDIO",
      "AUDIO": "AUDIO",
      "MultipleChoice": "MULTIPLE_CHOICE",
      "MULTIPLE_CHOICE": "MULTIPLE_CHOICE",
    };

    // CSV CorrectAnswer is a 1-based option number (Excel convention).
    // Returns the 0-based index or -1 if out of range.
    const resolveCorrectIndex = (raw: string, options: string[]): number => {
      const parsed = parseInt(raw.trim(), 10);
      if (isNaN(parsed) || parsed < 1 || parsed > options.length) return -1;
      return parsed - 1;
    };

    const resolutionErrors: string[] = [];
    const challengesToCreate = parsedChallenges.map(c => {
      const isQuiz = c.type === "MultipleChoice" || c.type === "MULTIPLE_CHOICE";
      return {
        title: c.title,
        description: c.description,
        scheduledDate: c.date,
        type: typeMap[c.type] || "AUDIO",
        visibleForSkillBuilder,
        visibleForSkillBuilderLive,
        quizQuestions: isQuiz
          ? c.questions?.map((q, qi) => {
            const idx = resolveCorrectIndex(q.correctAnswer, q.options);
            if (idx < 0) {
              resolutionErrors.push(
                `"${c.title}" - pregunta ${qi + 1}: CorrectAnswer "${q.correctAnswer}" no coincide con ninguna opción.`,
              );
            }
            return {
              question: q.text,
              options: q.options,
              correctAnswer: idx,
            };
          })
          : undefined,
      };
    });

    if (resolutionErrors.length > 0) {
      setError(
        `Se encontraron respuestas correctas que no coinciden con las opciones:\n${ 
          resolutionErrors.join("\n")}`,
      );
      return;
    }

    const result = await bulkCreateChallenges(challengesToCreate);
    
    if (result.failed === 0 && result.created > 0) {
      setParsedChallenges([]);
      setFile(null);
      onClose();
    } else if (result.errors && result.errors.length > 0) {
      setError(result.errors.join("\n"));
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
                {!file && (
                  <input 
                    type="file" 
                    accept=".xlsx, .xls"
                    onChange={handleFileChange}
                    className="absolute inset-0 z-10 cursor-pointer opacity-0"
                  />
                )}
                <div className="mb-3 rounded-full bg-white p-3 shadow-sm">
                  <Upload className="h-8 w-8 text-green-600" />
                </div>
                <p className="font-semibold text-gray-900">
                  {file ? file.name : "Upload Excel File"}
                </p>
                <p className="text-sm text-gray-500">
                    Supports .xlsx, .xls (máx. {MAX_CHALLENGES} challenges)
                </p>
                {file && (
                  <button
                    type="button"
                    onClick={clearFile}
                    className="mt-3 flex items-center gap-1.5 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-200 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                    Quitar archivo
                  </button>
                )}
              </div>

              {/* Required Structure Info */}
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm">
                <p className="font-semibold text-blue-800 mb-2">📋 Estructura requerida del Excel:</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-blue-700">
                  <p><span className="font-medium">Date</span> — Fecha (DD-MM-YYYY, DD/MM/YYYY o YYYY-MM-DD)</p>
                  <p><span className="font-medium">Title</span> — Título del challenge</p>
                  <p><span className="font-medium">Description</span> — Instrucciones</p>
                  <p><span className="font-medium">Type</span> — Audio o MultipleChoice</p>
                </div>
                <p className="text-blue-600 mt-2 text-xs">Para tipo <strong>MultipleChoice</strong> agregar columnas: Question, Options (separadas por coma), CorrectAnswer</p>
              </div>

              {error && (
                <div className="flex gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-600">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div className="space-y-1">
                    {error.split("\n").map((line, i) => (
                      // eslint-disable-next-line react/no-array-index-key
                      <p key={`err-${i}`}>{line}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Skill Builder Visibility - applies to all uploaded challenges */}
              {parsedChallenges.length > 0 && (
                <div className="rounded-xl border border-gray-200 p-4 bg-gray-50 space-y-3">
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
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibleForSkillBuilderLive}
                      onChange={(e) => setVisibleForSkillBuilderLive(e.target.checked)}
                      className="h-5 w-5 rounded border-gray-300 text-teal-600 focus:ring-teal-500/20"
                    />
                    <div>
                      <span className="font-semibold text-gray-900">Visible for Skill Builder Live</span>
                      <p className="text-xs text-gray-500 mt-0.5">
                          Enable this to make all uploaded challenges accessible
                          for users with the Skill Builder Live plan.
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
                          <tr key={`challenge-${c.date}-${c.title}`} className="hover:bg-gray-50/50">
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
                                      <div key={`q-${c.date}-${q.text}`} className="flex gap-2">
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
