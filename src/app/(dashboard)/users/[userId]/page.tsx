"use client";

import { motion } from "framer-motion";
import Cookies from "js-cookie";
import {
  BookOpen,
  Calendar,
  AlertTriangle,
  User,
  Mail,
  MoreHorizontal,
  GraduationCap,
  Clock,
  CheckCircle,
  Loader2,
  ArrowLeft,
  Phone,
  MapPin,
  CreditCard,
  UserCheck,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";

import { Pagination } from "@/components/ui/Pagination";
import { ActivateUserModal } from "@/components/users/ActivateUserModal";
import { ApproveRejectModal } from "@/components/users/ApproveRejectModal";
import { EditUserModal } from "@/components/users/EditUserModal";
import { IssueStrikeModal } from "@/components/users/IssueStrikeModal";
import { useAuthStore } from "@/store/auth";
import { useUsersStore } from "@/store/users";
import type { AttendanceStatus } from "@/types/admin";

// Avatar colors
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

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const REFERENCE_LABELS: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  friend: "Recomendación de amigo",
  other: "Otro",
};

const getAttendanceBadge = (status: AttendanceStatus | null) => {
  if (!status) return <span className="text-gray-400">-</span>;
  const colors: Record<AttendanceStatus, string> = {
    PRESENT: "bg-green-100 text-green-800",
    ABSENT: "bg-red-100 text-red-800",
    LATE: "bg-amber-100 text-amber-800",
    EXCUSED: "bg-blue-100 text-blue-800",
  };
  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${colors[status]}`}>
      {status}
    </span>
  );
};

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = params.userId as string;
  // Preserve the page the user came from
  const fromPage = searchParams.get("fromPage") || "1";
  
  const { 
    selectedUser: user, 
    isLoading, 
    error,
    fetchUserDetails,
    updateUserStatus,
    updateUserNotes,
    removePunishment,
    deleteUser,
    clearSelectedUser, 
  } = useUsersStore();

  const [activeTab, setActiveTab] = useState("overview");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isStrikeModalOpen, setIsStrikeModalOpen] = useState(false);
  const [isApproveRejectModalOpen, setIsApproveRejectModalOpen] = useState(false);
  const [isActivateModalOpen, setIsActivateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notesValue, setNotesValue] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Get current user for permission checks
  const currentUser = useAuthStore((state) => state.user);
  // Use user role from store, fallback to cookie for SSR hydration
  const userRole = currentUser?.role || Cookies.get("userRole");
  const isSuperAdmin = userRole === "SUPERADMIN";

  // Pagination State
  const [classesPage, setClassesPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (userId) {
      fetchUserDetails(userId);
    }
    return () => clearSelectedUser();
  }, [userId, fetchUserDetails, clearSelectedUser]);

  // Initialize notesValue when user changes - parse per-admin notes
  const adminNotes = user?.adminNotes;
  const currentAdminId = currentUser?.id;
  
  // Helper to extract current admin's note from JSON or plain text
  const getMyNote = (rawNotes: string | null | undefined): string => {
    if (!rawNotes) return "";
    try {
      const parsed = JSON.parse(rawNotes);
      if (typeof parsed === "object" && currentAdminId && parsed[currentAdminId]) {
        return parsed[currentAdminId].note || "";
      }
      // If no entry for current admin, return empty
      return "";
    } catch {
      // Legacy plain text format - show to all admins
      return rawNotes;
    }
  };

  // Helper to get all admin notes for display (SUPERADMIN can see all)
  const getAllNotes = (
    rawNotes: string | null | undefined,
  ): { adminId: string; note: string; updatedAt: string; adminName: string }[] => {
    if (!rawNotes) return [];
    try {
      const parsed = JSON.parse(rawNotes);
      if (typeof parsed === "object") {
        return Object.entries(parsed)
          .filter(([, val]) => typeof val === "object" && (val as { note: string }).note)
          .map(([key, val]) => ({
            adminId: key,
            note: (val as { note: string }).note,
            updatedAt: (val as { updatedAt?: string }).updatedAt || "",
            adminName: (val as { adminName?: string }).adminName || "",
          }));
      }
      return [];
    } catch {
      return [{ adminId: "legacy", note: rawNotes, updatedAt: "", adminName: "System" }];
    }
  };

  useEffect(() => {
    if (adminNotes) {
      const myNote = getMyNote(adminNotes);
      setNotesValue(prevNotes => myNote !== prevNotes ? myNote : prevNotes);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminNotes, currentAdminId]);

  const handleSaveNotes = async () => {
    if (!userId) return;
    setIsSavingNotes(true);
    const result = await updateUserNotes(userId, { notes: notesValue });
    setIsSavingNotes(false);
    if (result.success) {
      toast.success("Notes saved successfully");
    } else {
      toast.error(result.message || "Error saving notes");
    }
  };

  const handleSuspendUser = async () => {
    if (!userId) return;
    await updateUserStatus(userId, { status: "SUSPENDED", reason: "Suspended by admin" });
    setIsMenuOpen(false);
  };

  const handleActivateUser = async () => {
    if (!userId) return;
    await updateUserStatus(userId, { status: "ACTIVE" });
    setIsMenuOpen(false);
  };

  const handleRemovePunishment = async () => {
    if (!userId) return;
    if (!confirm("Are you sure you want to remove this user's punishment? This will also clear all their strikes.")) return;
    await removePunishment(userId);
  };

  const handleDeleteUser = async () => {
    if (!userId) return;
    setIsDeleting(true);
    const result = await deleteUser(userId);
    setIsDeleting(false);
    if (result.success) {
      toast.success(result.message || "User permanently deleted");
      setIsDeleteModalOpen(false);
      router.push(`/users?page=${fromPage}`);
    } else {
      toast.error(result.message || "Error deleting user");
    }
  };

  // Pagination for classes
  const enrollments = user?.enrollments || [];
  const classesTotalPages = Math.ceil(enrollments.length / itemsPerPage);
  const paginatedEnrollments = enrollments.slice(
    (classesPage - 1) * itemsPerPage,
    classesPage * itemsPerPage,
  );

  // Stats calculation
  const stats = user ? [
    { 
      label: "Classes Attended", 
      value: (user.stats?.totalClassesAttended ?? enrollments.filter(e => e.attendanceStatus === "PRESENT").length).toString(), 
      icon: CheckCircle, 
      color: "text-green-600", 
      bg: "bg-green-100", 
    },
    { 
      label: "Avg. Attendance", 
      value: user.stats?.attendancePercentage != null
        ? `${user.stats.attendancePercentage}%`
        : enrollments.length > 0 
          ? `${Math.round((enrollments.filter(e => e.attendanceStatus === "PRESENT").length / enrollments.length) * 100)}%`
          : "0%", 
      icon: Clock, 
      color: "text-blue-600", 
      bg: "bg-blue-100", 
    },
    { 
      label: "Active Strikes", 
      value: (user.strikes?.count || 0).toString(), 
      icon: AlertTriangle, 
      color: "text-amber-600", 
      bg: "bg-amber-100", 
    },
    { 
      label: "Jobs Applied", 
      value: (user.stats?.jobApplicationsCount ?? 0).toString(), 
      icon: GraduationCap, 
      color: "text-purple-600", 
      bg: "bg-purple-100", 
    },
  ] : [];

  if (isLoading && !user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Link href={`/users?page=${fromPage}`} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" />
          Back to Users
        </Link>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <Link href={`/users?page=${fromPage}`} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" />
          Back to Users
        </Link>
        <div className="text-center py-12 text-gray-500">User not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href={`/users?page=${fromPage}`} className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Users
      </Link>

      {/* Header */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className={`flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold ${getAvatarColor(user.firstName)}`}>
              {getInitials(user.firstName, user.lastName)}
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-gray-900">
                {user.firstName} {user.lastName}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1.5">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </div>
                {user.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-4 w-4" />
                    {user.phone}
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  {user.role === "USER" ? "Student" : user.role}
                </div>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                  user.status === "ACTIVE" 
                    ? "bg-green-100 text-green-800" 
                    : user.status === "SUSPENDED"
                      ? "bg-red-100 text-red-800"
                      : "bg-amber-100 text-amber-800"
                }`}>
                  {user.status}
                </span>
                {user.isPunished && (
                  <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold bg-orange-100 text-orange-800">
                    Punished
                  </span>
                )}
              </div>
              {(user.city || user.country) && (
                <div className="mt-2 flex items-center gap-1.5 text-sm text-gray-500">
                  <MapPin className="h-4 w-4" />
                  {[user.city, user.country].filter(Boolean).join(", ")}
                </div>
              )}
              {user.plan && (
                <div className="mt-2 flex items-center gap-1.5 text-sm">
                  <CreditCard className="h-4 w-4 text-gray-500" />
                  <span className="font-semibold text-brand-primary">{user.plan.replace("_", " ")}</span>
                  {user.startDate && user.endDate && (
                    <span className="text-gray-500">
                      ({formatDate(user.startDate)} - {formatDate(user.endDate)})
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Action Buttons for PENDING users */}
          <div className="flex items-center gap-3">
            {/* Approve/Reject buttons for PENDING users - visible only to SUPERADMIN */}
            {user.status === "PENDING" && isSuperAdmin && (
              <button
                onClick={() => setIsApproveRejectModalOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-white hover:bg-amber-600 transition-colors"
              >
                <UserCheck className="h-4 w-4" />
                Review Registration
              </button>
            )}

            {/* Actions Menu - Only visible for SUPERADMIN on active users */}
            {isSuperAdmin && user.status !== "PENDING" && (
              <div className="relative">
                <button 
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className={`rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 transition-colors ${
                    isMenuOpen ? "bg-gray-100" : "hover:bg-gray-50"
                  }`}
                >
                  <MoreHorizontal className="h-5 w-5" />
                </button>

                {isMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setIsMenuOpen(false)} />
                    <div className="absolute right-0 top-full z-40 mt-2 w-48 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
                      <button 
                        onClick={() => {
                          setIsMenuOpen(false);
                          setIsEditModalOpen(true);
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Edit Profile
                      </button>
                      <button 
                        onClick={() => {
                          setIsMenuOpen(false);
                          setIsStrikeModalOpen(true);
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm font-medium text-amber-600 hover:bg-amber-50 transition-colors"
                      >
                        Issue Strike
                      </button>
                      {user.isPunished && (
                        <button 
                          onClick={() => {
                            setIsMenuOpen(false);
                            handleRemovePunishment();
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm font-medium text-green-600 hover:bg-green-50 transition-colors"
                        >
                          Remove Punishment
                        </button>
                      )}
                      <div className="border-t border-gray-100 my-1" />
                      {user.status === "SUSPENDED" ? (
                        <button 
                          onClick={handleActivateUser}
                          className="w-full px-4 py-2.5 text-left text-sm font-medium text-green-600 hover:bg-green-50 transition-colors"
                        >
                          Reactivate User
                        </button>
                      ) : user.status === "ACTIVE" ? (
                        <button 
                          onClick={handleSuspendUser}
                          className="w-full px-4 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                        >
                          Suspend User
                        </button>
                      ) : null}
                      {/* Permanent Delete - only for SUPERADMIN, cannot delete other SUPERADMINs */}
                      {user.role !== "SUPERADMIN" && (
                        <>
                          <div className="border-t border-gray-100 my-1" />
                          <button 
                            onClick={() => {
                              setIsMenuOpen(false);
                              setIsDeleteModalOpen(true);
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
                          >
                            🗑️ Delete Permanently
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats
          .filter((_stat) => {
            // Hide class-attendance, strikes, and jobs stats for non-student roles
            const nonStudentRoles = ["JOB_UPLOADER", "ADMIN", "SUPERADMIN"];
            if (user.role && nonStudentRoles.includes(user.role)) {
              return false;
            }
            return true;
          })
          .map((stat) => (
            <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                  <p className="mt-1 font-display text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "overview", label: "Overview", icon: User },
            { id: "academy", label: "Academy", icon: BookOpen },
            { id: "classes", label: "Classes & Attendance", icon: Calendar },
            { id: "strikes", label: "Strikes", icon: AlertTriangle },
          ]
            .filter((tab) => {
              // Hide academy, classes and strikes tabs for non-student roles
              const nonStudentRoles = ["JOB_UPLOADER", "ADMIN", "SUPERADMIN"];
              if (user.role && nonStudentRoles.includes(user.role)) {
                return tab.id !== "academy" && tab.id !== "classes" && tab.id !== "strikes";
              }
              return true;
            })
            .map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 border-b-2 py-4 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-brand-primary text-brand-primary"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
        </nav>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 font-display text-lg font-bold text-gray-900">User Information</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Email</span>
                  <span className="font-medium text-gray-900">{user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Phone</span>
                  <span className="font-medium text-gray-900">{user.phone || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Location</span>
                  <span className="font-medium text-gray-900">
                    {[user.city, user.country].filter(Boolean).join(", ") || "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Reference</span>
                  <span className="font-medium text-gray-900">{user.reference ? (REFERENCE_LABELS[user.reference] || user.reference) : "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Member Since</span>
                  <span className="font-medium text-gray-900">{formatDate(user.createdAt)}</span>
                </div>
              </div>
            </div>
            
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 font-display text-lg font-bold text-gray-900">My Notes</h3>
              <textarea 
                className="w-full h-32 rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-brand-primary resize-none"
                placeholder="Add your personal notes about this user..."
                value={notesValue}
                onChange={(e) => setNotesValue(e.target.value)}
              />
              <button 
                onClick={handleSaveNotes}
                disabled={isSavingNotes}
                className="mt-3 flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2 text-sm font-bold text-white hover:bg-brand-primary/90 disabled:opacity-50"
              >
                {isSavingNotes ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save Notes
              </button>

              {/* Show all admin notes for SUPERADMIN */}
              {isSuperAdmin && getAllNotes(user.adminNotes).filter(n => n.adminId !== currentAdminId).length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-bold text-gray-500 mb-3">Notes from other admins</h4>
                  <div className="space-y-3">
                    {getAllNotes(user.adminNotes)
                      .filter(n => n.adminId !== currentAdminId)
                      .map((n) => (
                        <div key={n.adminId} className="rounded-lg bg-gray-50 p-3 border border-gray-100">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{n.note}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {n.adminName || (n.adminId === "legacy" ? "System" : "Admin")}
                            {n.updatedAt && ` • ${formatDate(n.updatedAt)}`}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Academy Tab */}
        {activeTab === "academy" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            {user.academyProgress && user.academyProgress.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Module</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Progress</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {user.academyProgress.map((progress) => {
                    const status = progress.progress === 100
                      ? "Completed"
                      : progress.progress > 0
                        ? "In Progress"
                        : "Not Started";
                    return (
                      <tr key={progress.courseId}>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                          {progress.courseName}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <div className="flex items-center gap-3">
                            <div className="w-full max-w-[120px] h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  progress.progress === 100
                                    ? "bg-green-500"
                                    : progress.progress > 0
                                      ? "bg-brand-primary"
                                      : "bg-gray-200"
                                }`}
                                style={{ width: `${progress.progress}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-gray-600 min-w-[40px]">
                              {progress.progress}%
                            </span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            status === "Completed"
                              ? "bg-green-100 text-green-800"
                              : status === "In Progress"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-500"
                          }`}>
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-gray-500">
                No academy progress yet
              </div>
            )}
          </motion.div>
        )}

        {/* Classes Tab */}
        {activeTab === "classes" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            {paginatedEnrollments.length > 0 ? (
              <>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Class</th>
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {paginatedEnrollments.map((enrollment) => (
                      <tr key={enrollment.id}>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {formatDate(enrollment.classSession.scheduledAt)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                          {enrollment.classSession.topic}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {enrollment.classSession.type}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          {getAttendanceBadge(enrollment.attendanceStatus)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Pagination 
                  currentPage={classesPage}
                  totalPages={classesTotalPages}
                  onPageChange={setClassesPage}
                  itemsPerPage={itemsPerPage}
                  totalItems={enrollments.length}
                />
              </>
            ) : (
              <div className="p-8 text-center text-gray-500">
                No class enrollments yet
              </div>
            )}
          </motion.div>
        )}

        {/* Strikes Tab */}
        {activeTab === "strikes" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Punishment Banner */}
            {user.isPunished && (
              <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-bold text-red-800">User is currently punished</p>
                    {user.punishedUntil && (
                      <p className="text-sm text-red-600">
                        Restricted until: {new Date(user.punishedUntil).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                  </div>
                </div>
                {isSuperAdmin && (
                  <button
                    onClick={handleRemovePunishment}
                    className="rounded-xl bg-white border border-red-300 text-red-600 px-4 py-2 text-sm font-bold hover:bg-red-100 transition-colors"
                  >
                    Remove Punishment
                  </button>
                )}
              </div>
            )}

            {/* Strike info summary */}
            {user.strikes && (
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-sm text-gray-500">Active Strikes</p>
                    <p className="text-2xl font-bold text-gray-900">{user.strikes.count} / {user.strikes.maxStrikes}</p>
                  </div>
                  {user.strikes.resetDate && (
                    <div>
                      <p className="text-sm text-gray-500">Reset Date</p>
                      <p className="text-sm font-medium text-gray-900">{formatDate(user.strikes.resetDate)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {isSuperAdmin && (
              <div className="flex justify-end">
                <button 
                  onClick={() => setIsStrikeModalOpen(true)}
                  className="rounded-xl bg-red-50 text-red-600 border border-red-200 px-4 py-2 text-sm font-bold hover:bg-red-100 transition-colors flex items-center gap-2"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Issue Strike
                </button>
              </div>
            )}
             
            {user.strikes?.history && user.strikes.history.length > 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Reason</th>
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Related Class</th>
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {user.strikes.history.map((strike) => (
                      <tr key={strike.id}>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {formatDate(strike.createdAt)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                          {strike.reason}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {strike.classTitle || "-"}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            strike.isManual ? "bg-purple-100 text-purple-800" : "bg-amber-100 text-amber-800"
                          }`}>
                            {strike.isManual ? "Manual" : "Auto"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
                <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-3" />
                <h3 className="text-lg font-bold text-gray-900">Clean Record</h3>
                <p className="text-gray-500">This user has no strikes.</p>
              </div>
            )}
          </motion.div>
        )}
      </div>

      <EditUserModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        user={user} 
      />

      <IssueStrikeModal
        isOpen={isStrikeModalOpen}
        onClose={() => setIsStrikeModalOpen(false)}
        userId={userId}
        userName={`${user.firstName} ${user.lastName}`}
      />

      <ApproveRejectModal
        isOpen={isApproveRejectModalOpen}
        onClose={() => setIsApproveRejectModalOpen(false)}
        userId={userId}
        userName={`${user.firstName} ${user.lastName}`}
        userEmail={user.email}
      />

      <ActivateUserModal
        isOpen={isActivateModalOpen}
        onClose={() => setIsActivateModalOpen(false)}
        userId={userId}
        userName={`${user.firstName} ${user.lastName}`}
        userEmail={user.email}
      />

      {/* Delete User Confirmation Modal */}
      {isDeleteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => !isDeleting && setIsDeleteModalOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-red-50 px-6 py-4 border-b border-red-100">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                  <Trash2 className="h-5 w-5 text-red-600" />
                </div>
                <h3 className="font-display text-lg font-bold text-red-900">
                  Permanent Deletion
                </h3>
              </div>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-700 mb-3">
                You are about to <strong className="text-red-600">permanently delete</strong> the user:
              </p>
              <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 mb-4">
                <p className="font-bold text-gray-900">{user.firstName} {user.lastName}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
                <p className="text-xs text-gray-400 mt-1">Role: {user.role === "USER" ? "Student" : user.role}</p>
              </div>
              <div className="rounded-xl border-2 border-red-200 bg-red-50 p-4">
                <p className="text-sm font-bold text-red-800 mb-1">⚠️ This action is irreversible</p>
                <p className="text-xs text-red-700">
                  All data associated with this user will be permanently removed,
                  including enrollments, strikes, academy progress, and any
                  other related records.
                </p>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={isDeleting}
                  className="flex-1 rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-700 transition-all hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
                  disabled={isDeleting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-red-700 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  {isDeleting ? "Deleting..." : "Delete Permanently"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
