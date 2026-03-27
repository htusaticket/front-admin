"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Loader2, FileSpreadsheet, AlertCircle, CheckCircle } from "lucide-react";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

import { useModalLock } from "@/hooks/useModalLock";
import { useClassesStore } from "@/store/classes";

interface UploadClassesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedClass {
  title: string;
  type: string;
  date: string;
  startTime: string;
  endTime: string;
  meetLink: string;
  capacity: string;
  description: string;
  materialsLink: string;
}

const VALID_TYPES = ["REGULAR", "WORKSHOP", "WEBINAR", "QA", "MASTERCLASS"];

/**
 * Normalize an Excel date value to YYYY-MM-DD format.
 * Handles: serial numbers (46099), MM/DD/YYYY, DD-MM-YYYY, YYYY-MM-DD, and short formats like 4/1.
 */
function normalizeDate(raw: string | number | undefined): string {
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
  // Handle slash formats: M/D/YYYY or M/D (infer current year)
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
  // Handle dash formats: DD-MM-YYYY
  const dashMatch = str.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dashMatch) {
    const [, day, month, year] = dashMatch;
    return `${year}-${month!.padStart(2, "0")}-${day!.padStart(2, "0")}`;
  }
  return str;
}

/**
 * Normalize an Excel time value to HH:MM format.
 * Handles: decimal fractions of day (0.583333 = 14:00), HH:MM, HH:MM:SS.
 */
