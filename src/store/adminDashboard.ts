import { create } from "zustand";

import api, { getErrorMessage } from "@/lib/api";
import type { ApiResponse } from "@/types/admin";

// Types for admin dashboard
export interface DashboardStats {
  totalUsers: number;
  pendingUsers: number;
  activeUsers: number;
  activeJobs: number;
  classesToday: number;
  totalApplications: number;
  pendingApplications: number;
  activeCourses: number;
  pendingCorrections: number;
}

export interface RecentActivity {
  id: string;
  type: "NEW_USER" | "JOB_APPLICATION" | "CLASS_FINISHED" | "NEW_COURSE" | "USER_APPROVED" | "NEW_SUBMISSION";
  title: string;
  description: string;
  createdAt: string;
}

export interface AdminNotification {
  id: string;
  type: "NEW_REGISTRATION" | "NEW_COURSE" | "NEW_SUBMISSION" | "USER_SUSPENDED" | "SYSTEM";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}

interface AdminDashboardState {
  stats: DashboardStats | null;
  recentActivity: RecentActivity[];
  notifications: AdminNotification[];
  unreadCount: number;
  isLoading: boolean;
  isLoadingNotifications: boolean;
  error: string | null;
}

interface AdminDashboardActions {
  fetchDashboard: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  clearError: () => void;
}

type AdminDashboardStore = AdminDashboardState & AdminDashboardActions;

const initialState: AdminDashboardState = {
  stats: null,
  recentActivity: [],
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  isLoadingNotifications: false,
  error: null,
};

export const useAdminDashboardStore = create<AdminDashboardStore>((set) => ({
  ...initialState,

  fetchDashboard: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await api.get<ApiResponse<{ stats: DashboardStats; recentActivity: RecentActivity[] }>>(
        "/api/admin/dashboard",
      );
      
      const { stats, recentActivity } = response.data.data;
      
      set({ 
        stats, 
        recentActivity,
        isLoading: false, 
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchNotifications: async () => {
    set({ isLoadingNotifications: true });
    
    try {
      const response = await api.get<ApiResponse<{ notifications: AdminNotification[]; unreadCount: number }>>(
        "/api/admin/dashboard/notifications",
      );
      
      const { notifications, unreadCount } = response.data.data;
      
      set({ 
        notifications, 
        unreadCount,
        isLoadingNotifications: false, 
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      set({ error: errorMessage, isLoadingNotifications: false });
    }
  },

  markNotificationAsRead: async (id: string) => {
    try {
      await api.post(`/api/admin/dashboard/notifications/${id}/read`);
      
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n,
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  },

  clearError: () => set({ error: null }),
}));
