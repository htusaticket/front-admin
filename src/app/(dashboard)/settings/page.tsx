"use client";

import { motion } from "framer-motion";
import { Settings, Shield, ToggleLeft, ToggleRight, UserCog, AlertTriangle } from "lucide-react";
import { useState } from "react";

export default function SettingsPage() {
  // Mock State for Settings
  const [modules, setModules] = useState({
    jobsParams: true,
    academy: true,
  });

  const [users, setUsers] = useState([
    { id: 1, name: "Admin User", email: "admin@jfalcon.com", role: "Super Admin", status: "Active" },
    { id: 2, name: "Job Uploader", email: "jobs@jfalcon.com", role: "Uploader", status: "Active" },
    { id: 3, name: "Teacher Sarah", email: "sarah@jfalcon.com", role: "Teacher", status: "Inactive" },
  ]);

  const toggleModule = (key: keyof typeof modules) => {
    setModules(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleUserStatus = (id: number) => {
    setUsers(prev => prev.map(user => {
      if (user.id === id) {
        return { ...user, status: user.status === "Active" ? "Inactive" : "Active" };
      }
      return user;
    }));
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

      <div className="grid gap-6 md:grid-cols-2">
        {/* Module Visibility Settings */}
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
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
                onClick={() => toggleModule('jobsParams')}
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
                onClick={() => toggleModule('academy')}
                className={`transition-colors ${modules.academy ? "text-brand-primary" : "text-gray-300"}`}
              >
                {modules.academy ? <ToggleRight className="h-8 w-8" /> : <ToggleLeft className="h-8 w-8" />}
              </button>
            </div>
          </div>
        </motion.div>

        {/* User Role Management */}
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.1 }}
           className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
        >
           <div className="mb-6 flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-gray-900">User Management</h2>
              <p className="text-xs text-gray-500">Manage admin access and special roles.</p>
            </div>
          </div>

          <div className="space-y-3">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between rounded-xl border border-gray-100 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                    <UserCog className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                    user.status === 'Active' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {user.status}
                  </span>
                  <button 
                    onClick={() => toggleUserStatus(user.id)}
                    className="text-xs font-semibold text-brand-primary hover:underline"
                  >
                    {user.status === 'Active' ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Strike System Configuration */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
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
                      className="w-full rounded-xl border border-gray-200 p-3 pr-12 text-sm outline-none focus:border-brand-primary font-medium"
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
                      className="w-full rounded-xl border border-gray-200 p-3 pr-12 text-sm outline-none focus:border-brand-primary font-medium"
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
                      className="w-full rounded-xl border border-gray-200 p-3 pr-12 text-sm outline-none focus:border-brand-primary font-medium"
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
      </div>
    </div>
  );
}