function normalizeTime(raw: string | number | undefined): string {
  if (raw === undefined || raw === null || raw === "") return "";
  // Handle Excel time decimal (fraction of a day, e.g. 0.5833 = 14:00)
  if (typeof raw === "number" || (!isNaN(Number(raw)) && Number(raw) >= 0 && Number(raw) < 1)) {
    const num = typeof raw === "number" ? raw : Number(raw);
    if (num >= 0 && num < 1) {
      const totalMinutes = Math.round(num * 24 * 60);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    }
  }
  const str = String(raw).trim();
  // Already HH:MM or HH:MM:SS - normalize to HH:MM
  const timeMatch = str.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (timeMatch) {
    return `${timeMatch[1]!.padStart(2, "0")}:${timeMatch[2]}`;
  }
  // Try parsing as a decimal string like "0.583333333"
  const num = parseFloat(str);
  if (!isNaN(num) && num >= 0 && num < 1) {
    const totalMinutes = Math.round(num * 24 * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }
  return str;
}

export function UploadClassesModal({ isOpen, onClose }: UploadClassesModalProps) {
  useModalLock(isOpen, onClose);
  const { bulkCreateClasses, isLoading } = useClassesStore();

  const [file, setFile] = useState<File | null>(null);
  const [parsedClasses, setParsedClasses] = useState<ParsedClass[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setError(null);
    setFile(selected);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(worksheet, { defval: "", raw: true });

        if (rows.length === 0) {
          setError("The spreadsheet is empty. Add rows with class data.");
          return;
        }

        const classes: ParsedClass[] = rows.map((row) => {
          // Support flexible column names (case-insensitive)
          const get = (keys: string[]) => {
            for (const key of keys) {
              const found = Object.keys(row).find(k => k.toLowerCase().trim() === key.toLowerCase());
              if (found && row[found]) return String(row[found]).trim();
            }
            return "";
          };
          // Get raw values for date and time (may be numbers from Excel)
          const getRaw = (keys: string[]): string | number | undefined => {
            for (const key of keys) {
              const found = Object.keys(row).find(k => k.toLowerCase().trim() === key.toLowerCase());
              if (found && row[found] !== undefined && row[found] !== "") return row[found] as string | number;
            }
            return undefined;
          };

          return {
            title: get(["title", "titulo", "class", "nombre"]),
            type: (get(["type", "tipo"]) || "REGULAR").toUpperCase(),
            date: normalizeDate(getRaw(["date", "fecha"])),
            startTime: normalizeTime(getRaw(["start", "starttime", "start time", "hora inicio", "inicio"])),
            endTime: normalizeTime(getRaw(["end", "endtime", "end time", "hora fin", "fin"])),
            meetLink: get(["link", "meetlink", "meet link", "meet", "zoom", "zoom link"]),
            capacity: get(["capacity", "capacidad", "max", "maxcapacity"]),
            description: get(["description", "descripcion", "desc"]),
            materialsLink: get(["materials", "materialslink", "materiales"]),
          };
        });

        const valid = classes.filter(c => c.title && c.date && c.startTime && c.endTime);

        if (valid.length === 0) {
          setError("No valid rows found. Each row needs at least: Title, Date, Start Time, End Time.");
          return;
        }

        // Validate that no classes are in the past
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const pastClasses = valid.filter(c => {
          // Date is already normalized to YYYY-MM-DD by normalizeDate()
          const classDate = new Date(c.date + "T00:00:00");
          return classDate < today;
        });

        if (pastClasses.length > 0) {
          const pastTitles = pastClasses.slice(0, 3).map(c => `"${c.title}" (${c.date})`).join(", ");
          setError(`Cannot upload classes with past dates. ${pastClasses.length} class(es) have past dates: ${pastTitles}${pastClasses.length > 3 ? "..." : ""}`);
          return;
        }

        setParsedClasses(valid);
      } catch (err) {
        console.error(err);
        setError("Failed to parse the spreadsheet. Make sure it's a valid .xlsx or .csv file.");
      }
    };
    reader.readAsBinaryString(selected);
  }, []);

  const handleSubmit = async () => {
    const classPayloads = parsedClasses.map(cls => {
      const type = VALID_TYPES.includes(cls.type) ? cls.type : "REGULAR";

      // Date is already normalized to YYYY-MM-DD and time to HH:MM by normalizeDate/normalizeTime
      const isoDate = cls.date;
      const startTime = cls.startTime;
      const endTime = cls.endTime;

      // Build ISO date-time strings
      const startISO = `${isoDate}T${startTime}:00.000Z`;
      const endISO = `${isoDate}T${endTime}:00.000Z`;

      return {
        title: cls.title,
        type: type as "REGULAR" | "WORKSHOP" | "WEBINAR" | "QA" | "MASTERCLASS",
        startTime: startISO,
        endTime: endISO,
        meetLink: cls.meetLink || undefined,
        capacityMax: cls.capacity ? parseInt(cls.capacity, 10) : undefined,
        description: cls.description || undefined,
        materialsLink: cls.materialsLink || undefined,
      };
    });

    const result = await bulkCreateClasses(classPayloads);
    if (result.success) {
      toast.success(`${result.created} classes created successfully`);
      handleClose();
    } else {
      toast.error(result.message || "Error creating classes");
    }
  };

  const handleClose = () => {
    setFile(null);
    setParsedClasses([]);
    setError(null);
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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-brand-primary/10 p-2">
                  <FileSpreadsheet className="h-5 w-5 text-brand-primary" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-gray-900">
                    Bulk Upload Classes
                  </h2>
                  <p className="text-xs text-gray-500">Upload an Excel file with class data</p>
                </div>
              </div>
              <button onClick={handleClose} className="rounded-full p-2 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Format guide */}
              <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 text-sm text-blue-700">
                <p className="font-semibold mb-1">Expected columns:</p>
                <p className="text-xs">
                  <strong>Title</strong> (required), <strong>Date</strong> (YYYY-MM-DD, required),{" "}
                  <strong>Start Time</strong> (HH:MM, required), <strong>End Time</strong> (HH:MM, required),{" "}
                  Type, Meet Link, Capacity, Description, Materials Link
                </p>
              </div>

              {/* File Upload */}
              <div className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all ${
                file ? "border-green-500/30 bg-green-50" : "border-gray-200 hover:border-brand-primary/50"
              }`}>
                {!file && (
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    className="absolute inset-0 z-10 cursor-pointer opacity-0"
                  />
                )}
                <Upload className={`h-8 w-8 mb-2 ${file ? "text-green-600" : "text-gray-400"}`} />
                <span className="text-sm font-semibold text-gray-600">
                  {file ? file.name : "Click to upload .xlsx or .csv"}
                </span>
                <span className="text-xs text-gray-400 mt-1">Max 200 classes per file</span>
                {file && (
                  <button
                    type="button"
                    onClick={() => { setFile(null); setParsedClasses([]); setError(null); }}
                    className="mt-3 flex items-center gap-1.5 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-200 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                    Remove file
                  </button>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 p-3 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* Preview */}
              {parsedClasses.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-700">
                      Preview ({parsedClasses.length} classes)
                    </h3>
                    <button
                      onClick={() => { setFile(null); setParsedClasses([]); }}
                      className="text-xs text-red-500 hover:text-red-700 font-semibold"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-2 rounded-xl border border-gray-100 p-3">
                    {parsedClasses.map((cls) => (
                      <div key={`${cls.title}-${cls.date}-${cls.startTime}`} className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-bold text-gray-900 line-clamp-1">{cls.title}</span>
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{cls.type}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                          <span>{cls.date}</span>
                          <span>{cls.startTime} - {cls.endTime}</span>
                          <span>{cls.capacity ? `Cap: ${cls.capacity}` : "Unlimited"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
              <div className="text-xs text-gray-400">
                {parsedClasses.length > 0 && (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-3.5 w-3.5" />
                    {parsedClasses.length} classes ready
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="rounded-xl px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={parsedClasses.length === 0 || isLoading}
                  className="flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-brand-primary/90 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Create {parsedClasses.length} Classes
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
