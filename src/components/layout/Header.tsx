"use client";

import { Bell, Menu } from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";

import { useSidebar } from "./Sidebar";

const getPageTitle = (pathname: string): string => {
  const routes: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/classes": "Live Classes",
    "/academy": "Academy",
    "/challenges": "Daily Challenges",
    "/jobs": "Job Opportunities",
    "/jobs/my-applications": "My Applications",
    "/profile": "My Profile",
  };

  // Check for dynamic routes
  if (pathname.startsWith("/academy/")) {
    return "Lesson";
  }

  return routes[pathname] || "Dashboard";
};

export const Header = () => {
  const { setIsOpen } = useSidebar();
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white lg:ml-64">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
        {/* Left Section */}
        <div className="flex items-center gap-3">
          {/* Mobile Menu */}
          <button
            onClick={() => setIsOpen(true)}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-50 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <h1 className="font-display text-base font-bold text-brand-primary sm:text-lg">
            {pageTitle}
          </h1>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Notifications */}
          <button className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-600 transition-all hover:border-brand-cyan-dark hover:bg-brand-cyan-dark/5 hover:text-brand-cyan-dark">
            <Bell className="h-4 w-4" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-red-500" />
          </button>

          {/* Divider - Hidden on mobile */}
          <div className="hidden h-8 w-px bg-gray-200 sm:block" />

          {/* User Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold text-brand-primary">Eugenia</p>
              <p className="text-xs font-semibold text-brand-cyan-dark">
                Premium Student
              </p>
            </div>
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border-2 border-brand-cyan-dark shadow-sm">
              <Image
                src="/logo.webp"
                alt="User"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
