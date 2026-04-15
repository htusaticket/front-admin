"use client";

import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  ChevronDown,
  Edit2,
  Trash2,
  XCircle,
  Check,
  X,
  Loader2,
  AlertTriangle,
  User,
  Calendar,
  DollarSign,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";

import { useModalLock } from "@/hooks/useModalLock";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { useSubscriptionsStore, type CreateSubscriptionDto, type UpdateSubscriptionDto } from "@/store/subscriptions";
import type { Subscription, UserPlan, SubscriptionStatus, AdminUser } from "@/types/admin";

// Plan options
const PLAN_OPTIONS: { value: UserPlan; label: string; description: string }[] = [
  { value: "PRO", label: "Pro", description: "Full access to all features" },
  { value: "ELITE", label: "Elite", description: "Full access to all features" },
  { value: "LEVEL_UP", label: "Level Up", description: "Full access to all features" },
  { value: "HIRING_HUB", label: "Hiring Hub", description: "Content + Job Board (no live classes)" },
  { value: "SKILL_BUILDER", label: "Skill Builder", description: "Content only" },
  { value: "SKILL_BUILDER_LIVE", label: "Skill Builder Live", description: "Content + Live classes" },
];

// Status badge component
const StatusBadge = ({ status }: { status: SubscriptionStatus }) => {
  const styles = {
    ACTIVE: "bg-green-100 text-green-700",
    EXPIRED: "bg-gray-100 text-gray-700",
    CANCELLED: "bg-red-100 text-red-700",
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  );
};

