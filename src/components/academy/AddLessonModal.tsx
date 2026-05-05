"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Check,
  Video,
  FileText,
  Trash2,
  Loader2,
  Clock,
  Upload,
  AlertTriangle,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

import { useModalLock } from "@/hooks/useModalLock";
import { 
  useAcademyStore, 
  type Lesson, 
  type LessonResource,
} from "@/store/academy";

/**
 * Validates if a string is a valid URL (http/https)
 */
function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Converts a regular YouTube/Vimeo URL to an embeddable URL for iframes.
 */
function convertToEmbedUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!isValidUrl(trimmed)) return null;

  // YouTube: watch?v=xxx -> embed/xxx
  const ytWatch = trimmed.match(/(?:youtube\.com\/watch\?v=|youtube\.com\/watch\?.*&v=)([^&]+)/);
  if (ytWatch?.[1]) return `https://www.youtube.com/embed/${ytWatch[1]}`;

  // YouTube: youtu.be/xxx -> embed/xxx
  const ytShort = trimmed.match(/youtu\.be\/([^?&]+)/);
  if (ytShort?.[1]) return `https://www.youtube.com/embed/${ytShort[1]}`;

  // YouTube: already embed format
  if (trimmed.includes("youtube.com/embed/")) return trimmed;

  // Vimeo: vimeo.com/xxx -> player.vimeo.com/video/xxx
  const vimeoMatch = trimmed.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch?.[1]) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

  // Vimeo: already player format
  if (trimmed.includes("player.vimeo.com/video/")) return trimmed;

  // Loom: loom.com/share/xxx -> loom.com/embed/xxx
  const loomMatch = trimmed.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/);
  if (loomMatch?.[1]) return `https://www.loom.com/embed/${loomMatch[1]}`;

  // Other URLs: return as-is only if valid
  return trimmed;
}

const MAX_FILE_SIZE_MB = 20;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

interface AddLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleId: number;
  initialData?: Lesson | null;
  defaultSectionId?: number | null;
}

