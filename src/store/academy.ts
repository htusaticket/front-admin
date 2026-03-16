import { toast } from "sonner";
import { create } from "zustand";

import api, { getErrorMessage } from "@/lib/api";
import type { ApiResponse } from "@/types/admin";

// Types
export interface LessonResource {
  id: number;
  title: string;
  fileUrl: string;
  type: "PDF" | "LINK" | "VIDEO" | "DOCUMENT";
  size?: string;
}

export interface Lesson {
  id: number;
  title: string;
  description?: string;
  duration: string;
  contentUrl?: string;
  order: number;
  moduleId: number;
  resources: LessonResource[];
  createdAt?: string;
}

export interface Module {
  id: number;
  title: string;
  description: string;
  image: string;
  order: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  visibleForSkillBuilder: boolean;
  lessonsCount: number;
  createdAt: string;
  updatedAt: string;
  lessons?: Lesson[];
}

export interface ModulesListResponse {
  modules: Module[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateModuleData {
  title: string;
  description: string;
  image?: string;
  order?: number;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  visibleForSkillBuilder?: boolean;
}

export interface CreateLessonData {
  title: string;
  description?: string;
  duration: string;
  contentUrl?: string;
  order?: number;
}

export interface CreateResourceData {
  title: string;
  fileUrl: string;
  type: "PDF" | "LINK" | "VIDEO" | "DOCUMENT";
  size?: string;
}

interface AcademyState {
  modules: Module[];
  selectedModule: Module | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  total: number;
  page: number;
  totalPages: number;
}

interface AcademyActions {
  fetchModules: (params?: { page?: number; limit?: number; search?: string }) => Promise<void>;
  fetchModuleById: (id: number) => Promise<void>;
  createModule: (data: CreateModuleData) => Promise<{ success: boolean; message: string }>;
  updateModule: (id: number, data: Partial<CreateModuleData>) => Promise<{ success: boolean; message: string }>;
  deleteModule: (id: number) => Promise<{ success: boolean; message: string }>;
  createLesson: (moduleId: number, data: CreateLessonData) => Promise<{ success: boolean; message: string }>;
  updateLesson: (lessonId: number, data: Partial<CreateLessonData>) => Promise<{ success: boolean; message: string }>;
  deleteLesson: (lessonId: number) => Promise<{ success: boolean; message: string }>;
  addResource: (lessonId: number, data: CreateResourceData) => Promise<{ success: boolean; message: string }>;
  uploadResource: (lessonId: number, file: File) => Promise<{ success: boolean; message: string }>;
  deleteResource: (resourceId: number) => Promise<{ success: boolean; message: string }>;
  reorderModules: (orderedIds: number[]) => Promise<{ success: boolean; message: string }>;
  reorderLessons: (moduleId: number, orderedIds: number[]) => Promise<{ success: boolean; message: string }>;
  clearError: () => void;
  clearSelectedModule: () => void;
}

type AcademyStore = AcademyState & AcademyActions;

const initialState: AcademyState = {
  modules: [],
  selectedModule: null,
  isLoading: false,
  isSaving: false,
  error: null,
  total: 0,
  page: 1,
  totalPages: 1,
};

export const useAcademyStore = create<AcademyStore>((set, get) => ({
  ...initialState,

  fetchModules: async (params) => {
    set({ isLoading: true, error: null });
    
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.limit) queryParams.append("limit", params.limit.toString());
      if (params?.search) queryParams.append("search", params.search);

      const response = await api.get<ApiResponse<ModulesListResponse>>(
        `/api/admin/academy/modules?${queryParams.toString()}`,
      );
      
      const data = response.data.data;
      
      set({
        modules: data.modules,
        total: data.total,
        page: data.page,
        totalPages: data.totalPages,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      set({ error: errorMessage, isLoading: false });
      toast.error(errorMessage);
    }
  },

  fetchModuleById: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await api.get<ApiResponse<Module>>(
        `/api/admin/academy/modules/${id}`,
      );
      
      set({ selectedModule: response.data.data, isLoading: false });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      set({ error: errorMessage, isLoading: false });
      toast.error(errorMessage);
    }
  },

  createModule: async (data) => {
    set({ isSaving: true, error: null });
    
    try {
      const response = await api.post<ApiResponse<Module>>(
        "/api/admin/academy/modules",
        data,
      );
      
      // Refresh modules list
      await get().fetchModules();
      
      set({ isSaving: false });
      toast.success("Módulo creado correctamente");
      return { success: true, message: response.data.message || "Módulo creado" };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      set({ error: errorMessage, isSaving: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  updateModule: async (id, data) => {
    set({ isSaving: true, error: null });
    
    try {
      const response = await api.put<ApiResponse<Module>>(
        `/api/admin/academy/modules/${id}`,
        data,
      );
      
      // Update in local state
      set((state) => ({
        modules: state.modules.map((m) => 
          m.id === id ? { ...m, ...response.data.data } : m,
        ),
        selectedModule: state.selectedModule?.id === id 
          ? { ...state.selectedModule, ...response.data.data }
          : state.selectedModule,
        isSaving: false,
      }));
      
      toast.success("Módulo actualizado correctamente");
      return { success: true, message: response.data.message || "Módulo actualizado" };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      set({ error: errorMessage, isSaving: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  deleteModule: async (id) => {
    set({ isSaving: true, error: null });
    
    try {
      await api.delete(`/api/admin/academy/modules/${id}`);
      
      // Remove from local state
      set((state) => ({
        modules: state.modules.filter((m) => m.id !== id),
        selectedModule: state.selectedModule?.id === id ? null : state.selectedModule,
        isSaving: false,
      }));
      
      toast.success("Módulo eliminado correctamente");
      return { success: true, message: "Módulo eliminado" };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      set({ error: errorMessage, isSaving: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  createLesson: async (moduleId, data) => {
    set({ isSaving: true, error: null });
    
    try {
      await api.post<ApiResponse<Lesson>>(
        `/api/admin/academy/modules/${moduleId}/lessons`,
        data,
      );
      
      // Refresh module to get updated lessons
      await get().fetchModuleById(moduleId);
      
      set({ isSaving: false });
      toast.success("Lección creada correctamente");
      return { success: true, message: "Lección creada" };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      set({ error: errorMessage, isSaving: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  updateLesson: async (lessonId, data) => {
    set({ isSaving: true, error: null });
    
    try {
      const response = await api.put<ApiResponse<Lesson>>(
        `/api/admin/academy/lessons/${lessonId}`,
        data,
      );
      
      // Update in selected module if exists
      const { selectedModule } = get();
      if (selectedModule?.lessons) {
        set({
          selectedModule: {
            ...selectedModule,
            lessons: selectedModule.lessons.map((l) =>
              l.id === lessonId ? { ...l, ...response.data.data } : l,
            ),
          },
          isSaving: false,
        });
      } else {
        set({ isSaving: false });
      }
      
      toast.success("Lección actualizada correctamente");
      return { success: true, message: "Lección actualizada" };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      set({ error: errorMessage, isSaving: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  deleteLesson: async (lessonId) => {
    set({ isSaving: true, error: null });
    
    try {
      await api.delete(`/api/admin/academy/lessons/${lessonId}`);
      
      // Remove from selected module if exists
      const { selectedModule } = get();
      if (selectedModule?.lessons) {
        set({
          selectedModule: {
            ...selectedModule,
            lessons: selectedModule.lessons.filter((l) => l.id !== lessonId),
            lessonsCount: selectedModule.lessonsCount - 1,
          },
          isSaving: false,
        });
      } else {
        set({ isSaving: false });
      }
      
      toast.success("Lección eliminada correctamente");
      return { success: true, message: "Lección eliminada" };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      set({ error: errorMessage, isSaving: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  addResource: async (lessonId, data) => {
    set({ isSaving: true, error: null });
    
    try {
      await api.post<ApiResponse<LessonResource>>(
        `/api/admin/academy/lessons/${lessonId}/resources`,
        data,
      );
      
      // Refresh module to get updated resources
      const { selectedModule } = get();
      if (selectedModule) {
        await get().fetchModuleById(selectedModule.id);
      }
      
      set({ isSaving: false });
      toast.success("Recurso agregado correctamente");
      return { success: true, message: "Recurso agregado" };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      set({ error: errorMessage, isSaving: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  deleteResource: async (resourceId) => {
    set({ isSaving: true, error: null });
    
    try {
      await api.delete(`/api/admin/academy/resources/${resourceId}`);
      
      // Refresh module to get updated resources
      const { selectedModule } = get();
      if (selectedModule) {
        await get().fetchModuleById(selectedModule.id);
      }
      
      set({ isSaving: false });
      toast.success("Recurso eliminado correctamente");
      return { success: true, message: "Recurso eliminado" };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      set({ error: errorMessage, isSaving: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  clearError: () => set({ error: null }),
  clearSelectedModule: () => set({ selectedModule: null }),

  uploadResource: async (lessonId, file) => {
    set({ isSaving: true, error: null });
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      await api.post<ApiResponse<LessonResource>>(
        `/api/admin/academy/lessons/${lessonId}/resources/upload`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      
      const { selectedModule } = get();
      if (selectedModule) {
        await get().fetchModuleById(selectedModule.id);
      }
      
      set({ isSaving: false });
      toast.success("Archivo subido correctamente");
      return { success: true, message: "Archivo subido" };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      set({ error: errorMessage, isSaving: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  reorderModules: async (orderedIds) => {
    set({ isSaving: true, error: null });
    
    try {
      await api.put("/api/admin/academy/modules/reorder", { orderedIds });
      
      await get().fetchModules();
      
      set({ isSaving: false });
      toast.success("Orden de módulos actualizado");
      return { success: true, message: "Orden actualizado" };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      set({ error: errorMessage, isSaving: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  reorderLessons: async (moduleId, orderedIds) => {
    set({ isSaving: true, error: null });
    
    try {
      await api.put(`/api/admin/academy/modules/${moduleId}/lessons/reorder`, { orderedIds });
      
      await get().fetchModuleById(moduleId);
      
      set({ isSaving: false });
      toast.success("Orden de lecciones actualizado");
      return { success: true, message: "Orden actualizado" };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      set({ error: errorMessage, isSaving: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },
}));
