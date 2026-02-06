export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/auth/login",
    LOGOUT: "/api/auth/logout",
    REFRESH: "/api/auth/refresh",
    PROFILE: "/api/auth/profile",
  },
  USERS: {
    LIST: "/api/users",
    DETAIL: (id: string) => `/api/users/${id}`,
    CREATE: "/api/users",
    UPDATE: (id: string) => `/api/users/${id}`,
    DELETE: (id: string) => `/api/users/${id}`,
  },
} as const;

export const APP_CONFIG = {
  APP_NAME: "Template App",
  APP_VERSION: "1.0.0",
  API_BASE_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
  ENVIRONMENT: process.env.NODE_ENV || "development",
} as const;

export const UI_CONSTANTS = {
  BREAKPOINTS: {
    MOBILE: 768,
    TABLET: 1024,
    DESKTOP: 1280,
  },
  ANIMATION: {
    DURATION: 300,
    EASING: "ease-in-out",
  },
} as const;
