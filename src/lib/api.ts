import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Interceptor para agregar token a las peticiones
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = Cookies.get("accessToken");
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error),
);

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      console.error("Error de autenticación:", {
        url: error.config?.url,
        status: error.response.status,
        data: error.response.data,
      });
    }
    
    return Promise.reject(error);
  },
);

// Tipos de errores del backend
export interface ApiError {
  statusCode: number;
  message: string | string[];
  code?: string;
  error?: string;
}

// Helper para extraer el mensaje de error
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiError;
    if (Array.isArray(data?.message)) {
      return data.message[0];
    }
    return data?.message || "Error de conexión";
  }
  return "Error inesperado";
};

// Helper para extraer el código de error
export const getErrorCode = (error: unknown): string | undefined => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiError;
    return data?.code;
  }
  return undefined;
};

export default api;
