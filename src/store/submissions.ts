import { create } from "zustand";

import api, { getErrorMessage } from "@/lib/api";
import type {
  AdminSubmission,
  GetSubmissionsQuery,
  ReviewSubmissionPayload,
  PaginatedResponse,
  ApiResponse,
} from "@/types/admin";

interface SubmissionsState {
  submissions: AdminSubmission[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
}

interface SubmissionsActions {
  fetchSubmissions: (query?: GetSubmissionsQuery) => Promise<void>;
  reviewSubmission: (
    submissionId: string,
    data: ReviewSubmissionPayload,
  ) => Promise<{ success: boolean; message?: string }>;
  clearError: () => void;
  reset: () => void;
}

type SubmissionsStore = SubmissionsState & SubmissionsActions;

const initialState: SubmissionsState = {
  submissions: [],
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
  isLoading: false,
  error: null,
};

export const useSubmissionsStore = create<SubmissionsStore>((set, _get) => ({
  ...initialState,

  fetchSubmissions: async (query?: GetSubmissionsQuery) => {
    set({ isLoading: true, error: null });
    
    try {
      const params = new URLSearchParams();
      if (query?.page) params.append("page", String(query.page));
      if (query?.limit) params.append("limit", String(query.limit));
      if (query?.status) params.append("status", query.status);
      if (query?.type) params.append("type", query.type);

      const response = await api.get<ApiResponse<PaginatedResponse<AdminSubmission>>>(
        `/api/admin/submissions?${params.toString()}`,
      );
      
      // Backend returns 'submissions' instead of 'items'
      const responseData = response.data.data as unknown as { 
        submissions: AdminSubmission[]; 
        total: number; 
        page: number; 
        limit: number; 
        totalPages: number 
      };
      const { submissions, total, page, limit, totalPages } = responseData;
      
      set({ 
        submissions: submissions || [], 
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

  reviewSubmission: async (submissionId: string, data: ReviewSubmissionPayload) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await api.post<ApiResponse<AdminSubmission>>(
        `/api/admin/submissions/${submissionId}/review`, 
        data,
      );
      
      // Actualizar la submission en la lista local
      set(state => ({
        submissions: state.submissions.map(s => 
          s.id === submissionId 
            ? { 
              ...s, 
              status: data.status, 
              feedback: data.feedback,
              score: data.score ?? s.score,
            } 
            : s,
        ),
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

  reset: () => set(initialState),
}));
