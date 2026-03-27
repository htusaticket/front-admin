"use client";

import Cookies from "js-cookie";
import { Search, SlidersHorizontal, Loader2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";

import { Pagination } from "@/components/ui/Pagination";
import { AddUserModal } from "@/components/users/AddUserModal";
import { debounce } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";
import { useUsersStore } from "@/store/users";
import type { UserStatus, UserRole, UserPlan } from "@/types/admin";

// Colores para avatares basados en el primer caracter del nombre
const getAvatarColor = (name: string): string => {
  const colors = [
    "bg-red-100 text-red-700", 
    "bg-orange-100 text-orange-700", 
    "bg-amber-100 text-amber-700", 
    "bg-green-100 text-green-700", 
    "bg-teal-100 text-teal-700", 
    "bg-blue-100 text-blue-700", 
    "bg-indigo-100 text-indigo-700", 
    "bg-purple-100 text-purple-700",
  ];
  const charCode = name.charCodeAt(0) || 0;
  return colors[charCode % colors.length];
};

const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

const formatLastLogin = (dateStr: string | null): string => {
  if (!dateStr) return "Never";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const getPlanBadge = (plan: UserPlan | null) => {
  if (!plan) return <span className="text-gray-400 text-xs">-</span>;
  const colors: Record<UserPlan, string> = {
    PRO: "bg-purple-100 text-purple-800",
    ELITE: "bg-amber-100 text-amber-800",
    LEVEL_UP: "bg-blue-100 text-blue-800",
    HIRING_HUB: "bg-green-100 text-green-800",
    SKILL_BUILDER: "bg-cyan-100 text-cyan-800",
  };
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${colors[plan]}`}>
      {plan.replace("_", " ")}
    </span>
  );
};

export default function UsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPage = Number(searchParams.get("page")) || 1;

  const { 
    users, 
    total, 
    page, 
    totalPages, 
    isLoading, 
    error,
    fetchUsers, 
  } = useUsersStore();

  // Get current user for permission checks
  const currentUser = useAuthStore((state) => state.user);
  // Use user role from store, fallback to cookie for SSR hydration
  const userRole = currentUser?.role || Cookies.get("userRole");
  const isSuperAdmin = userRole === "SUPERADMIN";

  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "All">("All");
  const [roleFilter, setRoleFilter] = useState<UserRole | "All">("All");
  const itemsPerPage = 10;

  // Debounced search
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedFetch = useCallback(
    debounce((query: string, status: UserStatus | "All", role: UserRole | "All") => {
      fetchUsers({
        page: 1,
        limit: itemsPerPage,
        search: query || undefined,
        status: status !== "All" ? status : undefined,
        role: role !== "All" ? role : undefined,
      });
    }, 300),
    [fetchUsers],
  );

  // Initial load - use page from URL if returning from user detail
  useEffect(() => {
    fetchUsers({ page: initialPage, limit: itemsPerPage });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchUsers]);

  // Refetch when filters change
  useEffect(() => {
    debouncedFetch(searchQuery, statusFilter, roleFilter);
  }, [searchQuery, statusFilter, roleFilter, debouncedFetch]);

  const handlePageChange = (newPage: number) => {
    fetchUsers({
      page: newPage,
      limit: itemsPerPage,
      search: searchQuery || undefined,
      status: statusFilter !== "All" ? statusFilter : undefined,
      role: roleFilter !== "All" ? roleFilter : undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-2xl font-bold text-gray-900">
          Users Management
        </h1>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input 
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-2 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 sm:w-64"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <SlidersHorizontal className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as UserStatus | "All")}
              className="w-full appearance-none rounded-xl border border-gray-200 bg-white pl-10 pr-8 py-2 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 cursor-pointer"
            >
              <option value="All">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING">Pending</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as UserRole | "All")}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 cursor-pointer"
          >
            <option value="All">All Roles</option>
            <option value="USER">Student</option>
            <option value="ADMIN">Admin</option>
            <option value="SUPERADMIN">Super Admin</option>
            <option value="JOB_UPLOADER">Job Uploader</option>
          </select>

          {isSuperAdmin && (
            <button 
              onClick={() => setIsAddUserOpen(true)}
              className="flex items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-2 text-sm font-bold text-white shadow-lg shadow-brand-primary/20 transition-all hover:bg-brand-primary/90"
            >
              <span>+ Add User</span>
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {isLoading && users.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
          </div>
        ) : (
          <>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Strikes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {users.length > 0 ? (
                  users.map((user) => (
                    <tr 
                      key={user.id}
                      onClick={() => router.push(`/users/${user.id}?fromPage=${page}`)} 
                      className="group cursor-pointer transition-colors hover:bg-gray-50"
                    >
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center">
                          <div className={`h-10 w-10 shrink-0 rounded-full ${getAvatarColor(user.firstName)} flex items-center justify-center font-bold text-sm`}>
                            {getInitials(user.firstName, user.lastName)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 group-hover:text-brand-primary transition-colors">
                              {user.firstName} {user.lastName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm text-gray-500">
                          {user.role === "USER" ? "Student" : user.role}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        {getPlanBadge(user.plan)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm text-gray-500">
                          {formatLastLogin(user.lastLoginAt)}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                          user.strikeCount >= 3 
                            ? "bg-red-100 text-red-800" 
                            : user.strikeCount > 0 
                              ? "bg-amber-100 text-amber-800" 
                              : "bg-gray-100 text-gray-800"
                        }`}>
                          {user.strikeCount}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold leading-5 ${
                          user.status === "ACTIVE" 
                            ? "bg-green-100 text-green-800" 
                            : user.status === "SUSPENDED"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                        }`}>
                          {user.status}
                          {user.isPunished && " (Punished)"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                        <Link 
                          href={`/users/${user.id}?fromPage=${page}`} 
                          onClick={(e) => e.stopPropagation()}
                          className="text-brand-primary hover:text-brand-primary/80 font-bold"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      No users found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            
            <Pagination 
              currentPage={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              itemsPerPage={itemsPerPage}
              totalItems={total}
            />
          </>
        )}
      </div>

      <AddUserModal 
        isOpen={isAddUserOpen} 
        onClose={() => setIsAddUserOpen(false)} 
      />
    </div>
  );
}
