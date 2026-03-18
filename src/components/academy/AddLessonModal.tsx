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
  GripVertical,
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
}

export function AddLessonModal({ isOpen, onClose, moduleId, initialData }: AddLessonModalProps) {
  useModalLock(isOpen, onClose);
  const { createLesson, updateLesson, uploadResource, deleteResource, isSaving, selectedModule } = useAcademyStore();
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    duration: "",
    contentUrl: "",
    order: 0,
  });

  const [existingResources, setExistingResources] = useState<LessonResource[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [fileSizeError, setFileSizeError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate next available order
  const getNextOrder = () => {
    const lessons = selectedModule?.lessons || [];
    if (lessons.length === 0) return 1;
    const maxOrder = Math.max(...lessons.map(l => l.order || 0));
    return maxOrder + 1;
  };

  // Sync form data with initialData prop
  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        title: initialData.title || "",
        description: initialData.description || "",
        duration: initialData.duration || "",
        contentUrl: initialData.contentUrl || "",
        order: initialData.order || 1,
      });
      setExistingResources(initialData.resources || []);
    } else if (isOpen && !initialData) {
      setFormData({
        title: "",
        description: "",
        duration: "",
        contentUrl: "",
        order: getNextOrder(),
      });
      setExistingResources([]);
    }
    setPendingFiles([]);
    setFileSizeError(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const lessonData = {
      title: formData.title,
      description: formData.description || undefined,
      duration: formData.duration,
      contentUrl: formData.contentUrl || undefined,
      order: formData.order,
    };
    
    if (initialData) {
      // Update existing lesson
      const result = await updateLesson(initialData.id, lessonData);
      
      if (result.success) {
        // Upload any pending files
        for (const file of pendingFiles) {
          await uploadResource(initialData.id, file);
        }
        onClose();
      }
    } else {
      // Create new lesson, then upload pending files
      const result = await createLesson(moduleId, lessonData);
      if (result.success) {
        // If there are pending files, get the new lesson from the refreshed module
        if (pendingFiles.length > 0) {
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
          `Los siguientes archivos exceden el límite de ${MAX_FILE_SIZE_MB}MB: ${oversizedFiles.map(f => f.name).join(", ")}`,
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
          `Los siguientes archivos exceden el límite de ${MAX_FILE_SIZE_MB}MB: ${oversizedFiles.map(f => f.name).join(", ")}`,
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
          onClick={onClose}
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
                  {initialData ? "Editar Lección" : "Nueva Lección"}
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
                      Información Básica
                  </h3>
                    
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                        Título de la Lección *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Introducción a la gramática"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-brand-cyan-dark focus:ring-2 focus:ring-brand-cyan-dark/20"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                        Descripción
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Descripción detallada del contenido de la lección..."
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
                            Duración *
                        </div>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: 15 min"
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-brand-cyan-dark focus:ring-2 focus:ring-brand-cyan-dark/20"
                      />
                    </div>
                      
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                        <div className="flex items-center gap-1.5">
                          <GripVertical className="h-4 w-4 text-brand-primary" />
                            Orden
                        </div>
                      </label>
                      <input
                        type="number"
                        min="1"
                        placeholder="1"
                        value={formData.order}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 1;
                          setFormData({ ...formData, order: Math.max(1, val) });
                        }}
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-brand-cyan-dark focus:ring-2 focus:ring-brand-cyan-dark/20"
                      />
                      {/* Order conflict warning */}
                      {selectedModule?.lessons?.some(
                        l => l.order === formData.order && l.id !== initialData?.id,
                      ) && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-amber-600">
                          <AlertTriangle className="h-3 w-3" />
                            Ya existe una lección con este orden. Se reordenará automáticamente.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Video Section */}
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                    <Video className="h-4 w-4 text-brand-cyan-dark" />
                      Video de la Lección
                  </h3>
                    
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                        URL del Video (YouTube, Vimeo, etc.)
                    </label>
                    <input
                      type="url"
                      placeholder="https://www.youtube.com/embed/... o https://vimeo.com/..."
                      value={formData.contentUrl}
                      onChange={(e) => setFormData({ ...formData, contentUrl: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-brand-cyan-dark focus:ring-2 focus:ring-brand-cyan-dark/20"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                        Usa la URL de embed para YouTube o el link directo para otros servicios
                    </p>
                  </div>

                  {/* Video Preview */}
                  {formData.contentUrl && (() => {
                    const embedUrl = convertToEmbedUrl(formData.contentUrl);
                    if (!embedUrl) {
                      return (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center">
                          <p className="text-sm text-red-600 font-medium">
                              ⚠️ La URL ingresada no es válida.
                              Ingresa una URL de YouTube, Vimeo u otro servicio de video.
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
                      Recursos Adicionales
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
                        <span className="text-brand-primary">Click para subir archivos</span>{" "}
                          o arrastra y suelta
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                          PDF, DOC, documentos, imágenes, videos (máx. {MAX_FILE_SIZE_MB}MB)
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
                      <p className="text-xs font-semibold text-gray-500 uppercase">Recursos existentes</p>
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
                          Archivos pendientes de subir
                      </p>
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
                    className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                  >
                      Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || !formData.title || !formData.duration}
                    className="flex items-center gap-2 rounded-xl bg-brand-cyan-dark px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-cyan-dark/20 transition-all hover:bg-brand-cyan disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                          Guardando...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        {initialData ? "Guardar Cambios" : "Crear Lección"}
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
