"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Check, BookOpen, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

import { useModalLock } from "@/hooks/useModalLock";
import { useAcademyStore, type Module } from "@/store/academy";

/**
 * Converts Google Drive sharing URLs to direct image URLs.
 * Supports various Google Drive URL formats.
 */
function convertGoogleDriveUrl(url: string): string {
  const trimmed = url.trim();
  
  // Extract file ID from various Google Drive URL formats
  let fileId: string | null = null;

  // Pattern: https://drive.google.com/file/d/FILE_ID/view...
  const fileMatch = trimmed.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (fileMatch?.[1]) fileId = fileMatch[1];

  // Pattern: https://drive.google.com/open?id=FILE_ID
  if (!fileId) {
    const openMatch = trimmed.match(/drive\.google\.com\/open\?id=([^&]+)/);
    if (openMatch?.[1]) fileId = openMatch[1];
  }

  // Pattern: https://drive.google.com/uc?id=FILE_ID or uc?export=view&id=FILE_ID
  if (!fileId) {
    const ucMatch = trimmed.match(/drive\.google\.com\/uc\?.*id=([^&]+)/);
    if (ucMatch?.[1]) fileId = ucMatch[1];
  }

  if (fileId) {
    // Use Google Drive thumbnail API which allows direct embedding in <img> tags
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
  }
  
  return trimmed;
}

interface AddModuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Module | null;
}

export function AddModuleModal({ isOpen, onClose, initialData }: AddModuleModalProps) {
  useModalLock(isOpen, onClose);
  const { createModule, updateModule, isSaving } = useAcademyStore();
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    level: "Beginner",
    status: "DRAFT" as "DRAFT" | "PUBLISHED" | "ARCHIVED",
    imageUrl: "",
    pdfFiles: [] as File[],
    visibleForSkillBuilder: false,
  });
  const [imagePreviewError, setImagePreviewError] = useState(false);

  // Sync form data with initialData prop - this is a valid use case for setState in effect
  useEffect(() => {
    if (isOpen && initialData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        title: initialData.title || "",
        description: initialData.description || "",
        level: "Beginner",
        status: initialData.status || "DRAFT",
        imageUrl: initialData.image || "",
        pdfFiles: [],
        visibleForSkillBuilder: initialData.visibleForSkillBuilder || false,
      });
      setImagePreviewError(false);
    } else if (isOpen && !initialData) {
      // Reset form when opening in create mode
       
      setFormData({
        title: "",
        description: "",
        level: "Beginner",
        status: "DRAFT",
        imageUrl: "",
        pdfFiles: [],
        visibleForSkillBuilder: false,
      });
      setImagePreviewError(false);
    }
  }, [isOpen, initialData]);

  // Check if publishing is allowed (need at least 1 lesson)
  const canPublish = initialData ? (initialData.lessonsCount > 0) : false;
  const [publishError, setPublishError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate: cannot publish without lessons
    if (formData.status === "PUBLISHED" && !canPublish) {
      setPublishError(
        "Se necesita mínimo 1 lección para que el módulo sea visible para los alumnos. Cambia el estado a Draft o agrega lecciones primero.",
      );
      return;
    }
    setPublishError("");
    
    // Only include image if it has a valid URL value
    const moduleData: {
      title: string;
      description: string;
      visibleForSkillBuilder: boolean;
      status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
      image?: string;
    } = {
      title: formData.title,
      description: formData.description,
      visibleForSkillBuilder: formData.visibleForSkillBuilder,
      status: formData.status,
    };
    
    // Only add image if URL is provided and looks like a valid URL
    const trimmedUrl = formData.imageUrl.trim();
    if (trimmedUrl && (trimmedUrl.startsWith("http://") || trimmedUrl.startsWith("https://"))) {
      moduleData.image = convertGoogleDriveUrl(trimmedUrl);
    }
    
    if (initialData) {
      await updateModule(initialData.id, moduleData);
    } else {
      await createModule(moduleData);
    }
    
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
          onClick={onClose}
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
                      onChange={(e) => {
                        setFormData({ ...formData, status: e.target.value as "DRAFT" | "PUBLISHED" | "ARCHIVED" });
                        setPublishError("");
                      }}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-brand-cyan-dark focus:ring-2 focus:ring-brand-cyan-dark/20 bg-white"
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="PUBLISHED" disabled={!canPublish}>
                          Published {!canPublish ? "(requires lessons)" : ""}
                      </option>
                      <option value="ARCHIVED">Archived</option>
                    </select>
                    {formData.status === "PUBLISHED" && !canPublish && (
                      <p className="mt-1 text-xs text-amber-600">
                          ⚠️ Se necesita mínimo 1 lección para publicar.
                      </p>
                    )}
                    {publishError && (
                      <p className="mt-1 text-xs text-red-600">
                        {publishError}
                      </p>
                    )}
                  </div>
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
                          Enable this to make the module accessible for users with the Skill Builder plan.
                      </p>
                    </div>
                  </label>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                      Cover Image URL <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={formData.imageUrl}
                    onChange={(e) => {
                      setFormData({ ...formData, imageUrl: e.target.value });
                      setImagePreviewError(false);
                    }}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-brand-cyan-dark focus:ring-2 focus:ring-brand-cyan-dark/20"
                  />
                  {/* Image Preview */}
                  {formData.imageUrl && (formData.imageUrl.startsWith("http://") || formData.imageUrl.startsWith("https://")) && (
                    <div className="mt-3">
                      {!imagePreviewError ? (
                        <div className="relative mx-auto aspect-video w-full max-w-sm overflow-hidden rounded-lg border border-gray-200 shadow-sm">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={convertGoogleDriveUrl(formData.imageUrl)} 
                            alt="Preview" 
                            className="h-full w-full object-cover"
                            referrerPolicy="no-referrer"
                            onError={() => setImagePreviewError(true)}
                          />
                        </div>
                      ) : (
                        <p className="text-sm text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                            ⚠️ Could not load image preview. The URL may be invalid or blocked.
                        </p>
                      )}
                    </div>
                  )}
                </div>


              </div>

              {/* Footer */}
              <div className="flex flex-none items-center justify-end gap-3 bg-white px-6 py-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSaving}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                    Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 rounded-xl bg-brand-primary px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-primary/20 transition-all hover:bg-brand-primary/90 disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  {initialData ? "Save Changes" : "Create Module"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
