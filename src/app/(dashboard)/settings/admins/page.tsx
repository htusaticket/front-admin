"use client";

import { motion } from "framer-motion";
import { 
  Shield, 
  Plus, 
  Search, 
  Edit2, 
  Trash2,
  Ban,
  UserCog,
  Loader2,
  CheckCircle,
  XCircle,
  Mail,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

import { useModalLock } from "@/hooks/useModalLock";
import api, { getErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import type { ApiResponse } from "@/types/admin";

interface Admin {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: "ADMIN" | "SUPERADMIN";
  status: "PENDING" | "ACTIVE" | "SUSPENDED";
  createdAt: string;
  lastLoginAt: string | null;
}

interface AdminsResponse {
  users: Admin[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AdminsManagementPage() {
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  
  // Check if user is SUPERADMIN
  const isSuperAdmin = currentUser?.role === "SUPERADMIN";
  
  // State
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPermanentDeleteModal, setShowPermanentDeleteModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    role: "ADMIN" as "ADMIN" | "SUPERADMIN",
    temporaryPassword: "",
  });

  // Lock body scroll and escape for modals
  useModalLock(showCreateModal, () => { setShowCreateModal(false); setError(null); resetForm(); });
  useModalLock(showEditModal, () => {
    setShowEditModal(false); setSelectedAdmin(null); setError(null); resetForm();
  });
  useModalLock(showDeleteModal, () => {
    setShowDeleteModal(false); setSelectedAdmin(null); setError(null);
  });
  useModalLock(showPermanentDeleteModal, () => {
    setShowPermanentDeleteModal(false); setSelectedAdmin(null); setError(null);
  });

  // Fetch admins
  const fetchAdmins = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch all users and filter admins client-side
      // Backend doesn't support comma-separated roles
      const response = await api.get<ApiResponse<AdminsResponse>>(
        "/api/admin/users",
        {
          params: {
            search: searchQuery || undefined,
            limit: 100,
          },
        },
      );
      
      // Filter only ADMIN and SUPERADMIN roles
      const adminUsers = response.data.data.users.filter(
        (user) => user.role === "ADMIN" || user.role === "SUPERADMIN",
      );
      
      setAdmins(adminUsers);
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (!isSuperAdmin) {
      router.push("/dashboard");
      return;
    }
    fetchAdmins();
  }, [isSuperAdmin, router, fetchAdmins]);

  // Create admin
  const handleCreate = async () => {
    if (!formData.email || !formData.temporaryPassword) {
      setError("Email and temporary password are required");
      return;
    }
    
    if (!formData.firstName || !formData.lastName) {
      setError("First name and last name are required");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await api.post("/api/admin/users", {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
        password: formData.temporaryPassword,
      });
      
      setShowCreateModal(false);
      resetForm();
      fetchAdmins();
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update admin
  const handleUpdate = async () => {
    if (!selectedAdmin) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const updateData: Record<string, string | undefined> = {
        email: formData.email || undefined,
        firstName: formData.firstName || undefined,
        lastName: formData.lastName || undefined,
        role: formData.role,
      };
      
      // Include password if provided
      if (formData.temporaryPassword) {
        updateData.password = formData.temporaryPassword;
      }
      
      await api.patch(`/api/admin/users/${selectedAdmin.id}`, updateData);
      
      setShowEditModal(false);
      setSelectedAdmin(null);
      resetForm();
      fetchAdmins();
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Suspend admin
  const handleSuspend = async () => {
    if (!selectedAdmin) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await api.patch(`/api/admin/users/${selectedAdmin.id}/status`, {
        status: "SUSPENDED",
        reason: "Suspended by superadmin",
      });
      
      setShowDeleteModal(false);
      setSelectedAdmin(null);
      fetchAdmins();
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Permanently delete admin
  const handlePermanentDelete = async () => {
    if (!selectedAdmin) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await api.delete(`/api/admin/users/${selectedAdmin.id}`);
      
      setShowPermanentDeleteModal(false);
      setSelectedAdmin(null);
      fetchAdmins();
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Activate admin
  const handleActivate = async (admin: Admin) => {
    try {
      await api.patch(`/api/admin/users/${admin.id}/status`, {
        status: "ACTIVE",
      });
      fetchAdmins();
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      email: "",
      firstName: "",
      lastName: "",
      role: "ADMIN",
      temporaryPassword: "",
    });
  };

  // Open edit modal
  const openEditModal = (admin: Admin) => {
    setSelectedAdmin(admin);
    setFormData({
      email: admin.email,
      firstName: admin.firstName || "",
      lastName: admin.lastName || "",
      role: admin.role,
      temporaryPassword: "",
    });
    setShowEditModal(true);
  };

  // Open delete/suspend modal
  const openDeleteModal = (admin: Admin) => {
    setSelectedAdmin(admin);
    setShowDeleteModal(true);
  };

  // Open permanent delete modal
  const openPermanentDeleteModal = (admin: Admin) => {
    setSelectedAdmin(admin);
    setShowPermanentDeleteModal(true);
  };

  // If not SUPERADMIN, show nothing while redirecting
  if (!isSuperAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link 
            href="/settings"
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-bold text-brand-primary">
              Admin Management
            </h1>
            <p className="text-sm text-gray-500">
              Create, edit and manage administrator accounts
            </p>
          </div>
        </div>
        
        <button
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-primary/90"
        >
          <Plus className="h-4 w-4" />
          New Admin
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-gray-200 py-3 pl-11 pr-4 text-sm outline-none transition-colors focus:border-brand-primary"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
        </div>
      )}

      {/* Admins List */}
      {!isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
        >
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display font-bold text-gray-900">
                  Administrators ({admins.length})
                </h2>
                <p className="text-xs text-gray-500">
                  List of users with administrator role
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {admins.length === 0 ? (
              <div className="py-12 text-center">
                <UserCog className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">
                  No administrators found
                </p>
              </div>
            ) : (
              admins.map((admin) => (
                <div
                  key={admin.id}
                  className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
                      admin.role === "SUPERADMIN" ? "bg-purple-100" : "bg-blue-100"
                    }`}>
                      <UserCog className={`h-6 w-6 ${
                        admin.role === "SUPERADMIN" ? "text-purple-600" : "text-blue-600"
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-900">
                          {admin.firstName && admin.lastName
                            ? `${admin.firstName} ${admin.lastName}`
                            : admin.email.split("@")[0]}
                        </p>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          admin.role === "SUPERADMIN"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-blue-100 text-blue-700"
                        }`}>
                          {admin.role === "SUPERADMIN" ? "Super Admin" : "Admin"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Mail className="h-3 w-3 text-gray-400" />
                        <p className="text-xs text-gray-500">{admin.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Status badge */}
                    <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                      admin.status === "ACTIVE"
                        ? "bg-green-100 text-green-700"
                        : admin.status === "SUSPENDED"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                    }`}>
                      {admin.status === "ACTIVE" ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : admin.status === "SUSPENDED" ? (
                        <XCircle className="h-3 w-3" />
                      ) : (
                        <AlertTriangle className="h-3 w-3" />
                      )}
                      {admin.status === "ACTIVE" ? "Active" : admin.status === "SUSPENDED" ? "Suspended" : "Pending"}
                    </span>

                    {/* Actions - Don't allow editing own account or other superadmins (unless self) */}
                    {admin.id !== currentUser?.id && (
                      <div className="flex items-center gap-1">
                        {admin.status === "SUSPENDED" && (
                          <button
                            onClick={() => handleActivate(admin)}
                            className="rounded-lg p-2 text-green-600 hover:bg-green-50 transition-colors"
                            title="Activate"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => openEditModal(admin)}
                          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {admin.status !== "SUSPENDED" && (
                          <button
                            onClick={() => openDeleteModal(admin)}
                            className="rounded-lg p-2 text-amber-600 hover:bg-amber-50 transition-colors"
                            title="Suspend"
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => openPermanentDeleteModal(admin)}
                          className="rounded-lg p-2 text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete permanently"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}

                    {admin.id === currentUser?.id && (
                      <span className="text-xs text-gray-400 italic">You</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => { setShowCreateModal(false); setError(null); resetForm(); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display text-xl font-bold text-brand-primary mb-4">
              Create New Admin
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 p-3 text-sm text-gray-900 outline-none focus:border-brand-primary placeholder:text-gray-400"
                  placeholder="admin@jfalcon.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 p-3 text-sm text-gray-900 outline-none focus:border-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 p-3 text-sm text-gray-900 outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Role *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as "ADMIN" | "SUPERADMIN" })}
                  className="w-full rounded-xl border border-gray-200 p-3 text-sm text-gray-900 outline-none focus:border-brand-primary"
                >
                  <option value="ADMIN">Admin (Teacher)</option>
                  <option value="SUPERADMIN">Super Admin</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Admins can manage classes and students. Super Admins have full access.
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  value={formData.temporaryPassword}
                  onChange={(e) => setFormData({ ...formData, temporaryPassword: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 p-3 text-sm text-gray-900 outline-none focus:border-brand-primary placeholder:text-gray-400"
                  placeholder="••••••••"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Minimum 6 characters.
                </p>
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="mt-6 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setError(null);
                  resetForm();
                }}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2 text-sm font-bold text-white hover:bg-brand-primary/90 disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Admin
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedAdmin && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => { setShowEditModal(false); setSelectedAdmin(null); setError(null); resetForm(); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display text-xl font-bold text-brand-primary mb-4">
              Edit Admin
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 p-3 text-sm text-gray-900 outline-none focus:border-brand-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 p-3 text-sm text-gray-900 outline-none focus:border-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 p-3 text-sm text-gray-900 outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as "ADMIN" | "SUPERADMIN" })}
                  className="w-full rounded-xl border border-gray-200 p-3 text-sm text-gray-900 outline-none focus:border-brand-primary"
                >
                  <option value="ADMIN">Admin (Teacher)</option>
                  <option value="SUPERADMIN">Super Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={formData.temporaryPassword}
                  onChange={(e) => setFormData({ ...formData, temporaryPassword: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 p-3 text-sm text-gray-900 outline-none focus:border-brand-primary placeholder:text-gray-400"
                  placeholder="Leave blank to keep current password"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Only fill this if you want to change the admin&apos;s password.
                </p>
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="mt-6 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedAdmin(null);
                  setError(null);
                  resetForm();
                }}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2 text-sm font-bold text-white hover:bg-brand-primary/90 disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Changes
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete/Suspend Confirmation Modal */}
      {showDeleteModal && selectedAdmin && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => { setShowDeleteModal(false); setSelectedAdmin(null); setError(null); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                <Ban className="h-6 w-6 text-amber-600" />
              </div>
              <h2 className="mt-4 font-display text-xl font-bold text-gray-900">
                Suspend Admin
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Are you sure you want to suspend{" "}
                <span className="font-bold">
                  {selectedAdmin.firstName 
                    ? `${selectedAdmin.firstName} ${selectedAdmin.lastName}`
                    : selectedAdmin.email}
                </span>
                ? This action can be reversed.
              </p>
            </div>

            {error && (
              <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="mt-6 flex gap-3 justify-center">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedAdmin(null);
                  setError(null);
                }}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSuspend}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Suspend
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Permanent Delete Confirmation Modal */}
      {showPermanentDeleteModal && selectedAdmin && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => { setShowPermanentDeleteModal(false); setSelectedAdmin(null); setError(null); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h2 className="mt-4 font-display text-xl font-bold text-gray-900">
                  Delete Permanently
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                  Are you sure you want to <span className="font-bold text-red-600">permanently delete</span>{" "}
                <span className="font-bold">
                  {selectedAdmin.firstName 
                    ? `${selectedAdmin.firstName} ${selectedAdmin.lastName}`
                    : selectedAdmin.email}
                </span>
                  ? This will remove the account and all associated data. This action <span className="font-bold text-red-600">cannot be undone</span>.
              </p>
            </div>

            {error && (
              <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="mt-6 flex gap-3 justify-center">
              <button
                onClick={() => {
                  setShowPermanentDeleteModal(false);
                  setSelectedAdmin(null);
                  setError(null);
                }}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50"
              >
                  Cancel
              </button>
              <button
                onClick={handlePermanentDelete}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Delete Permanently
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
