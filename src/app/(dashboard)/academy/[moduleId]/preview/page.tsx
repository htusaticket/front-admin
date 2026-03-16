"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  Video,
  FileText,
  Download,
  ChevronRight,
  Clock,
  Eye,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import { useAcademyStore, type Lesson } from "@/store/academy";

export default function ModulePreviewPage() {
  const params = useParams();
  const router = useRouter();
  const moduleId = Number(params.moduleId);
  
  const { selectedModule, isLoading, error, fetchModuleById, clearSelectedModule } = useAcademyStore();
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    if (moduleId) {
      fetchModuleById(moduleId);
    }
    return () => clearSelectedModule();
  }, [moduleId, fetchModuleById, clearSelectedModule]);

  // Auto-select first lesson
  useEffect(() => {
    if (selectedModule?.lessons?.length && !selectedLesson) {
      const sorted = [...selectedModule.lessons].sort((a, b) => a.order - b.order);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedLesson(sorted[0]);
    }
  }, [selectedModule, selectedLesson]);

  if (isLoading && !selectedModule) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (error || !selectedModule) {
    return (
      <div className="space-y-6">
        <Link 
          href={`/academy/${moduleId}`}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-brand-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al módulo
        </Link>
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-red-200">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">Error al cargar la vista previa</h3>
          <p className="text-sm text-gray-500 mt-1">{error || "Módulo no encontrado"}</p>
        </div>
      </div>
    );
  }

  const lessons = [...(selectedModule.lessons || [])].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      {/* Preview Banner */}
      <div className="flex items-center justify-between gap-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
        <div className="flex items-center gap-2 text-amber-800">
          <Eye className="h-5 w-5" />
          <span className="text-sm font-semibold">
            Modo Vista Previa — Así verá el estudiante este módulo
          </span>
        </div>
        <button
          onClick={() => router.push(`/academy/${moduleId}`)}
          className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-sm font-semibold text-amber-800 hover:bg-amber-100 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Salir de vista previa
        </button>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span className="font-semibold text-brand-cyan-dark">Academy</span>
        <ChevronRight className="h-4 w-4" />
        <span className="text-gray-900">{selectedModule.title}</span>
        {selectedLesson && (
          <>
            <ChevronRight className="h-4 w-4" />
            <span className="text-gray-900">{selectedLesson.title}</span>
          </>
        )}
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="hidden lg:block w-80 shrink-0">
          <div className="sticky top-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
              {selectedModule.image && (
                <div className="h-12 w-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedModule.image}
                    alt={selectedModule.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <div className="min-w-0">
                <h3 className="font-display font-bold text-brand-primary text-sm truncate">
                  {selectedModule.title}
                </h3>
                <p className="text-xs text-gray-500">
                  {lessons.length} {lessons.length === 1 ? "lección" : "lecciones"}
                </p>
              </div>
            </div>

            <div className="space-y-1">
              {lessons.map((lesson, index) => (
                <button
                  key={lesson.id}
                  onClick={() => setSelectedLesson(lesson)}
                  className={`w-full text-left flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all ${
                    selectedLesson?.id === lesson.id
                      ? "bg-brand-cyan-dark/10 text-brand-cyan-dark"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shrink-0 ${
                    selectedLesson?.id === lesson.id
                      ? "bg-brand-cyan-dark text-white"
                      : "bg-gray-100 text-gray-500"
                  }`}>
                    {lesson.order || index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{lesson.title}</p>
                    <p className="text-xs text-gray-400">{lesson.duration}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0 space-y-6">
          {selectedLesson ? (
            <>
              {/* Video Player */}
              {selectedLesson.contentUrl && (
                <motion.div
                  key={selectedLesson.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                >
                  <div className="aspect-video w-full bg-black">
                    <iframe
                      src={selectedLesson.contentUrl}
                      className="h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                  <div className="p-6">
                    <h1 className="font-display text-2xl font-bold text-brand-primary">
                      {selectedLesson.title}
                    </h1>
                    <p className="mt-1 text-sm text-gray-600">
                      {selectedModule.title} • {selectedLesson.duration}
                    </p>
                    {selectedLesson.description && (
                      <div className="mt-4">
                        <h2 className="font-display text-lg font-bold text-brand-primary">
                          Descripción
                        </h2>
                        <p className="mt-2 text-gray-700 leading-relaxed">
                          {selectedLesson.description}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Lesson info if no video */}
              {!selectedLesson.contentUrl && (
                <motion.div
                  key={selectedLesson.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100">
                      <Video className="h-6 w-6 text-gray-400" />
                    </div>
                    <div>
                      <h1 className="font-display text-2xl font-bold text-brand-primary">
                        {selectedLesson.title}
                      </h1>
                      <p className="text-sm text-gray-500 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {selectedLesson.duration}
                      </p>
                    </div>
                  </div>
                  {selectedLesson.description && (
                    <p className="text-gray-700 leading-relaxed">
                      {selectedLesson.description}
                    </p>
                  )}
                  <div className="mt-4 p-4 rounded-xl bg-gray-50 border border-gray-200 text-center">
                    <p className="text-sm text-gray-500">
                      No hay video configurado para esta lección
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Resources */}
              {selectedLesson.resources && selectedLesson.resources.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                >
                  <div className="mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-brand-cyan-dark" />
                    <h2 className="font-display text-lg font-bold text-brand-primary">
                      Recursos Descargables
                    </h2>
                  </div>
                  <div className="space-y-3">
                    {selectedLesson.resources.map((resource) => (
                      <div
                        key={resource.id}
                        className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-4 transition-all hover:border-brand-cyan-dark hover:bg-white"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                            <FileText className="h-5 w-5 text-red-600" />
                          </div>
                          <div>
                            <p className="font-bold text-brand-primary">{resource.title}</p>
                            {resource.size && (
                              <p className="text-xs text-gray-500">{resource.size}</p>
                            )}
                          </div>
                        </div>
                        <a
                          href={resource.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 rounded-lg bg-brand-cyan-dark px-4 py-2 text-sm font-bold text-white transition-all hover:bg-brand-cyan"
                        >
                          <Download className="h-4 w-4" />
                          Descargar
                        </a>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Mobile Lesson Selector */}
              <div className="lg:hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <h3 className="font-display font-bold text-brand-primary mb-3">
                  Lecciones del Módulo
                </h3>
                <div className="space-y-1">
                  {lessons.map((lesson, index) => (
                    <button
                      key={lesson.id}
                      onClick={() => setSelectedLesson(lesson)}
                      className={`w-full text-left flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all ${
                        selectedLesson?.id === lesson.id
                          ? "bg-brand-cyan-dark/10 text-brand-cyan-dark"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shrink-0 ${
                        selectedLesson?.id === lesson.id
                          ? "bg-brand-cyan-dark text-white"
                          : "bg-gray-100 text-gray-500"
                      }`}>
                        {lesson.order || index + 1}
                      </span>
                      <span className="text-sm font-semibold truncate">{lesson.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-gray-200">
              <Video className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">No hay lecciones</h3>
              <p className="text-sm text-gray-500 mt-1">
                Este módulo aún no tiene lecciones
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
