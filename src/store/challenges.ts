import { toast } from "sonner";
import { create } from "zustand";

import api, { getErrorMessage } from "@/lib/api";
import type { ApiResponse } from "@/types/admin";

// Types
export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

// Backend response interface
interface BackendChallenge {
  id: number;
  title: string;
  instructions: string;
  type: "AUDIO" | "MULTIPLE_CHOICE";
  date: string; // Backend uses 'date'
  questions?: QuizQuestion[];
  audioUrl?: string;
  points: number;
  isActive: boolean;
  visibleForSkillBuilder: boolean;
  visibleForSkillBuilderLive: boolean;
  submissionsCount: number;
  pendingSubmissions: number;
  createdAt: string;
  updatedAt: string;
}

// Frontend interface
export interface Challenge {
  id: number;
  title: string;
  description: string;
  type: "AUDIO" | "MULTIPLE_CHOICE";
  scheduledDate: string;
  quizQuestions?: QuizQuestion[];
  audioUrl?: string;
  points: number;
  isActive: boolean;
  visibleForSkillBuilder: boolean;
  visibleForSkillBuilderLive: boolean;
  submissionsCount: number;
  pendingSubmissions: number;
  createdAt: string;
  updatedAt: string;
}

// Transform backend response to frontend format
const transformChallenge = (backend: BackendChallenge): Challenge => ({
  id: backend.id,
  title: backend.title,
  description: backend.instructions,
  type: backend.type,
  scheduledDate: backend.date.split("T")[0], // Normalize to YYYY-MM-DD
  quizQuestions: backend.questions,
  audioUrl: backend.audioUrl,
  points: backend.points,
  isActive: backend.isActive,
  visibleForSkillBuilder: backend.visibleForSkillBuilder,
  visibleForSkillBuilderLive: backend.visibleForSkillBuilderLive,
  submissionsCount: backend.submissionsCount,
  pendingSubmissions: backend.pendingSubmissions,
  createdAt: backend.createdAt,
  updatedAt: backend.updatedAt,
});

