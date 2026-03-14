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
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

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
  const _router = useRouter();
  const userId = params.userId as string;
  
  const { 
    selectedUser: user, 
    isLoading, 
    error,
    fetchUserDetails,
    updateUserStatus,
    updateUserNotes,
    clearSelectedUser, 
  } = useUsersStore();

  const [activeTab, setActiveTab] = useState("overview");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isStrikeModalOpen, setIsStrikeModalOpen] = useState(false);
  const [isApproveRejectModalOpen, setIsApproveRejectModalOpen] = useState(false);
  const [isActivateModalOpen, setIsActivateModalOpen] = useState(false);
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

  // Initialize notesValue when user changes (using functional update to avoid lint warning)
  const adminNotes = user?.adminNotes;
  useEffect(() => {
    if (adminNotes) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNotesValue(prevNotes => adminNotes !== prevNotes ? adminNotes : prevNotes);
    }
  }, [adminNotes]);

  const handleSaveNotes = async () => {
    if (!userId) return;
    setIsSavingNotes(true);
    await updateUserNotes(userId, { notes: notesValue });
    setIsSavingNotes(false);
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
      value: enrollments.filter(e => e.attendanceStatus === "PRESENT").length.toString(), 
      icon: CheckCircle, 
      color: "text-green-600", 
      bg: "bg-green-100", 
    },
    { 
      label: "Avg. Attendance", 
      value: enrollments.length > 0 
        ? `${Math.round((enrollments.filter(e => e.attendanceStatus === "PRESENT").length / enrollments.length) * 100)}%`
        : "0%", 
      icon: Clock, 
      color: "text-blue-600", 
      bg: "bg-blue-100", 
    },
    { 
      label: "Active Strikes", 
      value: (user.strikes?.length || 0).toString(), 
      icon: AlertTriangle, 
      color: "text-amber-600", 
      bg: "bg-amber-100", 
    },
    { 
      label: "Academy Progress", 
      value: user.academyProgress?.length.toString() || "0", 
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
        <Link href="/users" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
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
        <Link href="/users" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
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
      <Link href="/users" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
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
        {stats.map((stat) => (
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
          ].map((tab) => (
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
                  <span className="font-medium text-gray-900">{user.reference || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Member Since</span>
                  <span className="font-medium text-gray-900">{formatDate(user.createdAt)}</span>
                </div>
              </div>
            </div>
            
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 font-display text-lg font-bold text-gray-900">Admin Notes</h3>
              <textarea 
                className="w-full h-32 rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-brand-primary resize-none"
                placeholder="Add notes about this user..."
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
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Course Name</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Progress</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Completed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {user.academyProgress.map((progress) => (
                    <tr key={progress.courseId}>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                        {progress.courseName}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        <div className="w-full max-w-[100px] h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-cyan-dark" style={{ width: `${progress.progress}%` }} />
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {progress.completedLessons} / {progress.totalLessons}
                      </td>
                    </tr>
                  ))}
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
             
            {user.strikes && user.strikes.length > 0 ? (
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
                    {user.strikes.map((strike) => (
                      <tr key={strike.id}>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {formatDate(strike.createdAt)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                          {strike.reason}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {strike.classSession?.topic || "-"}
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
    </div>
  );
}
