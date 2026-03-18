import { toast } from "sonner";
import { create } from "zustand";

import api, { getErrorMessage } from "@/lib/api";
import type {
  ApiResponse,
  PaginatedResponse,
  Subscription,
  UserPlan,
  SubscriptionStatus,
} from "@/types/admin";

// ==================== TYPES ====================
export interface CreateSubscriptionDto {
  userId: string;
  plan: UserPlan;
  startDate: string;
  endDate: string;
  hasPaid?: boolean;
  paymentNote?: string;
}

export interface UpdateSubscriptionDto {
  plan?: UserPlan;
  status?: SubscriptionStatus;
  startDate?: string;
  endDate?: string;
  hasPaid?: boolean;
  paymentNote?: string;
}

export interface SubscriptionsFilters {
  page: number;
  limit: number;
  status?: SubscriptionStatus;
  plan?: UserPlan;
  search?: string;
}

// ==================== STATE ====================
interface SubscriptionsState {
  subscriptions: Subscription[];
  selectedSubscription: Subscription | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  filters: SubscriptionsFilters;
}

// ==================== ACTIONS ====================
interface SubscriptionsActions {
  fetchSubscriptions: (filters?: Partial<SubscriptionsFilters>) => Promise<void>;
  fetchSubscriptionById: (id: string) => Promise<void>;
  fetchUserActiveSubscription: (userId: string) => Promise<Subscription | null>;
  createSubscription: (data: CreateSubscriptionDto) => Promise<boolean>;
  updateSubscription: (id: string, data: UpdateSubscriptionDto) => Promise<boolean>;
  deleteSubscription: (id: string) => Promise<boolean>;
  cancelSubscription: (id: string) => Promise<boolean>;
  setFilters: (filters: Partial<SubscriptionsFilters>) => void;
  clearError: () => void;
  reset: () => void;
}

type SubscriptionsStore = SubscriptionsState & SubscriptionsActions;

// ==================== INITIAL STATE ====================
const initialState: SubscriptionsState = {
  subscriptions: [],
  selectedSubscription: null,
  isLoading: false,
  isSaving: false,
  error: null,
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  },
  filters: {
    page: 1,
    limit: 10,
    search: "",
  },
};

// ==================== STORE ====================
export const useSubscriptionsStore = create<SubscriptionsStore>((set, get) => ({
  ...initialState,

  fetchSubscriptions: async (filters) => {
    const currentFilters = { ...get().filters, ...filters };
    set({ isLoading: true, error: null, filters: currentFilters });

    try {
      const params = new URLSearchParams();
      params.append("page", currentFilters.page.toString());
      params.append("limit", currentFilters.limit.toString());
      if (currentFilters.status) params.append("status", currentFilters.status);
      if (currentFilters.plan) params.append("plan", currentFilters.plan);
      if (currentFilters.search) params.append("search", currentFilters.search);

      const response = await api.get<ApiResponse<PaginatedResponse<Subscription>>>(
        `/api/admin/subscriptions?${params.toString()}`,
      );

      // Backend returns 'subscriptions' field, not 'items'
      const data = response.data.data as {
        subscriptions?: Subscription[];
        items?: Subscription[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
      const subscriptions = data.subscriptions || data.items || [];
      const { total, page, limit, totalPages } = data;

      set({
        subscriptions,
        pagination: { total, page, limit, totalPages },
        isLoading: false,
      });
    } catch (error) {
      const message = getErrorMessage(error);
      set({ error: message, isLoading: false });
      toast.error(message);
    }
  },

  fetchSubscriptionById: async (id) => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.get<ApiResponse<Subscription>>(
        `/api/admin/subscriptions/${id}`,
      );
      set({ selectedSubscription: response.data.data, isLoading: false });
    } catch (error) {
      const message = getErrorMessage(error);
      set({ error: message, isLoading: false });
      toast.error(message);
    }
  },

  fetchUserActiveSubscription: async (userId) => {
    try {
      const response = await api.get<ApiResponse<Subscription>>(
        `/api/admin/subscriptions/user/${userId}/active`,
      );
      return response.data.data;
    } catch {
      return null;
    }
  },

  createSubscription: async (data) => {
    set({ isSaving: true, error: null });

    try {
      await api.post<ApiResponse<Subscription>>("/api/admin/subscriptions", data);
      toast.success("Subscription created successfully");
      set({ isSaving: false });
      get().fetchSubscriptions();
      return true;
    } catch (error) {
      const message = getErrorMessage(error);
      set({ error: message, isSaving: false });
      toast.error(message);
      return false;
    }
  },

  updateSubscription: async (id, data) => {
    set({ isSaving: true, error: null });

    try {
      await api.patch<ApiResponse<Subscription>>(`/api/admin/subscriptions/${id}`, data);
      toast.success("Subscription updated successfully");
      set({ isSaving: false });
      get().fetchSubscriptions();
      return true;
    } catch (error) {
      const message = getErrorMessage(error);
      set({ error: message, isSaving: false });
      toast.error(message);
      return false;
    }
  },

  deleteSubscription: async (id) => {
    set({ isSaving: true, error: null });

    try {
      await api.delete(`/api/admin/subscriptions/${id}`);
      toast.success("Subscription deleted successfully");
      set({ isSaving: false });
      get().fetchSubscriptions();
      return true;
    } catch (error) {
      const message = getErrorMessage(error);
      set({ error: message, isSaving: false });
      toast.error(message);
      return false;
    }
  },

  cancelSubscription: async (id) => {
    set({ isSaving: true, error: null });

    try {
      await api.post(`/api/admin/subscriptions/${id}/cancel`);
      toast.success("Subscription cancelled successfully");
      set({ isSaving: false });
      get().fetchSubscriptions();
      return true;
    } catch (error) {
      const message = getErrorMessage(error);
      set({ error: message, isSaving: false });
      toast.error(message);
      return false;
    }
  },

  setFilters: (filters) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
    }));
  },

  clearError: () => set({ error: null }),

  reset: () => set(initialState),
}));
