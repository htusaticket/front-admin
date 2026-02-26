import Cookies from "js-cookie";
import { create } from "zustand";

import api, { getErrorCode, getErrorMessage } from "@/lib/api";
import type {
  AuthUser,
  LoginRequest,
  LoginResponse,
  AuthErrorCode,
  ApiResponse,
} from "@/types/admin";

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  errorCode: AuthErrorCode | null;
}

interface AuthActions {
  login: (credentials: LoginRequest) => Promise<{ success: boolean; code?: AuthErrorCode }>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  clearError: () => void;
  setUser: (user: AuthUser | null) => void;
}

type AuthStore = AuthState & AuthActions;

const COOKIE_OPTIONS = {
  expires: 7,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  // Initial state
  user: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,
  errorCode: null,

  // Actions
  login: async (credentials: LoginRequest) => {
    set({ isLoading: true, error: null, errorCode: null });

    try {
      const response = await api.post<ApiResponse<LoginResponse>>("/auth/login", credentials);
      const { data } = response.data;
      
      if (!data || !data.accessToken || !data.user) {
        throw new Error("Respuesta del servidor inválida");
      }

      const { accessToken, user } = data;

      // Verificar que el usuario sea ADMIN o SUPERADMIN
      if (user.role !== "ADMIN" && user.role !== "SUPERADMIN") {
        set({
          isLoading: false,
          error: "No tienes permisos de administrador",
          errorCode: "FORBIDDEN",
        });
        return { success: false, code: "FORBIDDEN" as AuthErrorCode };
      }

      // Guardar token y datos en cookies
      Cookies.set("accessToken", accessToken, COOKIE_OPTIONS);
      Cookies.set("userStatus", user.status, COOKIE_OPTIONS);
      Cookies.set("userRole", user.role, COOKIE_OPTIONS);

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        errorCode: null,
      });

      return { success: true };
    } catch (error) {
      const message = getErrorMessage(error);
      const code = getErrorCode(error) as AuthErrorCode | undefined;

      set({
        isLoading: false,
        error: message,
        errorCode: code || null,
      });

      return { success: false, code };
    }
  },

  logout: () => {
    Cookies.remove("accessToken");
    Cookies.remove("userStatus");
    Cookies.remove("userRole");

    set({
      user: null,
      isAuthenticated: false,
      error: null,
      errorCode: null,
    });
  },

  fetchUser: async () => {
    const token = Cookies.get("accessToken");
    if (!token) {
      set({ user: null, isAuthenticated: false });
      return;
    }

    set({ isLoading: true });

    try {
      const response = await api.get<ApiResponse<AuthUser>>("/auth/me");
      const user = response.data.data;

      // Verificar rol admin
      if (user.role !== "ADMIN" && user.role !== "SUPERADMIN") {
        get().logout();
        throw new Error("No tienes permisos de administrador");
      }

      // Actualizar cookies
      Cookies.set("userStatus", user.status, COOKIE_OPTIONS);
      Cookies.set("userRole", user.role, COOKIE_OPTIONS);

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      const code = getErrorCode(error) as AuthErrorCode | undefined;

      if (code === "INVALID_TOKEN" || code === "ACCOUNT_SUSPENDED" || code === "ACCOUNT_PENDING") {
        get().logout();
      }

      set({
        isLoading: false,
        errorCode: code || null,
      });

      throw error;
    }
  },

  clearError: () => set({ error: null, errorCode: null }),

  setUser: (user: AuthUser | null) => set({ user, isAuthenticated: !!user }),
}));