// Plan badge component
const PlanBadge = ({ plan }: { plan: UserPlan }) => {
  const styles: Record<UserPlan, string> = {
    PRO: "bg-purple-100 text-purple-700",
    ELITE: "bg-amber-100 text-amber-700",
    LEVEL_UP: "bg-blue-100 text-blue-700",
    HIRING_HUB: "bg-cyan-100 text-cyan-700",
    SKILL_BUILDER: "bg-gray-100 text-gray-700",
    SKILL_BUILDER_LIVE: "bg-teal-100 text-teal-700",
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[plan]}`}>
      {plan.replace("_", " ")}
    </span>
  );
};

export default function SubscriptionsPage() {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === "SUPERADMIN";
  
  const {
    subscriptions,
    isLoading,
    isSaving,
    pagination,
    filters,
    fetchSubscriptions,
    createSubscription,
    updateSubscription,
    deleteSubscription,
    cancelSubscription,
    setFilters,
  } = useSubscriptionsStore();

  // Parse date as local timezone (avoids UTC midnight shifting back a day)
  const parseLocalDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  };

  // Helper to detect far-future "infinite" dates
  const isInfiniteDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return true;
    const year = new Date(dateStr).getUTCFullYear();
    return year >= 2090;
  };

  // Local state
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  
  // Users for select dropdown
  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const [editStatus, setEditStatus] = useState<SubscriptionStatus>("ACTIVE");

  // Lock body scroll and escape for modals
  useModalLock(showCreateModal, () => setShowCreateModal(false));
  useModalLock(showEditModal, () => { setShowEditModal(false); setSelectedSubscription(null); });
  useModalLock(showDeleteModal, () => { setShowDeleteModal(false); setSelectedSubscription(null); });
  useModalLock(showCancelModal, () => { setShowCancelModal(false); setSelectedSubscription(null); });

  // Form state for create/edit
  const [formData, setFormData] = useState<CreateSubscriptionDto>({
    userId: "",
    plan: "PRO",
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
    hasPaid: false,
    paymentNote: "",
  });

  // Fetch subscriptions on mount
  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  // Fetch all users for the select dropdown
  const fetchAllUsers = async () => {
    if (allUsers.length > 0) return; // Already loaded
    try {
      setLoadingUsers(true);
      const response = await api.get("/api/admin/users?limit=500&role=USER");
      const data = response.data.data || response.data;
      setAllUsers(data.users || data.items || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Handle search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== filters.search) {
        fetchSubscriptions({ search: searchTerm, page: 1 });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, filters.search, fetchSubscriptions]);

  // Close filters dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close user dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle create subscription
  const handleCreate = async () => {
    // Backend requires endDate as valid ISO date string, use far-future date for "Infinite"
    const createData = {
      ...formData,
      endDate: formData.endDate || "2099-12-31",
    };
    const success = await createSubscription(createData);
    if (success) {
      setShowCreateModal(false);
      resetForm();
    }
  };

  // Handle update subscription
  const handleUpdate = async () => {
    if (!selectedSubscription) return;
    
    const updateData: UpdateSubscriptionDto = {
      plan: formData.plan,
      status: editStatus,
      startDate: formData.startDate || undefined,
      endDate: formData.endDate || "2099-12-31",
      hasPaid: formData.hasPaid,
      paymentNote: formData.paymentNote || undefined,
    };

    // Remove undefined values to avoid sending empty strings
    const cleanData = Object.fromEntries(
      Object.entries(updateData).filter(([, v]) => v !== undefined),
    ) as UpdateSubscriptionDto;
    
    const success = await updateSubscription(selectedSubscription.id, cleanData);
    if (success) {
      setShowEditModal(false);
      setSelectedSubscription(null);
      resetForm();
    }
  };

  // Handle delete subscription
  const handleDelete = async () => {
    if (!selectedSubscription) return;
    const success = await deleteSubscription(selectedSubscription.id);
    if (success) {
      setShowDeleteModal(false);
      setSelectedSubscription(null);
    }
  };

  // Handle cancel subscription
  const handleCancel = async () => {
    if (!selectedSubscription) return;
    const success = await cancelSubscription(selectedSubscription.id);
    if (success) {
      setShowCancelModal(false);
      setSelectedSubscription(null);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      userId: "",
      plan: "PRO",
      startDate: format(new Date(), "yyyy-MM-dd"),
      endDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
      hasPaid: false,
      paymentNote: "",
    });
    setUserSearchQuery("");
    setEditStatus("ACTIVE");
  };

  // Open edit modal
  const openEditModal = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setEditStatus(subscription.status);
    setFormData({
      userId: subscription.userId,
      plan: subscription.plan,
      startDate: format(parseLocalDate(subscription.startDate), "yyyy-MM-dd"),
      endDate: subscription.endDate && !isInfiniteDate(subscription.endDate) ? format(parseLocalDate(subscription.endDate), "yyyy-MM-dd") : "",
      hasPaid: subscription.hasPaid,
      paymentNote: subscription.paymentNote || "",
    });
    setShowEditModal(true);
  };

  // Check if user can manage subscriptions (only SUPERADMIN)
  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertTriangle className="h-16 w-16 text-amber-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Access Restricted</h2>
        <p className="text-gray-500 text-center max-w-md">
          Only Super Administrators can manage subscriptions. 
          Please contact your supervisor if you need access to this feature.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">
            Subscriptions Management
          </h1>
          <p className="text-gray-500">
            Manage user subscriptions and payment status.
          </p>
        </div>
        <button
          onClick={() => {
            fetchAllUsers();
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2 text-sm font-bold text-white hover:bg-brand-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Subscription
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by user email or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand-primary"
          />
        </div>
        
        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Filter className="h-4 w-4" />
            Filters
            <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </button>
          
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-gray-200 bg-white p-4 shadow-lg z-10"
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">Status</label>
                  <select
                    value={filters.status || ""}
                    onChange={(e) => {
                      const val = e.target.value as SubscriptionStatus || undefined;
                      fetchSubscriptions({ status: val, page: 1 });
                    }}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-primary"
                  >
                    <option value="">All Statuses</option>
                    <option value="ACTIVE">Active</option>
                    <option value="EXPIRED">Expired</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">Plan</label>
                  <select
                    value={filters.plan || ""}
                    onChange={(e) => fetchSubscriptions({ plan: e.target.value as UserPlan || undefined, page: 1 })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-primary"
                  >
                    <option value="">All Plans</option>
                    {PLAN_OPTIONS.map((plan) => (
                      <option key={plan.value} value={plan.value}>{plan.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">Payment</label>
                  <select
                    value={filters.hasPaid === undefined ? "" : filters.hasPaid ? "true" : "false"}
                    onChange={(e) => {
                      const val = e.target.value;
                      fetchSubscriptions({ hasPaid: val === "" ? undefined : val === "true", page: 1 });
                    }}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-primary"
                  >
                    <option value="">All</option>
                    <option value="true">Paid</option>
                    <option value="false">Pending</option>
                  </select>
                </div>
                <button
                  onClick={() => {
                    setFilters({ status: undefined, plan: undefined, hasPaid: undefined });
                    fetchSubscriptions({ status: undefined, plan: undefined, hasPaid: undefined, page: 1 });
                    setShowFilters(false);
                  }}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Clear Filters
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Subscriptions Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-gray-200 bg-white overflow-hidden"
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <CreditCard className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500">No subscriptions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {subscriptions.map((subscription) => (
                  <tr key={subscription.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
                          <User className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {subscription.user?.firstName} {subscription.user?.lastName}
                          </p>
                          <p className="text-sm text-gray-500">{subscription.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <PlanBadge plan={subscription.plan} />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={subscription.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {format(parseLocalDate(subscription.startDate), "MMM d")} - {isInfiniteDate(subscription.endDate) ? "∞ Infinite" : format(parseLocalDate(subscription.endDate!), "MMM d, yyyy")}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {subscription.hasPaid ? (
                          <span className="flex items-center gap-1 text-green-600 text-sm">
                            <Check className="h-4 w-4" />
                            Paid
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-amber-600 text-sm">
                            <DollarSign className="h-4 w-4" />
                            Pending
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(subscription)}
                          className="p-2 text-gray-400 hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {subscription.status === "ACTIVE" && (
                          <button
                            onClick={() => {
                              setSelectedSubscription(subscription);
                              setShowCancelModal(true);
                            }}
                            className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Cancel"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedSubscription(subscription);
                            setShowDeleteModal(true);
                          }}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
            <p className="text-sm text-gray-500">
              Showing {subscriptions.length} of {pagination.total} subscriptions
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchSubscriptions({ page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                className="px-3 py-1 rounded-lg border border-gray-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => fetchSubscriptions({ page: pagination.page + 1 })}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1 rounded-lg border border-gray-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">New Subscription</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    <User className="h-4 w-4 inline mr-1" />
                    Select User
                  </label>
                  {loadingUsers ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading users...
                    </div>
                  ) : (
                    <div className="relative" ref={userDropdownRef}>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search by name or email..."
                          value={userSearchQuery}
                          onChange={(e) => {
                            setUserSearchQuery(e.target.value);
                            setShowUserDropdown(true);
                            if (!e.target.value) setFormData({ ...formData, userId: "" });
                          }}
                          onFocus={() => setShowUserDropdown(true)}
                          className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand-primary"
                        />
                      </div>
                      {showUserDropdown && (
                        <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
                          {allUsers
                            .filter((u) => {
                              const q = userSearchQuery.toLowerCase();
                              return !q || `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(q);
                            })
                            .map((u) => (
                              <button
                                key={u.id}
                                type="button"
                                onClick={() => {
                                  setFormData({ ...formData, userId: u.id });
                                  setUserSearchQuery(`${u.firstName} ${u.lastName} (${u.email})`);
                                  setShowUserDropdown(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-brand-primary/5 transition-colors ${formData.userId === u.id ? "bg-brand-primary/10 font-semibold" : ""}`}
                              >
                                <span className="font-medium text-gray-900">{u.firstName} {u.lastName}</span> <span className="text-gray-500">({u.email})</span>
                              </button>
                            ))}
                          {allUsers.filter((u) => {
                            const q = userSearchQuery.toLowerCase();
                            return !q || `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(q);
                          }).length === 0 && (
                            <div className="px-4 py-3 text-sm text-gray-400 text-center">No users found</div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Plan</label>
                  <select
                    value={formData.plan}
                    onChange={(e) => setFormData({ ...formData, plan: e.target.value as UserPlan })}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary"
                  >
                    {PLAN_OPTIONS.map((plan) => (
                      <option key={plan.value} value={plan.value}>{plan.label} - {plan.description}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">End Date</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Quick Duration</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { const s = new Date(formData.startDate || new Date()); s.setMonth(s.getMonth() + 3); setFormData({ ...formData, endDate: s.toISOString().split("T")[0] }); }} className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-bold text-gray-700 hover:border-brand-primary hover:bg-brand-primary/5 hover:text-brand-primary transition-all">3 Months</button>
                    <button type="button" onClick={() => { const s = new Date(formData.startDate || new Date()); s.setMonth(s.getMonth() + 4); setFormData({ ...formData, endDate: s.toISOString().split("T")[0] }); }} className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-bold text-gray-700 hover:border-brand-primary hover:bg-brand-primary/5 hover:text-brand-primary transition-all">4 Months</button>
                    <button type="button" onClick={() => setFormData({ ...formData, endDate: "" })} className={`flex-1 rounded-xl border px-3 py-2 text-sm font-bold transition-all ${!formData.endDate ? "border-brand-primary bg-brand-primary/10 text-brand-primary" : "border-gray-200 text-gray-700 hover:border-brand-primary hover:bg-brand-primary/5 hover:text-brand-primary"}`}>∞ Infinite</button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="hasPaid"
                    checked={formData.hasPaid}
                    onChange={(e) => setFormData({ ...formData, hasPaid: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                  />
                  <label htmlFor="hasPaid" className="text-sm font-medium text-gray-700">
                    Mark as paid
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Payment Note (optional)</label>
                  <textarea
                    value={formData.paymentNote}
                    onChange={(e) => setFormData({ ...formData, paymentNote: e.target.value })}
                    placeholder="Add any notes about the payment..."
                    rows={2}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary resize-none"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={isSaving || !formData.userId}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-primary text-sm font-bold text-white hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Subscription"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && selectedSubscription && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">Edit Subscription</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-600">
                  <strong>User:</strong> {selectedSubscription.user?.firstName} {selectedSubscription.user?.lastName}
                </p>
                <p className="text-sm text-gray-500">{selectedSubscription.user?.email}</p>
              </div>

              {/* Reactivation banner for cancelled/expired subscriptions */}
              {selectedSubscription.status !== "ACTIVE" && editStatus === "ACTIVE" && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-sm text-green-700 font-medium flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    This subscription will be reactivated upon saving.
                  </p>
                </div>
              )}

              <div className="space-y-4">
                {/* Status selector */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as SubscriptionStatus)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="EXPIRED">Expired</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Plan</label>
                  <select
                    value={formData.plan}
                    onChange={(e) => setFormData({ ...formData, plan: e.target.value as UserPlan })}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary"
                  >
                    {PLAN_OPTIONS.map((plan) => (
                      <option key={plan.value} value={plan.value}>{plan.label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">End Date</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Quick Duration</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { const s = new Date(formData.startDate || new Date()); s.setMonth(s.getMonth() + 3); setFormData({ ...formData, endDate: s.toISOString().split("T")[0] }); }} className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-bold text-gray-700 hover:border-brand-primary hover:bg-brand-primary/5 hover:text-brand-primary transition-all">3 Months</button>
                    <button type="button" onClick={() => { const s = new Date(formData.startDate || new Date()); s.setMonth(s.getMonth() + 4); setFormData({ ...formData, endDate: s.toISOString().split("T")[0] }); }} className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-bold text-gray-700 hover:border-brand-primary hover:bg-brand-primary/5 hover:text-brand-primary transition-all">4 Months</button>
                    <button type="button" onClick={() => setFormData({ ...formData, endDate: "" })} className={`flex-1 rounded-xl border px-3 py-2 text-sm font-bold transition-all ${!formData.endDate ? "border-brand-primary bg-brand-primary/10 text-brand-primary" : "border-gray-200 text-gray-700 hover:border-brand-primary hover:bg-brand-primary/5 hover:text-brand-primary"}`}>∞ Infinite</button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="hasPaidEdit"
                    checked={formData.hasPaid}
                    onChange={(e) => setFormData({ ...formData, hasPaid: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                  />
                  <label htmlFor="hasPaidEdit" className="text-sm font-medium text-gray-700">
                    Mark as paid
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Payment Note</label>
                  <textarea
                    value={formData.paymentNote}
                    onChange={(e) => setFormData({ ...formData, paymentNote: e.target.value })}
                    placeholder="Add any notes about the payment..."
                    rows={2}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary resize-none"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedSubscription(null);
                    resetForm();
                  }}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-primary text-sm font-bold text-white hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && selectedSubscription && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <Trash2 className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Delete Subscription</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete the subscription for{" "}
                <strong>
                  {selectedSubscription.user?.firstName} {selectedSubscription.user?.lastName}
                </strong>? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedSubscription(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {showCancelModal && selectedSubscription && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                  <XCircle className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Cancel Subscription</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to cancel the subscription for{" "}
                <strong>
                  {selectedSubscription.user?.firstName} {selectedSubscription.user?.lastName}
                </strong>? The user will lose access to premium features.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setSelectedSubscription(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Keep Active
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 text-sm font-bold text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    "Cancel Subscription"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
