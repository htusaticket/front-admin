"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Upload, FileText, AlertCircle, Loader2 } from "lucide-react";
import mammoth from "mammoth";
import { useState } from "react";

import { useModalLock } from "@/hooks/useModalLock";
import { useJobsStore } from "@/store/jobs";

interface UploadJobsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedJob {
  title: string;
  name: string;
  email: string;
  website: string;
  social: string;
  recruiterSocial: string;
  offer: string;
  revenue: string;
  hiring: string;
  ote: string;
  closerOte: string;
  csmOte: string;
  setterOte: string;
  dmSetterOte: string;
  managerOte: string;
  notes: string;
  code: string;
}

export function UploadJobsModal({ isOpen, onClose }: UploadJobsModalProps) {
  useModalLock(isOpen, onClose);
  const { bulkCreateJobs, isSaving } = useJobsStore();
  
  const [file, setFile] = useState<File | null>(null);
  const [parsedJobs, setParsedJobs] = useState<ParsedJob[]>([]);
  const [_parsing, setParsing] = useState(false);
  const [error, setError] = useState("");

  const parseText = (text: string) => {
    try {
      const jobs: ParsedJob[] = [];

      // Ordered longest-first so "Closer OTE" beats plain "OTE" in alternation.
      const FIELD_KEYS = [
        "DM Setter OTE",
        "Recruiter Social",
        "Closer OTE",
        "Setter OTE",
        "Manager OTE",
        "Biz Social",
        "CSM OTE",
        "Website",
        "Revenue",
        "Hiring",
        "Offer",
        "Email",
        "Notes",
        "Name",
        "Social",
        "OTE",
      ];
      const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const fieldKeyRegex = new RegExp(
        `\\b(${FIELD_KEYS.map(escapeRe).join("|")}):\\s*`,
        "gi",
      );

      // Block boundaries: each job ends with CODE: XXXXX
      const jobBlockRegex = /([\s\S]*?)(?:Apply Here\s*[-–—]\s*)?CODE:\s*(\d+)/gi;

      let match;
      while ((match = jobBlockRegex.exec(text)) !== null) {
        const rawBlock = match[1];
        const code = match[2];

        // Strip leading/trailing separator lines like "-", "---", "===", "—", etc.
        const blockContent = rawBlock
          .replace(/^[\s\-–—_=*]+/u, "")
          .replace(/[\s\-–—_=*]+$/u, "")
          .trim();

        if (!blockContent) continue;

        // Find all field keys in the block (works regardless of newlines)
        const keyMatches = [...blockContent.matchAll(fieldKeyRegex)];

        // Title = first non-empty line of whatever comes before the first field key.
        // Falls back to first line of the whole block if no keys were found.
        const preKey = keyMatches.length > 0
          ? blockContent.slice(0, keyMatches[0].index ?? 0)
          : blockContent;
        const title = preKey
          .split("\n")
          .map(l => l.trim())
          .filter(Boolean)[0] ?? "";

        // Build fieldMap by slicing the block between consecutive key starts.
        const fieldMap: Record<string, string> = {};
        for (let i = 0; i < keyMatches.length; i++) {
          const current = keyMatches[i];
          const key = current[1].toLowerCase();
          const valueStart = (current.index ?? 0) + current[0].length;
          const next = keyMatches[i + 1];
          const valueEnd = next ? (next.index ?? blockContent.length) : blockContent.length;
          fieldMap[key] = blockContent.slice(valueStart, valueEnd).trim();
        }
        const get = (k: string) => fieldMap[k.toLowerCase()] ?? "";

        jobs.push({
          title,
          name: get("Name"),
          email: get("Email"),
          website: get("Website"),
          social: get("Social") || get("Biz Social"),
          recruiterSocial: get("Recruiter Social"),
          offer: get("Offer"),
          revenue: get("Revenue"),
          hiring: get("Hiring"),
          ote: get("OTE"),
          closerOte: get("Closer OTE"),
          csmOte: get("CSM OTE"),
          setterOte: get("Setter OTE"),
          dmSetterOte: get("DM Setter OTE"),
          managerOte: get("Manager OTE"),
          notes: get("Notes"),
          code,
        });
      }

      setParsedJobs(jobs);
      if (jobs.length === 0) {
        setError("No job offers found. Make sure each job ends with CODE: XXXXX");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to parse the file content. Ensure it matches the expected format.");
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const lower = selectedFile.name.toLowerCase();

      // .doc (legacy binary) is unsupported — mammoth only handles .docx
      // and reading .doc as text yields binary garbage.
      if (lower.endsWith(".doc")) {
        setError(
          "Formato .doc antiguo no soportado. Abrí el archivo en Word y guardalo como .docx (o exportalo a .txt).",
        );
        return;
      }
      if (!lower.endsWith(".docx") && !lower.endsWith(".txt")) {
        setError("Formato no soportado. Subí un archivo .docx o .txt.");
        return;
      }

      setFile(selectedFile);
      setParsing(true);
      setError("");

      try {
        let text = "";

        if (lower.endsWith(".docx")) {
          const arrayBuffer = await selectedFile.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          text = result.value;
          if (result.messages.length > 0) {
            console.warn("Mammoth messages:", result.messages);
          }
        } else {
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
    const jobsToCreate = parsedJobs.map(job => {
      // Collect all OTE values for parsing min/max
      const allOteStrings = [
        job.ote, job.closerOte, job.csmOte,
        job.setterOte, job.dmSetterOte, job.managerOte,
      ].filter(Boolean);
      const allOteNumbers: number[] = [];
      for (const oteStr of allOteStrings) {
        const nums = oteStr.match(/[\d,]+/g)?.map(n => parseInt(n.replace(/,/g, ""), 10)).filter(n => !isNaN(n));
        if (nums) allOteNumbers.push(...nums);
      }

      let oteMin: number | undefined;
      let oteMax: number | undefined;
      if (allOteNumbers.length >= 2) {
        oteMin = Math.min(...allOteNumbers);
        oteMax = Math.max(...allOteNumbers);
      } else if (allOteNumbers.length === 1) {
        oteMin = allOteNumbers[0];
        oteMax = allOteNumbers[0];
      }

      // Build salary range string - clean min/max format for display
      let salaryRange: string | undefined;
      if (oteMin && oteMax && oteMin !== oteMax) {
        salaryRange = `$${oteMin.toLocaleString()} - $${oteMax.toLocaleString()}/Mo`;
      } else if (oteMin) {
        salaryRange = `$${oteMin.toLocaleString()}/Mo`;
      } else if (job.ote) {
        salaryRange = job.ote;
      }

      // Build detailed OTE breakdown for description
      const oteParts: string[] = [];
      if (job.closerOte) oteParts.push(`Closer OTE: ${job.closerOte}`);
      if (job.csmOte) oteParts.push(`CSM OTE: ${job.csmOte}`);
      if (job.setterOte) oteParts.push(`Setter OTE: ${job.setterOte}`);
      if (job.dmSetterOte) oteParts.push(`DM Setter OTE: ${job.dmSetterOte}`);
      if (job.managerOte) oteParts.push(`Manager OTE: ${job.managerOte}`);
      if (job.ote && oteParts.length === 0) oteParts.push(`OTE: ${job.ote}`);

      // Parse revenue
      let revenue: number | undefined;
      if (job.revenue) {
        const revenueNum = parseInt(job.revenue.replace(/[^0-9]/g, ""), 10);
        if (!isNaN(revenueNum)) revenue = revenueNum;
      }

      // Build clean description
      const descParts: string[] = [];
      if (job.offer) descParts.push(job.offer);
      if (job.revenue) descParts.push(`Revenue: ${job.revenue}`);
      if (oteParts.length > 0) {
        descParts.push("");
        descParts.push("Compensation Breakdown:");
        descParts.push(...oteParts);
      }
      if (job.notes) {
        descParts.push("");
        descParts.push(job.notes);
      }
      const description = descParts.join("\n") || "Job offer from bulk upload";

      return {
        title: job.title,
        company: job.name || "Unknown",
        description,
        type: job.hiring || "Setter",
        salaryRange,
        oteMin,
        oteMax,
        revenue,
        requirements: [],
        social: job.social || undefined,
        recruiterSocial: job.recruiterSocial || undefined,
        website: job.website || undefined,
        email: job.email || undefined,
        code: job.code || undefined,
      };
    });
    
    // Reverse so the first offer in the doc (newest) is created last
    // and appears on top in the CRM (which orders by createdAt desc).
    await bulkCreateJobs([...jobsToCreate].reverse());
    setParsedJobs([]);
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
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
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
                file ? "border-green-500/30 bg-green-50" : "border-gray-200 hover:border-brand-primary/50 hover:bg-gray-50"
              }`}>
                {!file && (
                  <input 
                    type="file" 
                    accept=".txt,.doc,.docx"
                    onChange={handleFileChange}
                    className="absolute inset-0 z-10 cursor-pointer opacity-0"
                  />
                )}
                <div className="mb-3 rounded-full bg-white p-3 shadow-sm">
                  <FileText className={`h-8 w-8 ${file ? "text-green-600" : "text-brand-primary"}`} />
                </div>
                <p className="font-semibold text-gray-900">
                  {file ? file.name : "Click to upload document"}
                </p>
                <p className="text-sm text-gray-500">
                    Supports .docx, .doc, .txt
                </p>
                {file && (
                  <button
                    type="button"
                    onClick={() => { setFile(null); setParsedJobs([]); setError(""); }}
                    className="mt-3 flex items-center gap-1.5 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-200 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                    Remove file
                  </button>
                )}
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
                        <p className="text-xs text-gray-500 mb-1">{job.name || "No name"}</p>
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                          <span>Role: {job.hiring || "-"}</span>
                          <span>OTE: {job.ote || job.closerOte || job.setterOte || "-"}</span>
                          {job.social && <span className="truncate">Social: {job.social}</span>}
                          {job.recruiterSocial && <span className="truncate">Recruiter: {job.recruiterSocial}</span>}
                          {job.website && <span className="truncate">Web: {job.website}</span>}
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}
