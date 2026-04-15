"use client";

import { AnimatePresence, motion } from "framer-motion";
import Cookies from "js-cookie";
import {
  BookOpen,
  Briefcase,
  Calendar,
  Home,
  LogOut,
  User,
  Users,
  X,
  Settings,
  Trophy,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  AlertCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useState, useEffect } from "react";

import { useAppLogo } from "@/hooks/useAppLogo";
import { useAuthStore } from "@/store/auth";
import { useSystemConfigStore } from "@/store/systemConfig";

// Menu items with role-based visibility
const allMenuItems = [
  { icon: Home, label: "Dashboard", href: "/dashboard", roles: ["SUPERADMIN", "ADMIN"] },
  { icon: Users, label: "Users", href: "/users", roles: ["SUPERADMIN", "ADMIN"] },
  { icon: CreditCard, label: "Subscriptions", href: "/subscriptions", roles: ["SUPERADMIN"] },
  { icon: BookOpen, label: "Academy", href: "/academy", roles: ["SUPERADMIN", "ADMIN"] },
  { icon: Calendar, label: "Classes", href: "/classes", roles: ["SUPERADMIN", "ADMIN"] },
  { icon: Briefcase, label: "Jobs", href: "/jobs", roles: ["SUPERADMIN", "ADMIN", "JOB_UPLOADER"] },
  { icon: Trophy, label: "Challenges", href: "/challenges", roles: ["SUPERADMIN", "ADMIN"] },
  { icon: CheckCircle2, label: "Corrections", href: "/corrections", roles: ["SUPERADMIN", "ADMIN"] },
  { icon: ClipboardList, label: "Audit", href: "/audit", roles: ["SUPERADMIN"] },
  { icon: User, label: "My Profile", href: "/profile", roles: ["SUPERADMIN", "ADMIN", "JOB_UPLOADER"] },
  { icon: Settings, label: "Configuration", href: "/settings", roles: ["SUPERADMIN"] },
];

// Context for mobile menu
const SidebarContext = createContext({
  isOpen: false,
  setIsOpen: (_value: boolean) => {},
});

export const useSidebar = () => useContext(SidebarContext);

export const SidebarProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </SidebarContext.Provider>
  );
};

// Sidebar content component (moved outside render)
const SidebarContent = ({
  pathname,
  onClose,
  onLogout,
  userRole,
  jobBoardEnabled,
  logoUrl,
}: {
  pathname: string;
  onClose?: () => void;
  onLogout: () => void;
  userRole: string;
  jobBoardEnabled: boolean;
  logoUrl: string;
}) => {
  // Filter menu items based on user role
  const menuItems = allMenuItems.filter(item => item.roles.includes(userRole));
  
  // Check if JOB_UPLOADER and jobs are disabled
  const isJobUploader = userRole === "JOB_UPLOADER";
  const showJobsDisabledMessage = isJobUploader && !jobBoardEnabled;
  
  return (
    <div className="flex h-full flex-col p-6">
      {/* Logo */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-black">
            <Image
              src={logoUrl}
              alt="High Ticket USA"
              width={40}
              height={40}
              className="h-10 w-10 object-cover object-top"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-lg font-bold text-brand-primary leading-tight">
              High Ticket USA
            </span>
            <span className="text-xs font-medium text-gray-500">
              Admin Panel
            </span>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Jobs Disabled Message for JOB_UPLOADER */}
      {showJobsDisabledMessage && (
        <div className="mb-6 rounded-xl bg-amber-50 border border-amber-200 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Jobs Module Disabled</p>
              <p className="text-xs text-amber-700 mt-1">
                The job board is currently disabled by the administrator. You cannot manage jobs at this time.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1.5">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                isActive
                  ? "bg-brand-cyan-dark text-white shadow-lg shadow-brand-cyan-dark/20"
                  : "text-gray-700 hover:bg-gray-50 hover:text-brand-cyan-dark"
              }`}
            >
              <item.icon
                className={`h-5 w-5 transition-colors ${
                  isActive
                    ? "text-white"
                    : "text-gray-500 group-hover:text-brand-cyan-dark"
                }`}
              />
              {item.label}
              {isActive && (
                <motion.div
                  layoutId="sidebar-indicator"
                  className="absolute right-3 h-2 w-2 rounded-full bg-white"
                  initial={false}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-gray-200 pt-4">
        <button 
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-600 transition-all hover:bg-red-50"
        >
          <LogOut className="h-5 w-5" />
        Sign Out
        </button>
      </div>
    </div>
  );
};

export const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { isOpen, setIsOpen } = useSidebar();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const { config, fetchConfig } = useSystemConfigStore();
  const logoUrl = useAppLogo();
  
  // Use user role from store, fallback to cookie, then to SUPERADMIN (safest default for display)
  const userRole = user?.role || Cookies.get("userRole") || "SUPERADMIN";
  
  // Fetch system config on mount for JOB_UPLOADER role check
  useEffect(() => {
    if (userRole === "JOB_UPLOADER") {
      fetchConfig();
    }
  }, [userRole, fetchConfig]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };
  
  const jobBoardEnabled = config?.jobBoardEnabled ?? true;

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-gray-200 bg-white lg:flex">
        <SidebarContent
          pathname={pathname}
          onLogout={handleLogout}
          userRole={userRole}
          jobBoardEnabled={jobBoardEnabled}
          logoUrl={logoUrl}
        />
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            />
            {/* Sidebar */}
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 z-50 h-screen w-64 border-r border-gray-200 bg-white lg:hidden"
            >
              <SidebarContent
                pathname={pathname}
                onClose={() => setIsOpen(false)}
                onLogout={handleLogout}
                userRole={userRole}
                jobBoardEnabled={jobBoardEnabled}
                logoUrl={logoUrl}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
