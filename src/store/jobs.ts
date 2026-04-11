import { toast } from "sonner";
import { create } from "zustand";

import api, { getErrorMessage } from "@/lib/api";
import type { ApiResponse } from "@/types/admin";

// Types
export interface JobApplication {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  status: string;
  notes?: string;
  appliedAt: string;
}

export interface JobOffer {
  id: number;
  title: string;
  company: string;
  location: string;
  salaryRange: string;
  oteMin: number;
  oteMax: number;
  revenue: number;
  type: string;
  description: string;
  requirements: string[];
  isActive: boolean;
  applicationsCount: number;
  social?: string | null;
  recruiterSocial?: string | null;
  website?: string | null;
  email?: string | null;
  code?: string | null;
  createdAt: string;
  updatedAt: string;
  applications?: JobApplication[];
}

export interface JobsListResponse {
  jobs: JobOffer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateJobData {
  title: string;
  company: string;
  salaryRange?: string;
  oteMin?: number;
  oteMax?: number;
  revenue?: number;
  type?: string;
  description?: string;
  requirements?: string[];
  isActive?: boolean;
  social?: string;
  recruiterSocial?: string;
  website?: string;
  email?: string;
  code?: string;
}

export interface BulkCreateResponse {
  created: number;
  failed: number;
  errors?: string[];
}

interface JobsState {
  jobs: JobOffer[];
  selectedJob: JobOffer | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  total: number;
  page: number;
  totalPages: number;
}

interface JobsActions {
  fetchJobs: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
    type?: string;
  }) => Promise<void>;
  fetchJobById: (id: number) => Promise<void>;
  createJob: (data: CreateJobData) => Promise<{ success: boolean; message: string }>;
  updateJob: (id: number, data: Partial<CreateJobData>) => Promise<{ success: boolean; message: string }>;
  deleteJob: (id: number) => Promise<{ success: boolean; message: string }>;
  bulkCreateJobs: (jobs: CreateJobData[]) => Promise<BulkCreateResponse>;
  clearError: () => void;
  clearSelectedJob: () => void;
}

type JobsStore = JobsState & JobsActions;

const initialState: JobsState = {
  jobs: [],
  selectedJob: null,
  isLoading: false,
  isSaving: false,
  error: null,
  total: 0,
  page: 1,
  totalPages: 1,
};

export const useJobsStore = create<JobsStore>((set, get) => ({
  ...initialState,

  fetchJobs: async (params) => {
    set({ isLoading: true, error: null });
    
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.limit) queryParams.append("limit", params.limit.toString());
      if (params?.search) queryParams.append("search", params.search);
      if (params?.isActive !== undefined) queryParams.append("isActive", params.isActive.toString());
      if (params?.type) queryParams.append("type", params.type);

      const response = await api.get<ApiResponse<JobsListResponse>>(
        `/api/admin/jobs?${queryParams.toString()}`,
      );
      
      const data = response.data.data;
      
      set({
        jobs: data.jobs,
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

  fetchJobById: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await api.get<ApiResponse<JobOffer>>(
        `/api/admin/jobs/${id}`,
      );
      
      set({ selectedJob: response.data.data, isLoading: false });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      set({ error: errorMessage, isLoading: false });
      toast.error(errorMessage);
    }
  },

  createJob: async (data) => {
    set({ isSaving: true, error: null });
    
    try {
      const response = await api.post<ApiResponse<JobOffer>>(
        "/api/admin/jobs",
        data,
      );
      
      // Refresh jobs list
      await get().fetchJobs();
      
      set({ isSaving: false });
      toast.success("Oferta de trabajo creada correctamente");
      return { success: true, message: response.data.message || "Oferta creada" };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      set({ error: errorMessage, isSaving: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  updateJob: async (id, data) => {
    set({ isSaving: true, error: null });
    
    try {
      const response = await api.put<ApiResponse<JobOffer>>(
        `/api/admin/jobs/${id}`,
        data,
      );
      
      // Update in local state
      set((state) => ({
        jobs: state.jobs.map((j) => 
          j.id === id ? { ...j, ...response.data.data } : j,
        ),
        selectedJob: state.selectedJob?.id === id 
          ? { ...state.selectedJob, ...response.data.data }
          : state.selectedJob,
        isSaving: false,
      }));
      
      toast.success("Oferta actualizada correctamente");
      return { success: true, message: response.data.message || "Oferta actualizada" };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      set({ error: errorMessage, isSaving: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  deleteJob: async (id) => {
    set({ isSaving: true, error: null });
    
    try {
      await api.delete(`/api/admin/jobs/${id}`);
      
      // Remove from local state
      set((state) => ({
        jobs: state.jobs.filter((j) => j.id !== id),
        selectedJob: state.selectedJob?.id === id ? null : state.selectedJob,
        isSaving: false,
      }));
      
      toast.success("Oferta eliminada correctamente");
      return { success: true, message: "Oferta eliminada" };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      set({ error: errorMessage, isSaving: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  bulkCreateJobs: async (jobs) => {
    set({ isSaving: true, error: null });
    
    try {
      const response = await api.post<ApiResponse<BulkCreateResponse>>(
        "/api/admin/jobs/bulk",
        { jobs },
      );
      
      const result = response.data.data;
      
      // Refresh jobs list
      await get().fetchJobs();
      
      set({ isSaving: false });
      
      if (result.created > 0) {
        toast.success(`${result.created} ofertas creadas correctamente`);
      }
      if (result.failed > 0) {
        toast.warning(`${result.failed} ofertas fallaron`);
      }
      
      return result;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      set({ error: errorMessage, isSaving: false });
      toast.error(errorMessage);
      return { created: 0, failed: 0, errors: [errorMessage] };
    }
  },

  clearError: () => set({ error: null }),
  clearSelectedJob: () => set({ selectedJob: null }),
}));