interface BackendChallengesListResponse {
  challenges: BackendChallenge[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ChallengesListResponse {
  challenges: Challenge[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateChallengeData {
  title: string;
  description: string;
  type: "AUDIO" | "MULTIPLE_CHOICE";
  scheduledDate: string;
  quizQuestions?: QuizQuestion[];
  audioUrl?: string;
  points?: number;
  visibleForSkillBuilder?: boolean;
  visibleForSkillBuilderLive?: boolean;
}

export interface BulkCreateChallengesResponse {
  created: number;
  failed: number;
  errors?: string[];
}

interface ChallengesState {
  challenges: Challenge[];
  selectedChallenge: Challenge | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  total: number;
  page: number;
  totalPages: number;
}

interface ChallengesActions {
  fetchChallenges: (params?: { 
    page?: number; 
    limit?: number; 
    type?: string; 
    isActive?: boolean;
    startDate?: string;
    endDate?: string;
    search?: string;
  }) => Promise<void>;
  fetchChallengeById: (id: number) => Promise<void>;
  createChallenge: (data: CreateChallengeData) => Promise<{ success: boolean; message: string }>;
  updateChallenge: (
    id: number,
    data: Partial<CreateChallengeData & { isActive?: boolean }>,
  ) => Promise<{ success: boolean; message: string }>;
  deleteChallenge: (id: number) => Promise<{ success: boolean; message: string }>;
  bulkCreateChallenges: (challenges: CreateChallengeData[]) => Promise<BulkCreateChallengesResponse>;
  clearError: () => void;
  clearSelectedChallenge: () => void;
}

type ChallengesStore = ChallengesState & ChallengesActions;

const initialState: ChallengesState = {
  challenges: [],
  selectedChallenge: null,
  isLoading: false,
  isSaving: false,
  error: null,
  total: 0,
  page: 1,
  totalPages: 1,
};

export const useChallengesStore = create<ChallengesStore>((set, get) => ({
  ...initialState,

  fetchChallenges: async (params) => {
    set({ isLoading: true, error: null });
    
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.limit) queryParams.append("limit", params.limit.toString());
      if (params?.type) queryParams.append("type", params.type);
      if (params?.isActive !== undefined) queryParams.append("isActive", params.isActive.toString());
      if (params?.startDate) queryParams.append("startDate", params.startDate);
      if (params?.endDate) queryParams.append("endDate", params.endDate);
      if (params?.search) queryParams.append("search", params.search);

      const response = await api.get<ApiResponse<BackendChallengesListResponse>>(
        `/api/admin/challenges?${queryParams.toString()}`,
      );
      
      const data = response.data.data;
      
      set({
        challenges: data.challenges.map(transformChallenge),
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

  fetchChallengeById: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await api.get<ApiResponse<BackendChallenge>>(
        `/api/admin/challenges/${id}`,
      );
      
      set({ selectedChallenge: transformChallenge(response.data.data), isLoading: false });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      set({ error: errorMessage, isLoading: false });
      toast.error(errorMessage);
    }
  },

  createChallenge: async (data) => {
    set({ isSaving: true, error: null });
    
    try {
      // Transform frontend field names to backend field names
      const backendData = {
        title: data.title,
        instructions: data.description, // Backend uses 'instructions' instead of 'description'
        type: data.type,
        date: data.scheduledDate, // Backend uses 'date' instead of 'scheduledDate'
        questions: data.quizQuestions?.map(q => ({
          text: q.question,
          options: q.options,
          correctAnswer: typeof q.correctAnswer === "string"
            ? Math.max(0, q.options.indexOf(q.correctAnswer))
            : q.correctAnswer,
        })),
        audioUrl: data.audioUrl,
        points: data.points,
        visibleForSkillBuilder: data.visibleForSkillBuilder,
        visibleForSkillBuilderLive: data.visibleForSkillBuilderLive,
      };
      
      const response = await api.post<ApiResponse<Challenge>>(
        "/api/admin/challenges",
        backendData,
      );
      
      // Refresh challenges list
      await get().fetchChallenges();
      
      set({ isSaving: false });
      toast.success("Challenge creado correctamente");
      return { success: true, message: response.data.message || "Challenge creado" };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      set({ error: errorMessage, isSaving: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  updateChallenge: async (id, data) => {
    set({ isSaving: true, error: null });
    
    try {
      // Transform frontend field names to backend field names
      const backendData: Record<string, unknown> = {};
      if (data.title !== undefined) backendData.title = data.title;
      if (data.description !== undefined) backendData.instructions = data.description;
      if (data.scheduledDate !== undefined) backendData.date = data.scheduledDate;
      if (data.quizQuestions !== undefined) backendData.questions = data.quizQuestions?.map(q => ({
        text: q.question,
        options: q.options,
        correctAnswer: typeof q.correctAnswer === "string"
          ? q.options.indexOf(q.correctAnswer)
          : q.correctAnswer,
      }));
      if (data.audioUrl !== undefined) backendData.audioUrl = data.audioUrl;
      if (data.points !== undefined) backendData.points = data.points;
      if (data.visibleForSkillBuilder !== undefined) {
        backendData.visibleForSkillBuilder = data.visibleForSkillBuilder;
      }
      if (data.visibleForSkillBuilderLive !== undefined) {
        backendData.visibleForSkillBuilderLive = data.visibleForSkillBuilderLive;
      }
      if (data.isActive !== undefined) backendData.isActive = data.isActive;
      
      const response = await api.put<ApiResponse<Challenge>>(
        `/api/admin/challenges/${id}`,
        backendData,
      );
      
      // Update in local state
      set((state) => ({
        challenges: state.challenges.map((c) => 
          c.id === id ? { ...c, ...response.data.data } : c,
        ),
        selectedChallenge: state.selectedChallenge?.id === id 
          ? { ...state.selectedChallenge, ...response.data.data }
          : state.selectedChallenge,
        isSaving: false,
      }));
      
      toast.success("Challenge actualizado correctamente");
      return { success: true, message: response.data.message || "Challenge actualizado" };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      set({ error: errorMessage, isSaving: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  deleteChallenge: async (id) => {
    set({ isSaving: true, error: null });
    
    try {
      await api.delete(`/api/admin/challenges/${id}`);
      
      // Remove from local state
      set((state) => ({
        challenges: state.challenges.filter((c) => c.id !== id),
        selectedChallenge: state.selectedChallenge?.id === id ? null : state.selectedChallenge,
        isSaving: false,
      }));
      
      toast.success("Challenge eliminado correctamente");
      return { success: true, message: "Challenge eliminado" };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      set({ error: errorMessage, isSaving: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  bulkCreateChallenges: async (challenges) => {
    set({ isSaving: true, error: null });
    
    try {
      // Transform frontend field names to backend field names
      const backendChallenges = challenges.map(data => ({
        title: data.title,
        instructions: data.description, // Backend uses 'instructions'
        type: data.type,
        date: data.scheduledDate, // Backend uses 'date'
        questions: data.quizQuestions?.map(q => {
          // Convert correctAnswer to numeric index (backend expects 0-based index)
          let correctIdx: number;
          if (typeof q.correctAnswer === "number") {
            correctIdx = q.correctAnswer;
          } else {
            // Try as numeric string first (e.g. "0", "1", "2")
            const parsed = parseInt(q.correctAnswer, 10);
            if (!isNaN(parsed) && parsed >= 0 && parsed < q.options.length) {
              correctIdx = parsed;
            } else {
              // Try matching by option text
              const idx = q.options.indexOf(q.correctAnswer);
              correctIdx = idx >= 0 ? idx : 0;
            }
          }
          return {
            text: q.question,
            options: q.options,
            correctAnswer: correctIdx,
          };
        }),
        audioUrl: data.audioUrl,
        points: data.points,
        visibleForSkillBuilder: data.visibleForSkillBuilder,
        visibleForSkillBuilderLive: data.visibleForSkillBuilderLive,
      }));
      
      const response = await api.post<ApiResponse<BulkCreateChallengesResponse>>(
        "/api/admin/challenges/bulk",
        { challenges: backendChallenges },
      );
      
      const result = response.data.data;
      
      // Refresh challenges list
      await get().fetchChallenges();
      
      set({ isSaving: false });
      
      if (result.created > 0) {
        toast.success(`${result.created} challenges creados correctamente`);
      }
      if (result.failed > 0) {
        toast.warning(`${result.failed} challenges fallaron`);
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
  clearSelectedChallenge: () => set({ selectedChallenge: null }),
}));
