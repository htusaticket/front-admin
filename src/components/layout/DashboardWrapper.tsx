"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Header } from "@/components/layout/Header";
import { Sidebar, SidebarProvider } from "@/components/layout/Sidebar";
import { useAuthStore } from "@/store/auth";

export function DashboardWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, fetchUser } = useAuthStore();

  // Fetch user on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        await fetchUser();
      } catch {
        // If fetchUser fails (invalid token, etc.), redirect to login
        router.push("/login");
      }
    };

    // Only fetch if we don't have user data yet
    if (!user && !isLoading) {
      loadUser();
    }
  }, [user, isLoading, fetchUser, router]);

  // Show loading while fetching user
  if (isLoading || (!user && !isAuthenticated)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
          <p className="text-sm text-gray-500">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-white">
        <Sidebar />
        <Header />
        <main className="min-h-[calc(100vh-64px)] p-6 lg:ml-64 lg:p-8">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
