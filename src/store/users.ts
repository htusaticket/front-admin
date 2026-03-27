import { toast } from "sonner";
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
  RejectRegistrationPayload,
  ActivateUserPayload,
  ApproveRegistrationPayload,
  ApproveRegistrationResponse,
  RejectRegistrationResponse,
  ActivateUserResponse,
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
  removePunishment: (userId: string) => Promise<{ success: boolean; message?: string }>;
  approveRegistration: (
    userId: string,
    data: ApproveRegistrationPayload,
  ) => Promise<{ success: boolean; message?: string }>;
  rejectRegistration: (
    userId: string,
    data: RejectRegistrationPayload,
  ) => Promise<{ success: boolean; message?: string }>;
  activateUser: (userId: string, data: ActivateUserPayload) => Promise<{ success: boolean; message?: string }>;
  deleteUser: (userId: string) => Promise<{ success: boolean; message?: string }>;
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
      
      // Map backend moduleProgress to frontend academyProgress
      const data = response.data.data;
      const raw = data as unknown as Record<string, unknown>;
      if (!data.academyProgress && raw.moduleProgress) {
        const mp = raw.moduleProgress as { moduleId: number; moduleTitle: string; progress: number; status: string }[];
        data.academyProgress = mp.map((m) => ({
          courseId: m.moduleId,
          courseName: m.moduleTitle,
          progress: m.progress,
          completedLessons: m.progress === 100 ? 1 : 0,
          totalLessons: 1,
        }));
      }

      // Map backend enrollments (title/startTime) to frontend type (topic/scheduledAt)
      if (raw.enrollments && Array.isArray(raw.enrollments)) {
        data.enrollments = (raw.enrollments as Array<Record<string, unknown>>).map((e) => {
          const cs = e.classSession as Record<string, unknown>;
          return {
            id: String(e.id),
            attendanceStatus: (e.attendanceStatus as import("@/types/admin").AttendanceStatus) || null,
            attendanceMarkedAt: (e.attendanceMarkedAt as string) || null,
            classSession: {
              id: cs.id as number,
              topic: (cs.topic as string) || (cs.title as string) || "",
              scheduledAt: (cs.scheduledAt as string) || (cs.startTime as string) || "",
              type: cs.type as string,
            },
          };
        });
      }
      
      set({ selectedUser: data, isLoading: false });
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
      
      // Re-fetch user details to get the updated JSON notes structure
      // instead of optimistically setting plain text which breaks the per-admin JSON format
      if (get().selectedUser?.id === userId) {
        try {
          const detailResponse = await api.get<ApiResponse<AdminUserDetail>>(
            `/api/admin/users/${userId}/details`,
          );
          set({
            selectedUser: detailResponse.data.data,
            isLoading: false,
          });
        } catch {
          // If re-fetch fails, just clear loading
          set({ isLoading: false });
        }
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
      const response = await api.post<ApiResponse<{ 
        totalStrikes: number; 
        userPunished: boolean;
        punishedUntil: string | null;
      }>>(
        `/api/admin/users/${userId}/strike`, 
        data,
      );
      
      // Actualizar conteo de strikes en la lista
      const { totalStrikes, userPunished, punishedUntil } = response.data.data;
      
      set(state => ({
        users: state.users.map(u => 
          u.id === userId 
            ? { 
              ...u, 
              strikeCount: totalStrikes,
              isPunished: userPunished,
              punishedUntil: punishedUntil,
            } 
            : u,
        ),
        isLoading: false,
      }));
      
      // Si hay usuario seleccionado, recargar detalles
      if (get().selectedUser?.id === userId) {
        await get().fetchUserDetails(userId);
      }
      
      toast.success(response.data.message || "Strike issued successfully");
      return { success: true, message: response.data.message };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      set({ isLoading: false });
      return { success: false, message: errorMessage };
    }
  },

  removePunishment: async (userId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await api.post<ApiResponse<{ message: string }>>(
        `/api/admin/users/${userId}/remove-punishment`,
      );
      
      // Update user in local list
      set(state => ({
        users: state.users.map(u => 
          u.id === userId 
            ? { ...u, isPunished: false, punishedUntil: null, strikeCount: 0 } 
            : u,
        ),
        isLoading: false,
      }));
      
      // Reload details if viewing this user
      if (get().selectedUser?.id === userId) {
        await get().fetchUserDetails(userId);
      }
      
      toast.success(response.data.message || "Punishment removed successfully");
      return { success: true, message: response.data.message };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      set({ error: errorMessage, isLoading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  approveRegistration: async (userId: string, data: ApproveRegistrationPayload) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await api.post<ApiResponse<ApproveRegistrationResponse>>(
        `/api/admin/users/${userId}/approve`,
        data,
      );
      
      // Actualizar usuario en la lista local (PENDING -> ACTIVE)
      set(state => ({
        users: state.users.map(u => 
          u.id === userId ? { ...u, status: "ACTIVE" as const } : u,
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

  rejectRegistration: async (userId: string, data: RejectRegistrationPayload) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await api.delete<ApiResponse<RejectRegistrationResponse>>(
        `/api/admin/users/${userId}/reject`,
        { data },
      );
      
      // Eliminar usuario de la lista local
      set(state => ({
        users: state.users.filter(u => u.id !== userId),
        selectedUser: state.selectedUser?.id === userId ? null : state.selectedUser,
        total: state.total - 1,
        isLoading: false,
      }));
      
      return { success: true, message: response.data.message };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      set({ error: errorMessage, isLoading: false });
      return { success: false, message: errorMessage };
    }
  },

  activateUser: async (userId: string, data: ActivateUserPayload) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await api.post<ApiResponse<ActivateUserResponse>>(
        `/api/admin/users/${userId}/activate`,
        data,
      );
      
      const { plan } = response.data.data;
      
      // Actualizar usuario en la lista local (INACTIVE -> ACTIVE)
      set(state => ({
        users: state.users.map(u => 
          u.id === userId ? { ...u, status: "ACTIVE" as const, plan } : u,
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

  deleteUser: async (userId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await api.delete<ApiResponse<{ message: string }>>(
        `/api/admin/users/${userId}`,
      );
      
      // Remove user from local list
      set(state => ({
        users: state.users.filter(u => u.id !== userId),
        selectedUser: state.selectedUser?.id === userId ? null : state.selectedUser,
        total: state.total - 1,
        isLoading: false,
      }));
      
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
