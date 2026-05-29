"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Calendar, Video, Users, UploadCloud, FileText, Trash2, Loader2 } from "lucide-react";
import { useState, useRef } from "react";

import { useModalLock } from "@/hooks/useModalLock";
import { getLocalZoneLabel, localDateTimeToISO } from "@/lib/utils";
import { useClassesStore } from "@/store/classes";

interface AddClassModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ClassType = "REGULAR" | "WORKSHOP" | "WEBINAR" | "QA" | "MASTERCLASS";

export function AddClassModal({ isOpen, onClose }: AddClassModalProps) {
  useModalLock(isOpen, onClose);
  const { createClass, isLoading } = useClassesStore();
  
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    startTime: "",
    endTime: "",
    meetLink: "",
    maxCapacity: 15,
    isUnlimited: false,
    hasStrike: false,
    type: "REGULAR" as ClassType,
    visibleForSkillBuilderLive: false,
  });
  
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".pptx"];
  const ALLOWED_MIME_TYPES = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const invalid = files.filter(f => {
        const ext = f.name.slice(f.name.lastIndexOf(".")).toLowerCase();
        return !ALLOWED_EXTENSIONS.includes(ext) && !ALLOWED_MIME_TYPES.includes(f.type);
      });
      if (invalid.length > 0) {
        setFormError(`Only PDF, DOCX and PPTX files are allowed. Rejected: ${invalid.map(f => f.name).join(", ")}`);
        e.target.value = "";
        return;
      }
      setFormError(null);
      setAttachedFiles(prev => [...prev, ...files]);
    }
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Times are entered in the admin's LOCAL timezone and converted to the real
    // UTC instant, so each student later sees the class in their own timezone.
    const startTime = localDateTimeToISO(formData.date, formData.startTime);
    const endTime = localDateTimeToISO(formData.date, formData.endTime);
    if (!startTime || !endTime) {
      setFormError("Invalid date or time.");
      return;
    }

    const result = await createClass({
      title: formData.title,
      type: formData.type,
      startTime,
      endTime,
      meetLink: formData.meetLink || undefined,
      capacityMax: formData.isUnlimited ? undefined : formData.maxCapacity,
      description: "",
      visibleForSkillBuilderLive: formData.visibleForSkillBuilderLive,
    });

    if (result.success) {
      // Reset form
      setFormData({
        title: "",
        date: "",
        startTime: "",
        endTime: "",
        meetLink: "",
        maxCapacity: 15,
        isUnlimited: false,
        hasStrike: false,
        type: "REGULAR",
        visibleForSkillBuilderLive: false,
      });
      setAttachedFiles([]);
      onClose();
    } else {
      setFormError(result.message || "Error creating class");
    }
  };

  const handleClose = () => {
    setFormError(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-6"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex flex-none items-center justify-between border-b border-gray-100 px-6 py-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-brand-primary/10 rounded-lg">
                  <Calendar className="h-5 w-5 text-brand-primary" />
                </div>
                <h2 className="font-display text-lg font-bold text-gray-900">
                    Schedule New Class
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="rounded-full p-2 text-gray-500 hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mx-6 mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {formError}
              </div>
            )}

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                      Class Topic / Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Advanced Confirmation"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-brand-cyan-dark focus:ring-2 focus:ring-brand-cyan-dark/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                        Date
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-brand-cyan-dark focus:ring-2 focus:ring-brand-cyan-dark/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                        Class Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({ ...formData, type: e.target.value as ClassType })
                      }
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-brand-cyan-dark focus:ring-2 focus:ring-brand-cyan-dark/20 bg-white"
                    >
                      <option value="REGULAR">Class</option>
                      <option value="WORKSHOP">Workshop</option>
                      <option value="WEBINAR">Webinar</option>
                      <option value="QA">Q&A</option>
                      <option value="MASTERCLASS">Masterclass</option>
                    </select>
                  </div>
                </div>

                <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
                  Times are set in your local time ({getLocalZoneLabel()}).
                  Each student sees the class in their own timezone.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                        Start Time
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.startTime}
                      onChange={(e) => {
                        const newStartTime = e.target.value;
                        const updates: Partial<typeof formData> = { startTime: newStartTime };
                        // Auto-set endTime to +1 hour if endTime is empty or was auto-set
                        if (newStartTime) {
                          const [h, m] = newStartTime.split(":").map(Number);
                          const endH = ((h + 1) % 24).toString().padStart(2, "0");
                          const endM = (m || 0).toString().padStart(2, "0");
                          updates.endTime = `${endH}:${endM}`;
                        }
                        setFormData({ ...formData, ...updates });
                      }}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-brand-cyan-dark focus:ring-2 focus:ring-brand-cyan-dark/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                        End Time
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.endTime}
                      onChange={(e) =>
                        setFormData({ ...formData, endTime: e.target.value })
                      }
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-brand-cyan-dark focus:ring-2 focus:ring-brand-cyan-dark/20"
                    />
                  </div>
                </div>

                <div className="relative">
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                    <div className="flex items-center gap-1.5">
                      <Video className="h-4 w-4 text-brand-primary" />
                        Video Meeting Link
                    </div>
                  </label>
                  <input
                    type="url"
                    placeholder="https://meet.google.com/..."
                    value={formData.meetLink}
                    onChange={(e) =>
                      setFormData({ ...formData, meetLink: e.target.value })
                    }
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-brand-cyan-dark focus:ring-2 focus:ring-brand-cyan-dark/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-brand-primary" />
                          Capacity
                      </div>
                    </label>
                    <div className="flex items-center gap-3">
                      {!formData.isUnlimited && (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            value={formData.maxCapacity}
                            onChange={(e) =>
                              setFormData({ ...formData, maxCapacity: parseInt(e.target.value) })
                            }
                            className="w-20 rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition-all focus:border-brand-cyan-dark focus:ring-2 focus:ring-brand-cyan-dark/20"
                          />
                          <span className="text-sm text-gray-500">students</span>
                        </div>
                      )}
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={formData.isUnlimited}
                          onChange={(e) => setFormData({ ...formData, isUnlimited: e.target.checked })}
                          className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                        />
                        <span className="text-sm font-medium text-gray-700">Unlimited</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                        Attendance Policy
                    </label>
                    <div className="flex items-center h-[42px]">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.hasStrike ? "bg-red-500" : "bg-gray-200"}`}>
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={formData.hasStrike}
                            onChange={(e) => setFormData({...formData, hasStrike: e.target.checked})}
                          />
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.hasStrike ? "translate-x-6" : "translate-x-1"}`} />
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                            Strike on Absence
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
                  
                {/* File Upload Section */}
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                        Class Materials (Optional)
                  </label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer rounded-xl border-2 border-dashed border-gray-200 p-4 transition-all hover:border-brand-primary hover:bg-brand-primary/5 text-center group"
                  >
                    <input 
                      type="file" 
                      multiple 
                      accept=".pdf,.docx,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                      className="hidden" 
                      ref={fileInputRef} 
                      onChange={handleFileChange}
                    />
                    <div className="flex flex-col items-center justify-center gap-1">
                      <div className="p-2 bg-gray-50 rounded-full group-hover:bg-white transition-colors">
                        <UploadCloud className="h-5 w-5 text-gray-400 group-hover:text-brand-primary transition-colors" />
                      </div>
                      <p className="text-sm font-medium text-gray-600">Click to upload documents</p>
                      <p className="text-xs text-gray-400">PDF, DOCX, PPTX supported</p>
                    </div>
                  </div>

                  {/* File List */}
                  {attachedFiles.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {attachedFiles.map((file, fileIndex) => (
                        <div key={file.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <FileText className="h-4 w-4 text-brand-primary flex-none" />
                            <span className="text-sm text-gray-700 truncate">{file.name}</span>
                            <span className="text-xs text-gray-400 flex-none">
                                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                          </div>
                          <button 
                            type="button"
                            onClick={() => removeFile(fileIndex)}
                            className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Skill Builder Live Visibility */}
              <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-3">
                <input
                  type="checkbox"
                  id="visibleForSkillBuilderLive"
                  checked={formData.visibleForSkillBuilderLive}
                  onChange={(e) => setFormData(prev => ({ ...prev, visibleForSkillBuilderLive: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <label htmlFor="visibleForSkillBuilderLive" className="text-sm font-medium text-gray-700">
                  Visible for Skill Builder Live
                </label>
              </div>

              {/* Footer */}
              <div className="flex flex-none items-center justify-end gap-3 bg-white px-6 py-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                    Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-2 rounded-xl bg-brand-primary px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-primary/20 transition-all hover:bg-brand-primary/90 disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                    Schedule Class
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
