"use client";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Video,
  FileText,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  Clock,
  ChevronRight,
  ExternalLink,
  Eye,
  GripVertical,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";

import { AddLessonModal } from "@/components/academy/AddLessonModal";
import { useAcademyStore, type Lesson } from "@/store/academy";
import { useAuthStore } from "@/store/auth";

export default function ModuleDetailPage() {
  const params = useParams();
  const moduleId = Number(params.moduleId);
  
  const { user } = useAuthStore();
  const { 
    selectedModule, 
    isLoading, 
    isSaving, 
    error, 
    fetchModuleById,
    deleteLesson,
    reorderLessons,
    clearSelectedModule,
  } = useAcademyStore();
  
  const [isAddLessonOpen, setIsAddLessonOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [orderedLessons, setOrderedLessons] = useState<Lesson[]>([]);

  const isSuperAdmin = user?.role === "SUPERADMIN";

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    if (moduleId) {
      fetchModuleById(moduleId);
    }
    
    return () => {
      clearSelectedModule();
    };
  }, [moduleId, fetchModuleById, clearSelectedModule]);

  // Keep orderedLessons in sync with selectedModule (DnD requires mutable local state)
  useEffect(() => {
    if (selectedModule?.lessons) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOrderedLessons([...selectedModule.lessons].sort((a, b) => a.order - b.order));
    } else {
      setOrderedLessons([]);
    }
  }, [selectedModule?.lessons]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = orderedLessons.findIndex(l => l.id === active.id);
    const newIndex = orderedLessons.findIndex(l => l.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(orderedLessons, oldIndex, newIndex);
    setOrderedLessons(reordered);
    await reorderLessons(moduleId, reordered.map(l => l.id));
  }, [orderedLessons, reorderLessons, moduleId]);

  const handleEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setIsAddLessonOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddLessonOpen(false);
    setEditingLesson(null);
  };

  const handleDeleteLesson = async (lesson: Lesson) => {
    if (!isSuperAdmin) {
      return;
    }
    
    if (confirm(`¿Estás seguro de eliminar la lección "${lesson.title}"? Esta acción no se puede deshacer.`)) {
      setDeletingId(lesson.id);
      await deleteLesson(lesson.id);
      setDeletingId(null);
    }
  };

  if (isLoading && !selectedModule) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (error && !selectedModule) {
    return (
      <div className="space-y-6">
        <Link 
          href="/academy"
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-brand-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Academy
        </Link>
        
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-red-200">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">Error al cargar el módulo</h3>
          <p className="text-sm text-gray-500 mt-1">{error}</p>
          <button
            onClick={() => fetchModuleById(moduleId)}
            className="mt-4 px-4 py-2 text-sm font-semibold text-white bg-brand-primary rounded-lg hover:bg-brand-primary/90"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!selectedModule) {
    return (
      <div className="space-y-6">
        <Link 
          href="/academy"
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-brand-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Academy
        </Link>
        
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-gray-200">
          <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">Módulo no encontrado</h3>
          <p className="text-sm text-gray-500 mt-1">El módulo que buscas no existe</p>
        </div>
      </div>
    );
  }

  const lessons = orderedLessons;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Link 
          href="/academy"
          className="font-semibold text-brand-cyan-dark hover:underline"
        >
          Academy
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-gray-900">{selectedModule.title}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          {selectedModule.image && (
            <div className="hidden sm:block h-20 w-32 rounded-xl overflow-hidden bg-gray-100 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedModule.image}
                alt={selectedModule.title}
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900">
              {selectedModule.title}
            </h1>
            <p className="mt-1 text-sm text-gray-500 line-clamp-2">
              {selectedModule.description}
            </p>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-xs font-semibold text-gray-500">
                {lessons.length} {lessons.length === 1 ? "lección" : "lecciones"}
              </span>
              {selectedModule.visibleForSkillBuilder && (
                <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                  Skill Builder
                </span>
              )}
              {selectedModule.visibleForSkillBuilderLive && (
                <span className="flex items-center gap-1 rounded-full bg-teal-100 px-2 py-0.5 text-xs font-semibold text-teal-700">
                  SB Live
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/academy/${moduleId}/preview`}
            className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Eye className="h-5 w-5" />
            Vista Previa
          </Link>
          <button
            onClick={() => setIsAddLessonOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-brand-cyan-dark px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-cyan-dark/20 transition-all hover:bg-brand-cyan active:scale-95 shrink-0"
          >
            <Plus className="h-5 w-5" />
            Nueva Lección
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Lessons List */}
      {orderedLessons.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-gray-200">
          <Video className="h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">No hay lecciones</h3>
          <p className="text-sm text-gray-500 mt-1">Crea la primera lección para este módulo</p>
          <button
            onClick={() => setIsAddLessonOpen(true)}
            className="mt-4 flex items-center gap-2 px-4 py-2 text-sm font-semibold text-brand-cyan-dark border border-brand-cyan-dark rounded-lg hover:bg-brand-cyan-dark/5"
          >
            <Plus className="h-4 w-4" />
            Crear Lección
          </button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={orderedLessons.map(l => l.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {orderedLessons.map((lesson, index) => (
                <SortableLessonRow
                  key={lesson.id}
                  lesson={lesson}
                  index={index}
                  isSuperAdmin={isSuperAdmin}
                  isSaving={isSaving}
                  deletingId={deletingId}
                  onEdit={handleEditLesson}
                  onDelete={handleDeleteLesson}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Add Lesson Modal */}
      <AddLessonModal
        isOpen={isAddLessonOpen}
        onClose={handleCloseModal}
        moduleId={moduleId}
        initialData={editingLesson}
      />
    </div>
  );
}

// Sortable Lesson Row Component
interface SortableLessonRowProps {
  lesson: Lesson;
  index: number;
  isSuperAdmin: boolean;
  isSaving: boolean;
  deletingId: number | null;
  onEdit: (lesson: Lesson) => void;
  onDelete: (lesson: Lesson) => void;
}

function SortableLessonRow({
  lesson,
  index,
  isSuperAdmin,
  isSaving,
  deletingId,
  onEdit,
  onDelete,
}: SortableLessonRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lesson.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-brand-cyan-dark/30 hover:shadow-md transition-all"
    >
      <div className="flex items-start gap-4">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing shrink-0 transition-colors"
          title="Arrastrar para reordenar"
        >
          <GripVertical className="h-5 w-5" />
        </button>

        {/* Order indicator */}
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-600 font-bold shrink-0">
          {lesson.order || index + 1}
        </div>
        
        {/* Lesson Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-gray-900 truncate">
              {lesson.title}
            </h4>
            {lesson.status === "DRAFT" && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                Draft
              </span>
            )}
            {lesson.status === "ARCHIVED" && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">
                Archived
              </span>
            )}
            {lesson.contentUrl && (
              <span className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                <Video className="h-3 w-3" />
                Video
              </span>
            )}
          </div>
          
          {lesson.description && (
            <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">
              {lesson.description}
            </p>
          )}
          
          <div className="flex items-center gap-4 mt-2">
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              {lesson.duration}{!lesson.duration?.toString().includes("min") && " min"}
            </span>
            
            {lesson.resources && lesson.resources.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <FileText className="h-3 w-3" />
                {lesson.resources.length} {lesson.resources.length === 1 ? "recurso" : "recursos"}
              </span>
            )}
            
            {lesson.contentUrl && (
              <a
                href={lesson.contentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-brand-cyan-dark hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                Ver video
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(lesson)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-gray-700 border border-gray-200 rounded-lg hover:border-brand-primary hover:text-brand-primary transition-colors"
        >
          <Edit2 className="h-4 w-4" />
          Editar
        </button>
        {isSuperAdmin && (
          <button
            onClick={() => onDelete(lesson)}
            disabled={isSaving && deletingId === lesson.id}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {isSaving && deletingId === lesson.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Eliminar
          </button>
        )}
      </div>
    </motion.div>
  );
}
