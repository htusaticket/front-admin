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
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Send,
  Loader2,
  AlertCircle,
  Trash2,
  Eye,
  Video,
  Settings,
  GripVertical,
  AlertTriangle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";

import { AddModuleModal } from "@/components/academy/AddModuleModal";
import { SuggestCourseModal } from "@/components/academy/SuggestCourseModal";
import { useModalLock } from "@/hooks/useModalLock";
import { useAcademyStore, type Module } from "@/store/academy";
import { useAuthStore } from "@/store/auth";

export default function AcademyPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { 
    modules, 
    isLoading, 
    isSaving, 
    error, 
    fetchModules, 
    deleteModule,
    reorderModules,
  } = useAcademyStore();
  
  const [isAddModuleOpen, setIsAddModuleOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [orderedModules, setOrderedModules] = useState<Module[]>([]);
  const [moduleToDelete, setModuleToDelete] = useState<Module | null>(null);
  
  // Suggestion State
  const [isSuggestOpen, setIsSuggestOpen] = useState(false);
  const [suggestingModule, setSuggestingModule] = useState<Module | null>(null);

  const isSuperAdmin = user?.role === "SUPERADMIN";

  // Lock body scroll and escape for delete modal
  useModalLock(!!moduleToDelete, () => setModuleToDelete(null));

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  // Keep orderedModules in sync with store (DnD requires mutable local state)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrderedModules([...modules].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
  }, [modules]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = orderedModules.findIndex(m => m.id === active.id);
    const newIndex = orderedModules.findIndex(m => m.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(orderedModules, oldIndex, newIndex);
    setOrderedModules(reordered);
    await reorderModules(reordered.map(m => m.id));
  }, [orderedModules, reorderModules]);

  const handleEditModule = (module: Module) => {
    setEditingModule(module);
    setIsAddModuleOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddModuleOpen(false);
    setEditingModule(null);
  };

  const handleSuggest = (module: Module) => {
    setSuggestingModule(module);
    setIsSuggestOpen(true);
  };

  const handleDeleteModule = async (module: Module) => {
    if (!isSuperAdmin) {
      return;
    }
    setModuleToDelete(module);
  };

  const confirmDeleteModule = async () => {
    if (!moduleToDelete) return;
    setDeletingId(moduleToDelete.id);
    await deleteModule(moduleToDelete.id);
    setDeletingId(null);
    setModuleToDelete(null);
  };

  if (isLoading && modules.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">
            Academy Modules
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage course content and lessons
          </p>
        </div>
        <button
          onClick={() => setIsAddModuleOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-primary/20 transition-all hover:bg-brand-primary/90 active:scale-95"
        >
          <BookOpen className="h-5 w-5" />
          Create Module
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {modules.length === 0 && !isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-gray-200">
          <BookOpen className="h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">No hay módulos</h3>
          <p className="text-sm text-gray-500 mt-1">Crea el primer módulo para comenzar</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={orderedModules.map(m => m.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {orderedModules.map((module, index) => (
                <SortableModuleCard
                  key={module.id}
                  module={module}
                  index={index}
                  isSuperAdmin={isSuperAdmin}
                  isSaving={isSaving}
                  deletingId={deletingId}
                  onEdit={handleEditModule}
                  onDelete={handleDeleteModule}
                  onSuggest={handleSuggest}
                  onNavigate={(id) => router.push(`/academy/${id}`)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
      
      <AddModuleModal
        isOpen={isAddModuleOpen}
        onClose={handleCloseModal}
        initialData={editingModule}
      />
      
      <SuggestCourseModal
        isOpen={isSuggestOpen}
        onClose={() => setIsSuggestOpen(false)}
        moduleTitle={suggestingModule?.title || ""}
      />

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {moduleToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setModuleToDelete(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <h2 className="mt-4 font-display text-xl font-bold text-gray-900">
                    Eliminar Módulo
                </h2>
                <p className="mt-2 text-sm text-gray-500">
                    ¿Estás seguro de eliminar el módulo{" "}
                  <span className="font-bold text-gray-700">&quot;{moduleToDelete.title}&quot;</span>?
                    Esta acción no se puede deshacer.
                </p>
              </div>

              <div className="mt-6 flex gap-3 justify-center">
                <button
                  onClick={() => setModuleToDelete(null)}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                    Cancelar
                </button>
                <button
                  onClick={confirmDeleteModule}
                  disabled={deletingId !== null}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {deletingId !== null ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                    Eliminar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Sortable Module Card Component
interface SortableModuleCardProps {
  module: Module;
  index: number;
  isSuperAdmin: boolean;
  isSaving: boolean;
  deletingId: number | null;
  onEdit: (module: Module) => void;
  onDelete: (module: Module) => void;
  onSuggest: (module: Module) => void;
  onNavigate: (id: number) => void;
}

function SortableModuleCard({
  module,
  index,
  isSuperAdmin,
  isSaving,
  deletingId,
  onEdit,
  onDelete,
  onSuggest,
  onNavigate,
}: SortableModuleCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: module.id });

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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-lg"
    >
      <div 
        className="relative aspect-square w-full overflow-hidden bg-gray-100 cursor-pointer"
        onClick={() => onNavigate(module.id)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={module.image || "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1000&auto=format&fit=crop"}
          alt={module.title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/10 transition-colors group-hover:bg-black/0" />
        
        {/* Status badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {module.status === "DRAFT" && (
            <span className="rounded-lg bg-amber-500 px-2 py-1 text-xs font-bold text-white">
              Draft
            </span>
          )}
          {module.status === "ARCHIVED" && (
            <span className="rounded-lg bg-gray-500 px-2 py-1 text-xs font-bold text-white">
              Archived
            </span>
          )}
          {module.visibleForSkillBuilder && (
            <span className="flex items-center gap-1 rounded-lg bg-green-500 px-2 py-1 text-xs font-bold text-white">
              <Eye className="h-3 w-3" />
              Skill Builder
            </span>
          )}
          {module.visibleForSkillBuilderLive && (
            <span className="flex items-center gap-1 rounded-lg bg-teal-500 px-2 py-1 text-xs font-bold text-white">
              <Eye className="h-3 w-3" />
              SB Live
            </span>
          )}
        </div>
        
        <div className="absolute top-4 right-4 flex gap-2">
          {/* Drag handle */}
          <button
            {...attributes}
            {...listeners}
            className="rounded-lg bg-white/90 p-2 text-gray-700 shadow-sm hover:text-brand-primary cursor-grab active:cursor-grabbing"
            title="Arrastrar para reordenar"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onSuggest(module); }}
            className="rounded-lg bg-white/90 p-2 text-gray-700 shadow-sm hover:text-brand-primary"
            title="Suggest to Student"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between">
          <h4 className="font-display text-lg font-bold text-brand-primary">
            {module.title}
          </h4>
          <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-bold text-gray-600">
            {module.lessonsCount || 0} Lessons
          </span>
        </div>
        
        <p className="mt-2 line-clamp-2 text-sm text-gray-600">
          {module.description}
        </p>

        <div className="mt-6 flex items-center gap-2 pt-4 border-t border-gray-100">
          {/* Manage Lessons - Primary action */}
          <button
            onClick={() => onNavigate(module.id)}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-cyan-dark px-3 py-2 text-sm font-semibold text-white hover:bg-brand-cyan transition-colors"
          >
            <Video className="h-4 w-4" />
            Lecciones
          </button>
          
          {/* Edit Module */}
          <button
            onClick={() => onEdit(module)}
            className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:border-brand-primary hover:text-brand-primary transition-colors"
            title="Editar módulo"
          >
            <Settings className="h-4 w-4" />
          </button>
          
          {/* Delete Module */}
          {isSuperAdmin && (
            <button 
              onClick={() => onDelete(module)}
              disabled={isSaving && deletingId === module.id}
              className="flex items-center justify-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
              title="Eliminar módulo"
            >
              {isSaving && deletingId === module.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
