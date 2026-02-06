import type { Metadata } from "next";

import { Header } from "@/components/layout/Header";
import { Sidebar, SidebarProvider } from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "Dashboard - JFalcon",
  description: "High Ticket English Platform",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
