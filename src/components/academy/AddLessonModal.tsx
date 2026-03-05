"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Check, 
  Video, 
  FileText, 
  Plus, 
  Trash2, 
  Loader2,
  Link as LinkIcon,
  Clock,
  GripVertical,
} from "lucide-react";
import { useState, useEffect } from "react";

import { 
  useAcademyStore, 
  type Lesson, 
  type LessonResource,
  type CreateResourceData, 
} from "@/store/academy";

interface AddLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleId: number;
  initialData?: Lesson | null;
}

export function AddLessonModal({ isOpen, onClose, moduleId, initialData }: AddLessonModalProps) {
  const { createLesson, updateLesson, addResource, deleteResource, isSaving } = useAcademyStore();
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    duration: "",
    contentUrl: "",
    order: 0,
  });

  const [resources, setResources] = useState<(LessonResource | CreateResourceData & { isNew?: boolean })[]>([]);
  const [newResource, setNewResource] = useState<{
    title: string;
    fileUrl: string;
    type: "PDF" | "LINK" | "VIDEO" | "DOCUMENT";
    size: string;
  }>({
    title: "",
    fileUrl: "",
    type: "PDF",
    size: "",
  });
  const [showAddResource, setShowAddResource] = useState(false);

  // Sync form data with initialData prop
  useEffect(() => {
    if (isOpen && initialData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        title: initialData.title || "",
        description: initialData.description || "",
        duration: initialData.duration || "",
        contentUrl: initialData.contentUrl || "",
        order: initialData.order || 0,
      });
      setResources(initialData.resources || []);
    } else if (isOpen && !initialData) {
      setFormData({
        title: "",
        description: "",
        duration: "",
        contentUrl: "",
        order: 0,
      });
      setResources([]);
    }
    setShowAddResource(false);
    setNewResource({ title: "", fileUrl: "", type: "PDF", size: "" });
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
        // Handle new resources
        const newResources = resources.filter((r): r is CreateResourceData & { isNew: true } => 
          "isNew" in r && r.isNew === true,
        );
        for (const resource of newResources) {
          await addResource(initialData.id, {
            title: resource.title,
            fileUrl: resource.fileUrl,
            type: resource.type,
            size: resource.size,
          });
        }
        onClose();
      }
    } else {
      // Create new lesson
      const result = await createLesson(moduleId, lessonData);
      if (result.success) {
        onClose();
      }
    }
  };

  const handleAddResource = () => {
    if (newResource.title && newResource.fileUrl) {
      setResources([...resources, { ...newResource, isNew: true }]);
      setNewResource({ title: "", fileUrl: "", type: "PDF", size: "" });
      setShowAddResource(false);
    }
  };

  const handleRemoveResource = async (index: number) => {
    const resource = resources[index];
    
    if ("id" in resource && resource.id && !("isNew" in resource)) {
      // Delete from server
      await deleteResource(resource.id);
    }
    
    setResources(resources.filter((_, i) => i !== index));
  };

  const getResourceTypeIcon = (type: string) => {
    switch (type) {
    case "PDF":
      return <FileText className="h-4 w-4 text-red-500" />;
    case "VIDEO":
      return <Video className="h-4 w-4 text-blue-500" />;
    case "LINK":
      return <LinkIcon className="h-4 w-4 text-green-500" />;
    default:
      return <FileText className="h-4 w-4 text-gray-500" />;
    }
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
              className="flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl max-h-[90vh]"
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
                          min="0"
                          placeholder="0"
                          value={formData.order}
                          onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-brand-cyan-dark focus:ring-2 focus:ring-brand-cyan-dark/20"
                        />
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
                    {formData.contentUrl && (
                      <div className="rounded-xl overflow-hidden border border-gray-200 bg-black aspect-video">
                        <iframe
                          src={formData.contentUrl}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    )}
                  </div>

                  {/* Resources Section */}
                  <div className="space-y-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                        <FileText className="h-4 w-4 text-red-500" />
                        Recursos Adicionales
                      </h3>
                      {initialData && (
                        <button
                          type="button"
                          onClick={() => setShowAddResource(true)}
                          className="flex items-center gap-1 text-sm font-semibold text-brand-cyan-dark hover:text-brand-cyan"
                        >
                          <Plus className="h-4 w-4" />
                          Agregar Recurso
                        </button>
                      )}
                    </div>

                    {/* Resource List */}
                    {resources.length > 0 && (
                      <div className="space-y-2">
                        {resources.map((resource, index) => (
                          <div
                            key={"id" in resource ? resource.id : `new-${index}`}
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
                                <p className="text-xs text-gray-500 truncate">
                                  {resource.fileUrl}
                                  {resource.size && ` • ${resource.size}`}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveResource(index)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Resource Form */}
                    {showAddResource && (
                      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="mb-1 block text-xs font-semibold text-gray-600">
                              Título del Recurso
                            </label>
                            <input
                              type="text"
                              placeholder="Ej: Guía de estudio"
                              value={newResource.title}
                              onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-cyan-dark"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-semibold text-gray-600">
                              Tipo
                            </label>
                            <select
                              value={newResource.type}
                              onChange={(e) => setNewResource({ ...newResource, type: e.target.value as "PDF" | "LINK" | "VIDEO" | "DOCUMENT" })}
                              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-cyan-dark bg-white"
                            >
                              <option value="PDF">PDF</option>
                              <option value="VIDEO">Video</option>
                              <option value="LINK">Link</option>
                              <option value="DOCUMENT">Documento</option>
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="col-span-2">
                            <label className="mb-1 block text-xs font-semibold text-gray-600">
                              URL del Archivo
                            </label>
                            <input
                              type="url"
                              placeholder="https://..."
                              value={newResource.fileUrl}
                              onChange={(e) => setNewResource({ ...newResource, fileUrl: e.target.value })}
                              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-cyan-dark"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-semibold text-gray-600">
                              Tamaño (opcional)
                            </label>
                            <input
                              type="text"
                              placeholder="Ej: 2.5 MB"
                              value={newResource.size}
                              onChange={(e) => setNewResource({ ...newResource, size: e.target.value })}
                              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-cyan-dark"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddResource(false);
                              setNewResource({ title: "", fileUrl: "", type: "PDF", size: "" });
                            }}
                            className="px-3 py-1.5 text-sm font-semibold text-gray-600 hover:text-gray-800"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={handleAddResource}
                            disabled={!newResource.title || !newResource.fileUrl}
                            className="px-3 py-1.5 text-sm font-semibold text-white bg-brand-cyan-dark rounded-lg hover:bg-brand-cyan disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Agregar
                          </button>
                        </div>
                      </div>
                    )}

                    {!initialData && resources.length === 0 && (
                      <p className="text-sm text-gray-500 italic">
                        Los recursos se pueden agregar después de crear la lección.
                      </p>
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
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