export function AddLessonModal({ isOpen, onClose, moduleId, initialData, defaultSectionId }: AddLessonModalProps) {
  useModalLock(isOpen, onClose);
  const { createLesson, updateLesson, uploadResource, deleteResource, isSaving, selectedModule } = useAcademyStore();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    duration: "",
    contentUrl: "",
    sectionId: null as number | null,
    status: "PUBLISHED" as "DRAFT" | "PUBLISHED" | "ARCHIVED",
  });

  const [existingResources, setExistingResources] = useState<LessonResource[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [fileSizeError, setFileSizeError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync form data with initialData prop
  useEffect(() => {
    if (isOpen && initialData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        title: initialData.title || "",
        description: initialData.description || "",
        duration: initialData.duration || "",
        contentUrl: initialData.contentUrl || "",
        sectionId: initialData.sectionId ?? null,
        status: initialData.status || "PUBLISHED",
      });
      setExistingResources(initialData.resources || []);
    } else if (isOpen && !initialData) {
      setFormData({
        title: "",
        description: "",
        duration: "",
        contentUrl: "",
        sectionId: defaultSectionId ?? null,
        status: "PUBLISHED",
      });
      setExistingResources([]);
    }
    setPendingFiles([]);
    setFileSizeError(null);
  }, [isOpen, initialData, defaultSectionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Order is implicit: backend auto-appends at the end of the (module, section) bucket
    // when omitted. Reordering is done by drag-and-drop on the module page.
    const lessonData = {
      title: formData.title,
      description: formData.description || undefined,
      duration: formData.duration,
      contentUrl: formData.contentUrl || undefined,
      sectionId: formData.sectionId,
      status: formData.status,
    };
    
    if (initialData) {
      // Update existing lesson
      const result = await updateLesson(initialData.id, lessonData);
      
      if (result.success && pendingFiles.length > 0) {
        // Upload any pending files
        setIsUploading(true);
        for (const file of pendingFiles) {
          await uploadResource(initialData.id, file);
        }
        setIsUploading(false);
      }
      if (result.success) onClose();
    } else {
      // Create new lesson, then upload pending files
      const result = await createLesson(moduleId, lessonData);
      if (result.success) {
        // If there are pending files, get the new lesson from the refreshed module
        if (pendingFiles.length > 0) {
          setIsUploading(true);
          const store = useAcademyStore.getState();
          const mod = store.selectedModule;
          if (mod?.lessons) {
            const newLesson = mod.lessons[mod.lessons.length - 1];
            if (newLesson) {
              for (const file of pendingFiles) {
                await uploadResource(newLesson.id, file);
              }
            }
          }
          setIsUploading(false);
        }
        onClose();
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      const oversizedFiles = newFiles.filter(f => f.size > MAX_FILE_SIZE_BYTES);
      
      if (oversizedFiles.length > 0) {
        setFileSizeError(
          `The following files exceed the ${MAX_FILE_SIZE_MB}MB limit: ${oversizedFiles.map(f => f.name).join(", ")}`,
        );
        // Only add valid files
        const validFiles = newFiles.filter(f => f.size <= MAX_FILE_SIZE_BYTES);
        if (validFiles.length > 0) {
          setPendingFiles(prev => [...prev, ...validFiles]);
        }
      } else {
        setFileSizeError(null);
        setPendingFiles(prev => [...prev, ...newFiles]);
      }
    }
    // Reset input to allow re-selecting same file
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemovePendingFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingResource = async (resource: LessonResource) => {
    await deleteResource(resource.id);
    setExistingResources(prev => prev.filter(r => r.id !== resource.id));
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      const oversizedFiles = newFiles.filter(f => f.size > MAX_FILE_SIZE_BYTES);
      
      if (oversizedFiles.length > 0) {
        setFileSizeError(
          `The following files exceed the ${MAX_FILE_SIZE_MB}MB limit: ${oversizedFiles.map(f => f.name).join(", ")}`,
        );
        const validFiles = newFiles.filter(f => f.size <= MAX_FILE_SIZE_BYTES);
        if (validFiles.length > 0) {
          setPendingFiles(prev => [...prev, ...validFiles]);
        }
      } else {
        setFileSizeError(null);
        setPendingFiles(prev => [...prev, ...newFiles]);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const getResourceTypeIcon = (type: string) => {
    switch (type) {
    case "PDF":
      return <FileText className="h-4 w-4 text-red-500" />;
    case "VIDEO":
      return <Video className="h-4 w-4 text-blue-500" />;
    default:
      return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    return `${Math.round(bytes / 1024)} KB`;
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
            className="flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex flex-none items-center justify-between border-b border-gray-100 px-6 py-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-brand-cyan-dark/10 rounded-lg">
                  <Video className="h-5 w-5 text-brand-cyan-dark" />
                </div>
                <h2 className="font-display text-lg font-bold text-brand-primary">
                  {initialData ? "Edit Lesson" : "New Lesson"}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                      Basic Information
                  </h3>
                    
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                        Lesson Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Introduction to grammar"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-brand-cyan-dark focus:ring-2 focus:ring-brand-cyan-dark/20"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                        Description
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Detailed description of the lesson content..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-brand-cyan-dark focus:ring-2 focus:ring-brand-cyan-dark/20 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4 text-brand-primary" />
                            Duration *
                        </div>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          required
                          min="1"
                          placeholder="e.g. 15"
                          value={formData.duration}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, "");
                            setFormData({ ...formData, duration: val });
                          }}
                          onKeyDown={(e) => {
                            if (["e", "E", "+", "-", ".", ","].includes(e.key)) {
                              e.preventDefault();
                            }
                          }}
                          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 pr-12 text-sm outline-none transition-all focus:border-brand-cyan-dark focus:ring-2 focus:ring-brand-cyan-dark/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">min</span>
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                        Section
                      </label>
                      <select
                        value={formData.sectionId === null ? "" : String(formData.sectionId)}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData({
                            ...formData,
                            sectionId: value === "" ? null : Number(value),
                          });
                        }}
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-brand-cyan-dark focus:ring-2 focus:ring-brand-cyan-dark/20 bg-white"
                      >
                        <option value="">No section</option>
                        {(selectedModule?.sections || []).map((s) => (
                          <option key={s.id} value={s.id}>{s.title}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value as "DRAFT" | "PUBLISHED" | "ARCHIVED" })
                      }
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-brand-cyan-dark focus:ring-2 focus:ring-brand-cyan-dark/20 bg-white"
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="PUBLISHED">Published</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>
                  </div>
                </div>

                {/* Video Section */}
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                    <Video className="h-4 w-4 text-brand-cyan-dark" />
                      Lesson Video
                  </h3>

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                        Video URL (YouTube, Vimeo, etc.)
                    </label>
                    <input
                      type="url"
                      placeholder="https://www.youtube.com/embed/... or https://vimeo.com/..."
                      value={formData.contentUrl}
                      onChange={(e) => setFormData({ ...formData, contentUrl: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-brand-cyan-dark focus:ring-2 focus:ring-brand-cyan-dark/20"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                        Use the embed URL for YouTube or the direct link for other services
                    </p>
                  </div>

                  {/* Video Preview */}
                  {formData.contentUrl && (() => {
                    const embedUrl = convertToEmbedUrl(formData.contentUrl);
                    if (!embedUrl) {
                      return (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center">
                          <p className="text-sm text-red-600 font-medium">
                              ⚠️ The URL entered is not valid.
                              Enter a YouTube, Vimeo or other video service URL.
                          </p>
                        </div>
                      );
                    }
                    return (
                      <div className="rounded-xl overflow-hidden border border-gray-200 bg-black aspect-video">
                        <iframe
                          src={embedUrl}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    );
                  })()}
                </div>

                {/* Resources Section - File Upload */}
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                    <FileText className="h-4 w-4 text-red-500" />
                      Additional Resources
                  </h3>

                  {/* Upload Area */}
                  <div 
                    className={`relative flex items-center justify-center rounded-xl border-dashed border-2 p-6 transition-all cursor-pointer ${
                      isDragging 
                        ? "border-brand-primary bg-brand-primary/5" 
                        : "border-gray-200 hover:border-brand-primary/50 hover:bg-gray-50"
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.mp4,.webm,.mp3,.txt"
                    />
                    <div className="text-center w-full">
                      <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                        <Upload className="h-5 w-5 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-600">
                        <span className="text-brand-primary">Click to upload files</span>{" "}
                          or drag and drop
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                          PDF, DOC, documents, images, videos (max. {MAX_FILE_SIZE_MB}MB)
                      </p>
                    </div>
                  </div>

                  {/* File Size Error */}
                  {fileSizeError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-red-600">{fileSizeError}</p>
                    </div>
                  )}

                  {/* Existing Resources (edit mode) */}
                  {existingResources.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase">Existing resources</p>
                      {existingResources.map((resource) => (
                        <div
                          key={resource.id}
                          className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white border border-gray-200">
                              {getResourceTypeIcon(resource.type)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {resource.title}
                              </p>
                              {resource.size && (
                                <p className="text-xs text-gray-500">{resource.size}</p>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveExistingResource(resource)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pending Files (to be uploaded) */}
                  {pendingFiles.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase">
                          Pending files to upload
                      </p>
                      {isUploading && (
                        <div className="flex items-center gap-3 rounded-lg border border-brand-primary/30 bg-brand-primary/5 p-3">
                          <Loader2 className="h-5 w-5 animate-spin text-brand-primary" />
                          <p className="text-sm font-medium text-brand-primary">
                              Uploading files... please don&apos;t close this window
                          </p>
                        </div>
                      )}
                      {pendingFiles.map((file, index) => (
                        <div
                          key={`pending-${file.name}-${file.size}-${file.lastModified}`}
                          className="flex items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white border border-blue-200">
                              <Upload className="h-4 w-4 text-blue-500" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {file.name}
                              </p>
                              <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemovePendingFile(index)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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
              <div className="flex-none border-t border-gray-100 px-6 py-4">
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isUploading}
                    className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                  >
                      Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || isUploading || !formData.title || !formData.duration}
                    className="flex items-center gap-2 rounded-xl bg-brand-cyan-dark px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-cyan-dark/20 transition-all hover:bg-brand-cyan disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                          Uploading files...
                      </>
                    ) : isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        {initialData ? "Save Changes" : "Create Lesson"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
