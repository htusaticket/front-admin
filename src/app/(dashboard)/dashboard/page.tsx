"use client";

import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import { motion } from "framer-motion";
import {
  Users,
  Briefcase,
  Video,
  FileText,
  BookOpen,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuthStore } from "@/store";
import { useAdminDashboardStore, type RecentActivity } from "@/store/adminDashboard";

// Helper to get icon and color based on activity type
function getActivityIcon(type: RecentActivity["type"]) {
  switch (type) {
  case "NEW_USER":
    return { icon: Users, bgColor: "bg-green-100", iconColor: "text-green-600" };
  case "JOB_APPLICATION":
    return { icon: Briefcase, bgColor: "bg-purple-100", iconColor: "text-purple-600" };
  case "CLASS_FINISHED":
    return { icon: Video, bgColor: "bg-blue-100", iconColor: "text-blue-600" };
  case "NEW_COURSE":
    return { icon: BookOpen, bgColor: "bg-amber-100", iconColor: "text-amber-600" };
  case "USER_APPROVED":
    return { icon: CheckCircle, bgColor: "bg-green-100", iconColor: "text-green-600" };
  case "NEW_SUBMISSION":
    return { icon: FileText, bgColor: "bg-cyan-100", iconColor: "text-cyan-600" };
  default:
    return { icon: AlertCircle, bgColor: "bg-gray-100", iconColor: "text-gray-600" };
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { stats, recentActivity, isLoading, error, fetchDashboard } = useAdminDashboardStore();
  
  const isSuperAdmin = user?.role === "SUPERADMIN";

  useEffect(() => {
    // SUPERADMIN sees weekly stats, others see daily
    fetchDashboard(isSuperAdmin ? "week" : "today");
  }, [fetchDashboard, isSuperAdmin]);

  // Get user display name
  const getUserGreeting = () => {
    if (user?.firstName) {
      return user.firstName;
    }
    if (user?.email) {
      return user.email.split("@")[0];
    }
    return "Admin";
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header Section */}
      <div>
        <h1 className="font-display text-2xl font-bold text-brand-primary sm:text-3xl">
          Admin Dashboard
        </h1>
        <p className="mt-2 text-base text-gray-700 sm:text-lg">
          Welcome, {getUserGreeting()}. Here&apos;s {isSuperAdmin ? "this week's" : "today's"} summary.
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
          <span className="ml-2 text-gray-600">Loading dashboard...</span>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => fetchDashboard()}
            className="mt-2 text-sm font-medium text-red-700 underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Stats Grid */}
      {!isLoading && stats && (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Users */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push("/users")}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Users</p>
                  <p className="mt-1 font-display text-3xl font-bold text-brand-primary">
                    {stats.totalUsers.toLocaleString()}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              {stats.pendingUsers > 0 && (
                <p className="mt-2 text-xs font-semibold text-amber-600">
                  {stats.pendingUsers} pending approval
                </p>
              )}
            </motion.div>

            {/* Active Jobs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push("/jobs")}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Active Jobs</p>
                  <p className="mt-1 font-display text-3xl font-bold text-brand-primary">
                    {stats.activeJobs}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
                  <Briefcase className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <p className="mt-2 text-xs font-semibold text-gray-500">
                {stats.totalApplications} total applications
              </p>
            </motion.div>

            {/* Classes Today/Week */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push("/classes")}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    {isSuperAdmin ? "Classes This Week" : "Classes Today"}
                  </p>
                  <p className="mt-1 font-display text-3xl font-bold text-brand-primary">
                    {stats.classesToday}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-cyan-dark/10">
                  <Video className="h-6 w-6 text-brand-cyan-dark" />
                </div>
              </div>
              <p className="mt-2 text-xs font-semibold text-gray-500">
                <Clock className="inline h-3 w-3 mr-1" />
                {stats.activeCourses} active courses
              </p>
            </motion.div>

            {/* Pending Corrections */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push("/corrections")}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Corrections
                  </p>
                  <p className="mt-1 font-display text-3xl font-bold text-brand-primary">
                    {stats.pendingCorrections}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
                  <FileText className="h-6 w-6 text-amber-600" />
                </div>
              </div>
              <p className="mt-2 text-xs font-semibold text-amber-600">
                Pending review
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Quick Actions */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
              >
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                  <h3 className="font-display text-lg font-bold text-brand-primary">
                    Quick Actions
                  </h3>
                </div>
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button 
                    onClick={() => router.push("/users")}
                    className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 transition-all hover:border-brand-primary/20 hover:shadow-md group"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 group-hover:bg-blue-100 transition-colors">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-gray-900">View Users</p>
                      <p className="text-sm text-gray-500">Manage students</p>
                    </div>
                  </button>
                  
                  <button 
                    onClick={() => router.push("/jobs")}
                    className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 transition-all hover:border-brand-primary/20 hover:shadow-md group"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-50 group-hover:bg-purple-100 transition-colors">
                      <Briefcase className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-gray-900">Manage Jobs</p>
                      <p className="text-sm text-gray-500">View offers and applications</p>
                    </div>
                  </button>

                  <button 
                    onClick={() => router.push("/classes")}
                    className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 transition-all hover:border-brand-primary/20 hover:shadow-md group"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-cyan-dark/10 group-hover:bg-brand-cyan-dark/20 transition-colors">
                      <Video className="h-5 w-5 text-brand-cyan-dark" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-gray-900">View Classes</p>
                      <p className="text-sm text-gray-500">Calendar and sessions</p>
                    </div>
                  </button>

                  <button 
                    onClick={() => router.push("/academy")}
                    className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 transition-all hover:border-brand-primary/20 hover:shadow-md group"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 group-hover:bg-amber-100 transition-colors">
                      <BookOpen className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-gray-900">Academy</p>
                      <p className="text-sm text-gray-500">Courses and modules</p>
                    </div>
                  </button>
                </div>
              </motion.div>
            </div>

            {/* Recent Activity Feed */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
              >
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                  <h3 className="font-display text-lg font-bold text-brand-primary">
                    Recent Activity
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[400px]">
                  {recentActivity.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No recent activity</p>
                    </div>
                  ) : (
                    recentActivity.map((activity) => {
                      const { icon: Icon, bgColor, iconColor } = getActivityIcon(activity.type);
                      return (
                        <div key={activity.id} className="flex gap-3">
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${bgColor}`}>
                            <Icon className={`h-4 w-4 ${iconColor}`} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{activity.title}</p>
                            <p className="text-xs text-gray-500">{activity.description}</p>
                            <p className="text-[10px] text-gray-400 mt-1">
                              {formatDistanceToNow(new Date(activity.createdAt), { 
                                addSuffix: true, 
                                locale: enUS, 
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
