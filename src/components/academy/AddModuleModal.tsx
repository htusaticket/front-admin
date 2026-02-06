"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Check, BookOpen, FileText, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";

interface AddModuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: any; // strict type would be better but using any for quick integration as requested
}

export function AddModuleModal({ isOpen, onClose, initialData }: AddModuleModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    level: "Beginner",
    status: "Draft",
    videoUrl: "",
    previewUrl: "",
    coverImage: null as File | null,
    pdfFiles: [] as File[],
  });

  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        title: initialData.title || "",
        description: initialData.description || "",
        level: initialData.level || "Beginner",
        status: initialData.status || "Draft",
        videoUrl: initialData.videoUrl || "",
        previewUrl: initialData.image || "",
        coverImage: null,
        pdfFiles: initialData.pdfFiles || [],
      });
    } else if (isOpen && !initialData) {
      // Reset form when opening in create mode
      setFormData({
        title: "",
        description: "",
        level: "Beginner",
        status: "Draft",
        videoUrl: "",
        previewUrl: "",
        coverImage: null,
        pdfFiles: [],
      });
    }
  }, [isOpen, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Connect to API
    console.log("Form submitted:", formData);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex flex-none items-center justify-between border-b border-gray-100 px-6 py-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-brand-primary/10 rounded-lg">
                    <BookOpen className="h-5 w-5 text-brand-primary" />
                  </div>
                  <h2 className="font-display text-lg font-bold text-gray-900">
                    {initialData ? "Edit Module" : "Create New Module"}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-full p-2 text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                      Module Title
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Business Communication"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-brand-cyan-dark focus:ring-2 focus:ring-brand-cyan-dark/20"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                      Description
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Brief description of the module content..."
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-brand-cyan-dark focus:ring-2 focus:ring-brand-cyan-dark/20 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                        Difficulty Level
                      </label>
                      <select
                        value={formData.level}
                        onChange={(e) =>
                          setFormData({ ...formData, level: e.target.value })
                        }
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-brand-cyan-dark focus:ring-2 focus:ring-brand-cyan-dark/20 bg-white"
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) =>
                          setFormData({ ...formData, status: e.target.value })
                        }
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-brand-cyan-dark focus:ring-2 focus:ring-brand-cyan-dark/20 bg-white"
                      >
                        <option value="Draft">Draft</option>
                        <option value="Published">Published</option>
                        <option value="Archived">Archived</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                      Video URL (Embedded)
                    </label>
                    <input
                      type="url"
                      placeholder="https://www.youtube.com/embed/..."
                      value={formData.videoUrl}
                      onChange={(e) =>
                        setFormData({ ...formData, videoUrl: e.target.value })
                      }
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-brand-cyan-dark focus:ring-2 focus:ring-brand-cyan-dark/20"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Provide a direct link or embed URL for the module&apos;s main video.
                    </p>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                      Cover Image
                    </label>
                    <div 
                      className={`relative flex items-center justify-center rounded-xl border-2 border-dashed p-6 transition-all ${
                        formData.previewUrl 
                          ? "border-brand-primary/20 bg-brand-primary/5" 
                          : "border-gray-200 hover:border-brand-primary/50 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            // Revoke previous object URL if it exists
                            if (formData.previewUrl && formData.coverImage) {
                              URL.revokeObjectURL(formData.previewUrl);
                            }
                            setFormData({ 
                              ...formData, 
                              coverImage: file,
                              previewUrl: URL.createObjectURL(file)
                            });
                          }
                        }}
                        className="absolute inset-0 cursor-pointer opacity-0 z-10"
                      />
                      <div className="text-center w-full">
                        {formData.previewUrl ? (
                          <div className="relative mx-auto aspect-video w-full max-w-sm overflow-hidden rounded-lg shadow-sm">
                            <img 
                              src={formData.previewUrl} 
                              alt="Preview" 
                              className="h-full w-full object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                              <p className="text-sm font-bold text-white">Click to Change</p>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                              <BookOpen className="h-5 w-5 text-gray-400" />
                            </div>
                            <p className="text-sm font-medium text-gray-600">
                              <span className="text-brand-primary">Click to upload</span>{" "}
                              or drag and drop
                            </p>
                            <p className="mt-1 text-xs text-gray-400">
                              SVG, PNG, JPG or GIF (max. 800x400px)
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                      Additional Resources (PDF)
                    </label>
                    
                    {/* Upload Area */}
                    <div 
                      className={`relative flex items-center justify-center rounded-xl border-dashed border-2 p-6 transition-all ${
                        formData.pdfFiles.length > 0
                          ? "border-brand-primary/20 bg-brand-primary/5" 
                          : "border-gray-200 hover:border-brand-primary/50 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="file"
                        accept=".pdf"
                        multiple
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            const newFiles = Array.from(e.target.files);
                            setFormData(prev => ({ 
                              ...prev, 
                              pdfFiles: [...prev.pdfFiles, ...newFiles]
                            }));
                          }
                        }}
                        className="absolute inset-0 cursor-pointer opacity-0 z-10"
                      />
                      <div className="text-center w-full">
                        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                          <FileText className="h-5 w-5 text-gray-400" />
                        </div>
                        <p className="text-sm font-medium text-gray-600">
                          <span className="text-brand-primary">Click to upload</span>{" "}
                          or drag and drop
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                          PDF files only (max. 10MB)
                        </p>
                      </div>
                    </div>

                    {/* File List */}
                    {formData.pdfFiles.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {formData.pdfFiles.map((file, index) => (
                          <div 
                            key={index}
                            className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
                          >
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div className="flex flex-none h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-600">
                                <FileText className="h-5 w-5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-gray-900 truncate">
                                  {file.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  pdfFiles: prev.pdfFiles.filter((_, i) => i !== index)
                                }));
                              }}
                              className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
          </div>

                {/* Footer */}
                <div className="flex flex-none items-center justify-end gap-3 bg-white px-6 py-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 rounded-xl bg-brand-primary px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-primary/20 transition-all hover:bg-brand-primary/90"
                  >
                    <Check className="h-4 w-4" />
                    {initialData ? "Save Changes" : "Create Module"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
