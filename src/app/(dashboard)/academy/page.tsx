"use client";

import { motion } from "framer-motion";
import {
  BookOpen,
  Send,
  Loader2,
  AlertCircle,
  Trash2,
  Eye,
  Video,
  Settings,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import { AddModuleModal } from "@/components/academy/AddModuleModal";
import { SuggestCourseModal } from "@/components/academy/SuggestCourseModal";
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
  } = useAcademyStore();
  
  const [isAddModuleOpen, setIsAddModuleOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  
  // Suggestion State
  const [isSuggestOpen, setIsSuggestOpen] = useState(false);
  const [suggestingModule, setSuggestingModule] = useState<Module | null>(null);

  const isSuperAdmin = user?.role === "SUPERADMIN";

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

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
    
    if (confirm(`¿Estás seguro de eliminar el módulo "${module.title}"? Esta acción no se puede deshacer.`)) {
      setDeletingId(module.id);
      await deleteModule(module.id);
      setDeletingId(null);
    }
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
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((module, index) => (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-lg"
            >
              <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={module.image || "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1000&auto=format&fit=crop"}
                  alt={module.title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/10 transition-colors group-hover:bg-black/0" />
                
                {/* Status badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {module.visibleForSkillBuilder && (
                    <span className="flex items-center gap-1 rounded-lg bg-green-500 px-2 py-1 text-xs font-bold text-white">
                      <Eye className="h-3 w-3" />
                      Skill Builder
                    </span>
                  )}
                </div>
                
                <div className="absolute top-4 right-4 flex gap-2">
                  <button 
                    onClick={() => handleSuggest(module)}
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
                    onClick={() => router.push(`/academy/${module.id}`)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-cyan-dark px-3 py-2 text-sm font-semibold text-white hover:bg-brand-cyan transition-colors"
                  >
                    <Video className="h-4 w-4" />
                    Lecciones
                  </button>
                  
                  {/* Edit Module */}
                  <button
                    onClick={() => handleEditModule(module)}
                    className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:border-brand-primary hover:text-brand-primary transition-colors"
                    title="Editar módulo"
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                  
                  {/* Delete Module */}
                  {isSuperAdmin && (
                    <button 
                      onClick={() => handleDeleteModule(module)}
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
          ))}
        </div>
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
    </div>
  );
}
