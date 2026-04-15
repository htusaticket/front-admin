"use client";

import { useEffect } from "react";
import { create } from "zustand";

import api from "@/lib/api";

const DEFAULT_LOGO =
  "https://pub-edad5806cdff45b08f50aa762e6fce6c.r2.dev/HT_USA_Logo-lau.png";

interface AppLogoState {
  logoUrl: string;
  fetched: boolean;
  fetching: boolean;
  fetch: () => Promise<void>;
}

const useAppLogoStore = create<AppLogoState>((set, get) => ({
  logoUrl: DEFAULT_LOGO,
  fetched: false,
  fetching: false,
  fetch: async () => {
    if (get().fetched || get().fetching) return;
    set({ fetching: true });
    try {
      // Backend wraps responses as { success, message, data }
      const res = await api.get<{ data?: { logoUrl: string | null }; logoUrl?: string | null }>(
        "/api/public/config",
      );
      const payload = res.data?.data ?? res.data;
      const url = payload?.logoUrl?.trim();
      set({
        logoUrl: url || DEFAULT_LOGO,
        fetched: true,
        fetching: false,
      });
    } catch {
      set({ logoUrl: DEFAULT_LOGO, fetched: true, fetching: false });
    }
  },
}));

export function useAppLogo(): string {
  const { logoUrl, fetch } = useAppLogoStore();
  useEffect(() => {
    fetch();
  }, [fetch]);
  return logoUrl;
}
