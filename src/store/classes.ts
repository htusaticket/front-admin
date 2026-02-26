import { create } from "zustand";

import api, { getErrorMessage } from "@/lib/api";
import type {
  AdminClass,
  ClassAttendee,
  GetClassesQuery,
  CreateClassPayload,
  SaveAttendancePayload,
  PaginatedResponse,
  ApiResponse,
} from "@/types/admin";

interface ClassesState {
  classes: AdminClass[];
  selectedClassAttendees: ClassAttendee[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
}

interface ClassesActions {
  fetchClasses: (query?: GetClassesQuery) => Promise<void>;
  createClass: (data: CreateClassPayload) => Promise<{ success: boolean; message?: string }>;
  fetchClassAttendees: (classId: number) => Promise<{ success: boolean; message?: string }>;
  saveAttendance: (
    classId: number,
    data: SaveAttendancePayload,
  ) => Promise<{ success: boolean; message?: string; strikesIssued?: number }>;
  clearError: () => void;
  clearAttendees: () => void;
  reset: () => void;
}

type ClassesStore = ClassesState & ClassesActions;

const initialState: ClassesState = {
  classes: [],
  selectedClassAttendees: [],
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
  isLoading: false,
  error: null,
};

export const useClassesStore = create<ClassesStore>((set, get) => ({
  ...initialState,

  fetchClasses: async (query?: GetClassesQuery) => {
    set({ isLoading: true, error: null });
    
    try {
      const params = new URLSearchParams();
      if (query?.page) params.append("page", String(query.page));
      if (query?.limit) params.append("limit", String(query.limit));
      if (query?.type) params.append("type", query.type);
      if (query?.from) params.append("from", query.from);
      if (query?.to) params.append("to", query.to);

      const response = await api.get<ApiResponse<PaginatedResponse<AdminClass>>>(
        `/api/admin/classes?${params.toString()}`,
      );
      
      // Backend returns 'classes' instead of 'items'
      const responseData = response.data.data as unknown as { 
        classes: AdminClass[]; 
        total: number; 
        page: number; 
        limit: number; 
        totalPages: number 
      };
      const { classes, total, page, limit, totalPages } = responseData;
      
      set({ 
        classes: classes || [], 
        total, 
        page, 
        limit, 
        totalPages,
        isLoading: false, 
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  createClass: async (data: CreateClassPayload) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await api.post<ApiResponse<AdminClass>>("/api/admin/classes", data);
      
      // Recargar lista de clases
      await get().fetchClasses({ page: 1, limit: get().limit });
      
      set({ isLoading: false });
      return { success: true, message: response.data.message };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      set({ error: errorMessage, isLoading: false });
      return { success: false, message: errorMessage };
    }
  },

  fetchClassAttendees: async (classId: number) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await api.get<ApiResponse<ClassAttendee[]>>(
        `/api/admin/classes/${classId}/attendees`,
      );
      
      set({ selectedClassAttendees: response.data.data, isLoading: false });
      return { success: true };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      set({ error: errorMessage, isLoading: false });
      return { success: false, message: errorMessage };
    }
  },

  saveAttendance: async (classId: number, data: SaveAttendancePayload) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await api.post<ApiResponse<{ saved: number; strikesIssued: number }>>(
        `/api/admin/classes/${classId}/attendance`, 
        data,
      );
      
      const { strikesIssued } = response.data.data;
      
      // Actualizar lista de asistentes
      await get().fetchClassAttendees(classId);
      
      set({ isLoading: false });
      return { 
        success: true, 
        message: response.data.message,
        strikesIssued, 
      };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      set({ error: errorMessage, isLoading: false });
      return { success: false, message: errorMessage };
    }
  },

  clearError: () => set({ error: null }),
  
  clearAttendees: () => set({ selectedClassAttendees: [] }),

  reset: () => set(initialState),
}));
