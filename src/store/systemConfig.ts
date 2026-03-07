import { toast } from "sonner";
import { create } from "zustand";

import api, { getErrorMessage } from "@/lib/api";
import type { ApiResponse } from "@/types/admin";

// ==================== TYPES ====================
export interface SystemConfig {
  id: string;
  strikesEnabled: boolean;
  maxStrikesForPunishment: number;
  punishmentDurationDays: number;
  lateCancellationHours: number;
  jobBoardEnabled: boolean;
  academyEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSystemConfigDto {
  strikesEnabled?: boolean;
  maxStrikesForPunishment?: number;
  punishmentDurationDays?: number;
  lateCancellationHours?: number;
  jobBoardEnabled?: boolean;
  academyEnabled?: boolean;
}

// Response type for update
interface UpdateConfigResponse {
  config: SystemConfig;
  message: string;
}

// ==================== STATE ====================
interface SystemConfigState {
  config: SystemConfig | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
}

// ==================== ACTIONS ====================
interface SystemConfigActions {
  fetchConfig: () => Promise<void>;
  updateConfig: (data: UpdateSystemConfigDto) => Promise<boolean>;
  clearError: () => void;
}

type SystemConfigStore = SystemConfigState & SystemConfigActions;

// ==================== INITIAL STATE ====================
const initialState: SystemConfigState = {
  config: null,
  isLoading: false,
  isSaving: false,
  error: null,
};

// ==================== STORE ====================
export const useSystemConfigStore = create<SystemConfigStore>((set) => ({
  ...initialState,

  fetchConfig: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.get<ApiResponse<SystemConfig>>(
        "/api/admin/system-config",
      );
      set({ config: response.data.data, isLoading: false });
    } catch (error) {
      const message = getErrorMessage(error);
      set({ error: message, isLoading: false });
      toast.error(message);
    }
  },

  updateConfig: async (data) => {
    set({ isSaving: true, error: null });

    try {
      const response = await api.patch<ApiResponse<UpdateConfigResponse>>(
        "/api/admin/system-config",
        data,
      );
      // Backend returns { config, message } so we extract config
      set({ config: response.data.data.config, isSaving: false });
      toast.success("Configuration updated successfully");
      return true;
    } catch (error) {
      const message = getErrorMessage(error);
      set({ error: message, isSaving: false });
      toast.error(message);
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));
