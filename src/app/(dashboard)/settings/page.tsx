"use client";

import { motion } from "framer-motion";
import { Settings, Shield, ToggleLeft, ToggleRight, UserCog, AlertTriangle, ChevronRight, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { useAuthStore } from "@/store/auth";

export default function SettingsPage() {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === "SUPERADMIN";
  
  // Mock State for Settings
  const [modules, setModules] = useState({
    jobsParams: true,
    academy: true,
  });

  const toggleModule = (key: keyof typeof modules) => {
    setModules(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">
            System Configuration
          </h1>
          <p className="text-gray-500">
            Manage global settings, module visibility, and user roles.
          </p>
        </div>
      </div>

      {/* Admin Management Card - Only for SUPERADMIN */}
      {isSuperAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link 
            href="/settings/admins"
            className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50 p-6 shadow-sm hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-gray-900">
                  Admin Management
                </h2>
                <p className="text-sm text-gray-600">
                  Create, edit and manage administrator and teacher accounts
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-brand-primary transition-colors" />
          </Link>
        </motion.div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Module Visibility Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: isSuperAdmin ? 0.1 : 0 }}
          className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <div className="mb-6 flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-gray-900">Module Visibility</h2>
              <p className="text-xs text-gray-500">Control which features are visible to users.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-gray-100 p-4">
              <div>
                <p className="font-semibold text-gray-900">Jobs Module</p>
                <p className="text-xs text-gray-500">Enable access to job opportunities</p>
              </div>
              <button 
                onClick={() => toggleModule("jobsParams")}
                className={`transition-colors ${modules.jobsParams ? "text-brand-primary" : "text-gray-300"}`}
              >
                {modules.jobsParams ? <ToggleRight className="h-8 w-8" /> : <ToggleLeft className="h-8 w-8" />}
              </button>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-gray-100 p-4">
              <div>
                <p className="font-semibold text-gray-900">Academy Module</p>
                <p className="text-xs text-gray-500">Enable learning materials</p>
              </div>
              <button 
                onClick={() => toggleModule("academy")}
                className={`transition-colors ${modules.academy ? "text-brand-primary" : "text-gray-300"}`}
              >
                {modules.academy ? <ToggleRight className="h-8 w-8" /> : <ToggleLeft className="h-8 w-8" />}
              </button>
            </div>
          </div>
        </motion.div>

        {/* System Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: isSuperAdmin ? 0.2 : 0.1 }}
          className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <div className="mb-6 flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-gray-900">System Information</h2>
              <p className="text-xs text-gray-500">General platform status.</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-gray-100 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 text-green-600">
                  <UserCog className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900">System Status</p>
                  <p className="text-xs text-gray-500">All services operational</p>
                </div>
              </div>
              <span className="px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-700">
                Active
              </span>
            </div>
            
            <div className="flex items-center justify-between rounded-xl border border-gray-100 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <Settings className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900">Version</p>
                  <p className="text-xs text-gray-500">JFalcon Admin Panel</p>
                </div>
              </div>
              <span className="px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-700">
                v1.0.0
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Strike System Configuration */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: isSuperAdmin ? 0.3 : 0.2 }}
        className="rounded-2xl border border-gray-200 bg-white p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-red-100 rounded-lg text-red-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-gray-900">Strike & Attendance Policy</h2>
            <p className="text-sm text-gray-500">Configure penalties for late cancellations and absences.</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Late Cancellation Threshold</label>
            <div className="relative">
              <input 
                type="number" 
                defaultValue={24}
                className="w-full rounded-xl border border-gray-200 p-3 pr-16 text-sm outline-none focus:border-brand-primary font-medium"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">Hours</span>
            </div>
            <p className="mt-1.5 text-xs text-gray-500">Cancellations made less than this time before class count as a strike.</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Strike Limit</label>
            <div className="relative">
              <input 
                type="number" 
                defaultValue={3}
                className="w-full rounded-xl border border-gray-200 p-3 pr-16 text-sm outline-none focus:border-brand-primary font-medium"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">Strikes</span>
            </div>
            <p className="mt-1.5 text-xs text-gray-500">Number of strikes before the penalty is applied.</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Penalty Duration</label>
            <div className="relative">
              <input 
                type="number" 
                defaultValue={2}
                className="w-full rounded-xl border border-gray-200 p-3 pr-20 text-sm outline-none focus:border-brand-primary font-medium"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">Weeks</span>
            </div>
            <p className="mt-1.5 text-xs text-gray-500">Time a student is suspended from booking after limit is reached.</p>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <button className="rounded-xl bg-brand-primary px-6 py-2 text-sm font-bold text-white hover:bg-brand-primary/90">
                Save Policy
          </button>
        </div>
      </motion.div>
    </div>
  );
}

