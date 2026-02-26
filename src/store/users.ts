import { create } from "zustand";

import api, { getErrorMessage } from "@/lib/api";
import type {
  AdminUser,
  AdminUserDetail,
  GetUsersQuery,
  CreateUserPayload,
  UpdateUserPayload,
  UpdateStatusPayload,
  IssueStrikePayload,
  UpdateNotesPayload,
  PaginatedResponse,
  ApiResponse,
} from "@/types/admin";

interface UsersState {
  users: AdminUser[];
  selectedUser: AdminUserDetail | null;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
}

interface UsersActions {
  fetchUsers: (query?: GetUsersQuery) => Promise<void>;
  fetchUserDetails: (userId: string) => Promise<void>;
  createUser: (data: CreateUserPayload) => Promise<{ success: boolean; message?: string }>;
  updateUser: (userId: string, data: UpdateUserPayload) => Promise<{ success: boolean; message?: string }>;
  updateUserStatus: (userId: string, data: UpdateStatusPayload) => Promise<{ success: boolean; message?: string }>;
  updateUserNotes: (userId: string, data: UpdateNotesPayload) => Promise<{ success: boolean; message?: string }>;
  issueStrike: (userId: string, data: IssueStrikePayload) => Promise<{ success: boolean; message?: string }>;
  clearError: () => void;
  clearSelectedUser: () => void;
  reset: () => void;
}

type UsersStore = UsersState & UsersActions;

const initialState: UsersState = {
  users: [],
  selectedUser: null,
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
  isLoading: false,
  error: null,
};

export const useUsersStore = create<UsersStore>((set, get) => ({
  ...initialState,

  fetchUsers: async (query?: GetUsersQuery) => {
    set({ isLoading: true, error: null });
    
    try {
      const params = new URLSearchParams();
      if (query?.page) params.append("page", String(query.page));
      if (query?.limit) params.append("limit", String(query.limit));
      if (query?.search) params.append("search", query.search);
      if (query?.role) params.append("role", query.role);
      if (query?.status) params.append("status", query.status);
      if (query?.plan) params.append("plan", query.plan);
      if (query?.sortBy) params.append("sortBy", query.sortBy);
      if (query?.sortOrder) params.append("sortOrder", query.sortOrder);

      const response = await api.get<ApiResponse<PaginatedResponse<AdminUser>>>(
        `/api/admin/users?${params.toString()}`,
      );
      
      // Backend returns 'users' instead of 'items'
      const responseData = response.data.data as unknown as { 
        users: AdminUser[]; 
        total: number; 
        page: number; 
        limit: number; 
        totalPages: number 
      };
      const { users, total, page, limit, totalPages } = responseData;
      
      set({ 
        users: users || [], 
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

  fetchUserDetails: async (userId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await api.get<ApiResponse<AdminUserDetail>>(
        `/api/admin/users/${userId}/details`,
      );
      
      set({ selectedUser: response.data.data, isLoading: false });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  createUser: async (data: CreateUserPayload) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await api.post<ApiResponse<AdminUser>>("/api/admin/users", data);
      
      // Recargar lista de usuarios
      await get().fetchUsers({ page: 1, limit: get().limit });
      
      set({ isLoading: false });
      return { success: true, message: response.data.message };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      set({ error: errorMessage, isLoading: false });
      return { success: false, message: errorMessage };
    }
  },

  updateUser: async (userId: string, data: UpdateUserPayload) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await api.patch<ApiResponse<AdminUser>>(
        `/api/admin/users/${userId}`, 
        data,
      );
      
      // Actualizar usuario en la lista local si existe
      set(state => ({
        users: state.users.map(u => 
          u.id === userId ? { ...u, ...data } : u,
        ),
        isLoading: false,
      }));
      
      // Si hay usuario seleccionado, actualizarlo también
      if (get().selectedUser?.id === userId) {
        await get().fetchUserDetails(userId);
      }
      
      return { success: true, message: response.data.message };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      set({ error: errorMessage, isLoading: false });
      return { success: false, message: errorMessage };
    }
  },

  updateUserStatus: async (userId: string, data: UpdateStatusPayload) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await api.patch<ApiResponse<AdminUser>>(
        `/api/admin/users/${userId}/status`, 
        data,
      );
      
      // Actualizar usuario en la lista local
      set(state => ({
        users: state.users.map(u => 
          u.id === userId ? { ...u, status: data.status } : u,
        ),
        isLoading: false,
      }));
      
      // Si hay usuario seleccionado, actualizarlo
      if (get().selectedUser?.id === userId) {
        await get().fetchUserDetails(userId);
      }
      
      return { success: true, message: response.data.message };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      set({ error: errorMessage, isLoading: false });
      return { success: false, message: errorMessage };
    }
  },

  updateUserNotes: async (userId: string, data: UpdateNotesPayload) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await api.post<ApiResponse<{ notes: string }>>(
        `/api/admin/users/${userId}/notes`, 
        data,
      );
      
      // Actualizar notas en el usuario seleccionado
      if (get().selectedUser?.id === userId) {
        set(state => ({
          selectedUser: state.selectedUser 
            ? { ...state.selectedUser, adminNotes: data.notes }
            : null,
          isLoading: false,
        }));
      } else {
        set({ isLoading: false });
      }
      
      return { success: true, message: response.data.message };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      set({ error: errorMessage, isLoading: false });
      return { success: false, message: errorMessage };
    }
  },

  issueStrike: async (userId: string, data: IssueStrikePayload) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await api.post<ApiResponse<{ strikeCount: number; status: string }>>(
        `/api/admin/users/${userId}/strike`, 
        data,
      );
      
      // Actualizar conteo de strikes y status
      const { strikeCount, status } = response.data.data;
      
      set(state => ({
        users: state.users.map(u => 
          u.id === userId ? { ...u, strikeCount, status: status as AdminUser["status"] } : u,
        ),
        isLoading: false,
      }));
      
      // Si hay usuario seleccionado, recargar detalles
      if (get().selectedUser?.id === userId) {
        await get().fetchUserDetails(userId);
      }
      
      return { success: true, message: response.data.message };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      set({ error: errorMessage, isLoading: false });
      return { success: false, message: errorMessage };
    }
  },

  clearError: () => set({ error: null }),
  
  clearSelectedUser: () => set({ selectedUser: null }),

  reset: () => set(initialState),
}));
