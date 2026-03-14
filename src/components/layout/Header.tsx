"use client";

import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import { Bell, Menu, UserPlus, BookOpen, FileText, AlertCircle, X, Loader2, CheckCheck } from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useAdminDashboardStore, type AdminNotification } from "@/store/adminDashboard";
import { useAuthStore } from "@/store/auth";

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

const getRoleLabel = (role: string): string => {
  const labels: Record<string, string> = {
    SUPERADMIN: "Super Admin",
    ADMIN: "Admin / Teacher",
    USER: "Student",
    JOB_UPLOADER: "Job Uploader",
  };
  return labels[role] || role;
};

// Helper to get user display name
const getUserDisplayName = (user: { firstName?: string; lastName?: string; email?: string } | null): string => {
  if (!user) return "Cargando...";
  
  // If user has firstName and lastName, use them
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  
  // If only firstName exists
  if (user.firstName) {
    return user.firstName;
  }
  
  // Fallback to email (truncate if too long)
  if (user.email) {
    const emailName = user.email.split("@")[0];
    return emailName.length > 15 ? `${emailName.substring(0, 15)}...` : emailName;
  }
  
  return "Usuario";
};

// Helper to get notification icon based on type
const getNotificationIcon = (type: AdminNotification["type"]) => {
  switch (type) {
  case "NEW_REGISTRATION":
    return { icon: UserPlus, bgColor: "bg-green-100", iconColor: "text-green-600" };
  case "NEW_COURSE":
    return { icon: BookOpen, bgColor: "bg-amber-100", iconColor: "text-amber-600" };
  case "NEW_SUBMISSION":
    return { icon: FileText, bgColor: "bg-blue-100", iconColor: "text-blue-600" };
  case "USER_SUSPENDED":
    return { icon: AlertCircle, bgColor: "bg-red-100", iconColor: "text-red-600" };
  default:
    return { icon: Bell, bgColor: "bg-gray-100", iconColor: "text-gray-600" };
  }
};

// Helper to get notification action route
const getNotificationRoute = (notification: AdminNotification): string | null => {
  switch (notification.type) {
  case "NEW_REGISTRATION":
    // Navigate to users page, filtered by pending
    return "/users?status=PENDING";
  case "NEW_COURSE":
    return "/academy";
  case "NEW_SUBMISSION":
    return "/corrections";
  case "USER_SUSPENDED":
    return "/users";
  default:
    return null;
  }
};

export const Header = () => {
  const { setIsOpen } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const pageTitle = getPageTitle(pathname);
  const user = useAuthStore((state) => state.user);
  
  // Notifications state
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  
  const { 
    notifications, 
    unreadCount, 
    isLoadingNotifications,
    fetchNotifications, 
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useAdminDashboardStore();

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();
    // Refresh every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get display values
  const displayName = getUserDisplayName(user);
  const displayRole = user ? getRoleLabel(user.role) : "";

  // Handle notification click
  const handleNotificationClick = async (notification: AdminNotification) => {
    // Mark as read if not already
    if (!notification.isRead) {
      await markNotificationAsRead(notification.id);
    }
    
    // Navigate to relevant page
    const route = getNotificationRoute(notification);
    if (route) {
      setShowNotifications(false);
      router.push(route);
    }
  };

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
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-600 transition-all hover:border-brand-cyan-dark hover:bg-brand-cyan-dark/5 hover:text-brand-cyan-dark"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl z-50">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-3">
                  <h3 className="font-display font-bold text-brand-primary">
                    Notifications
                  </h3>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllNotificationsAsRead}
                        className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-brand-cyan-dark hover:bg-brand-cyan-dark/10 transition-colors"
                        title="Mark all as read"
                      >
                        <CheckCheck className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Mark all</span>
                      </button>
                    )}
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="rounded-lg p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Notifications List */}
                <div className="max-h-[400px] overflow-y-auto">
                  {isLoadingNotifications ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="py-8 text-center">
                      <Bell className="mx-auto h-8 w-8 text-gray-300" />
                      <p className="mt-2 text-sm text-gray-500">
                        No notifications
                      </p>
                    </div>
                  ) : (
                    notifications.map((notification) => {
                      const { icon: Icon, bgColor, iconColor } = getNotificationIcon(notification.type);
                      return (
                        <button
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          className={`flex w-full gap-3 border-b border-gray-50 p-4 text-left transition-colors hover:bg-gray-50 ${
                            !notification.isRead ? "bg-blue-50/50" : ""
                          }`}
                        >
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${bgColor}`}>
                            <Icon className={`h-5 w-5 ${iconColor}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-sm ${!notification.isRead ? "font-bold" : "font-medium"} text-gray-900`}>
                                {notification.title}
                              </p>
                              {!notification.isRead && (
                                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                              )}
                            </div>
                            <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="mt-1 text-[10px] text-gray-400">
                              {formatDistanceToNow(new Date(notification.createdAt), {
                                addSuffix: true,
                                locale: enUS,
                              })}
                            </p>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                  <div className="border-t border-gray-100 bg-gray-50 p-2">
                    <button
                      onClick={() => {
                        setShowNotifications(false);
                        router.push("/dashboard");
                      }}
                      className="w-full rounded-lg py-2 text-center text-sm font-medium text-brand-primary hover:bg-gray-100"
                    >
                      View all in Dashboard
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Divider - Hidden on mobile */}
          <div className="hidden h-8 w-px bg-gray-200 sm:block" />

          {/* User Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold text-brand-primary">
                {displayName}
              </p>
              <p className="text-xs font-semibold text-brand-cyan-dark">
                {displayRole}
              </p>
            </div>
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border-2 border-brand-cyan-dark shadow-sm">
              <Image
                src="https://pub-edad5806cdff45b08f50aa762e6fce6c.r2.dev/HT_USA_Logo-lau.png"
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
