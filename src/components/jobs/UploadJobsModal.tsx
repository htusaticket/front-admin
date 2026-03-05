"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Upload, FileText, AlertCircle, Loader2 } from "lucide-react";
import mammoth from "mammoth";
import { useState } from "react";

import { useJobsStore } from "@/store/jobs";

interface UploadJobsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedJob {
  title: string;
  name: string;
  social: string;
  offer: string;
  revenue: string;
  hiring: string;
  ote: string;
  notes: string;
  code: string;
}

export function UploadJobsModal({ isOpen, onClose }: UploadJobsModalProps) {
  const { bulkCreateJobs, isSaving } = useJobsStore();
  
  const [file, setFile] = useState<File | null>(null);
  const [parsedJobs, setParsedJobs] = useState<ParsedJob[]>([]);
  const [_parsing, setParsing] = useState(false);
  const [error, setError] = useState("");

  const parseText = (text: string) => {
    try {
      // Split by double newlines or look for patterns roughly
      // The structure seems to end with "Apply Here - CODE: XXXXX"
      // We can split by that pattern to separate jobs, then parse lines.
      
      const jobs: ParsedJob[] = [];
      const _blocks = text.split(/Apply Here - CODE: \d+/i);
      
      // Get all codes to match back to blocks if needed, or just split regex keeping delimiters
      // Let's rely on a simpler block split by double newline chunks and keywords.
      
      // Better approach: Split by the full separator that seems consistent?
      // Actually, let's process line by line or regex match for each job block.
      
      // Regex to capture full blocks ending in code
      const jobBlockRegex = /([\s\S]*?)Apply Here - CODE: (\d+)/g;
      
      let match;
      while ((match = jobBlockRegex.exec(text)) !== null) {
        const blockContent = match[1].trim();
        const code = match[2];
        
        const lines = blockContent.split("\n").map(l => l.trim()).filter(l => l);
        
        if (lines.length === 0) continue;

        // Extract Title (First Line)
        const title = lines[0];
        
        // Helper to extract value by key
        const getValue = (key: string) => {
          const line = lines.find(l => l.toLowerCase().startsWith(`${key.toLowerCase()}:`));
          return line ? line.substring(key.length + 1).trim() : "";
        };

        jobs.push({
          title: title,
          name: getValue("Name"),
          social: getValue("Social") || getValue("Biz Social") || getValue("Website"),
          offer: getValue("Offer"),
          revenue: getValue("Revenue"),
          hiring: getValue("Hiring"),
          ote: getValue("OTE") || `${getValue("Closer OTE")} / ${getValue("Setter OTE")}`, // Handle composite
          notes: getValue("Notes"),
          code: code,
        });
      }

      setParsedJobs(jobs);
    } catch (err) {
      console.error(err);
      setError("Failed to parse the file content. Ensure it matches the expected format.");
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setParsing(true);
      setError("");

      setParsing(true);
      setError("");

      try {
        let text = "";
        
        if (selectedFile.name.endsWith(".docx")) {
          const arrayBuffer = await selectedFile.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          text = result.value;
          if (result.messages.length > 0) {
            console.warn("Mammoth messages:", result.messages);
          }
        } else {
          // Fallback for txt
          text = await selectedFile.text();
        }

        parseText(text);
      } catch (err) {
        console.error("File processing error:", err);
        setError("Error processing file. Please ensure it is a valid .docx or .txt file.");
      } finally {
        setParsing(false);
      }
    }
  };

  const handleSubmit = async () => {
    // Transform parsed jobs to API format
    const jobsToCreate = parsedJobs.map(job => ({
      title: job.title,
      company: job.name || "Unknown Company",
      location: "Remote", // Default, would need parsing if provided
      description: job.offer || job.notes || "Job offer from bulk upload",
      type: job.hiring || "Full-time",
      salaryRange: job.ote || undefined,
      requirements: job.offer ? [job.offer] : [],
    }));
    
    await bulkCreateJobs(jobsToCreate);
    setParsedJobs([]);
    setFile(null);
    onClose();
  };

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
              className="flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-brand-primary/10 rounded-lg">
                    <Upload className="h-5 w-5 text-brand-primary" />
                  </div>
                  <h2 className="font-display text-lg font-bold text-gray-900">Upload Job Offers</h2>
                </div>
                <button onClick={onClose} className="rounded-full p-2 hover:bg-gray-100"><X className="h-5 w-5" /></button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* File Input */}
                <div className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all ${
                  file ? "border-brand-primary/30 bg-brand-primary/5" : "border-gray-200 hover:border-brand-primary/50 hover:bg-gray-50"
                }`}>
                  <input 
                    type="file" 
                    accept=".txt,.doc,.docx" // Allowing txt for easy testing
                    onChange={handleFileChange}
                    className="absolute inset-0 z-10 cursor-pointer opacity-0"
                  />
                  <div className="mb-3 rounded-full bg-white p-3 shadow-sm">
                    <FileText className="h-8 w-8 text-brand-primary" />
                  </div>
                  <p className="font-semibold text-gray-900">
                    {file ? file.name : "Click to upload document"}
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports .docx, .doc, .txt
                  </p>
                </div>

                {error && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}

                {/* Parsing Results Preview */}
                {parsedJobs.length > 0 && (
                  <div className="space-y-4">
                    <div className="rounded-xl bg-green-50 p-4 border border-green-100">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
                          <Check className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-green-900">Analysis Complete</h3>
                          <p className="text-sm text-green-700">
                            Found <span className="font-bold">{parsedJobs.length}</span> valid job offers to upload.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2">
                      {parsedJobs.map((job) => (
                        <div key={job.code} className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-gray-900 line-clamp-1">{job.title}</span>
                            <span className="font-mono text-xs bg-gray-200 px-2 py-0.5 rounded text-gray-600">#{job.code}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                            <span>Role: {job.hiring}</span>
                            <span>OTE: {job.ote}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4">
                <button onClick={onClose} disabled={isSaving} className="rounded-xl px-4 py-2 font-semibold text-gray-600 hover:bg-gray-200 disabled:opacity-50">
                  Cancel
                </button>
                <button 
                  disabled={parsedJobs.length === 0 || isSaving}
                  onClick={handleSubmit}
                  className="flex items-center gap-2 rounded-xl bg-brand-primary px-6 py-2 font-bold text-white transition-all hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  {isSaving ? "Processing..." : "Process & Upload"}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
