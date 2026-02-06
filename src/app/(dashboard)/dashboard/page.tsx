"use client";

import { motion } from "framer-motion";
import {
  Users,
  Briefcase,
  Video,
  FileText,
  BookOpen,
} from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header Section */}
      <div>
        <h1 className="font-display text-2xl font-bold text-brand-primary sm:text-3xl">
          Admin Dashboard
        </h1>
        <p className="mt-2 text-base text-gray-700 sm:text-lg">
          Welcome back, Admin. Here&apos;s what&apos;s happening today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Users */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Users</p>
              <p className="mt-1 font-display text-3xl font-bold text-brand-primary">
                1,234
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <p className="mt-2 text-xs font-semibold text-green-600">
            +12% from last month
          </p>
        </motion.div>

        {/* Active Jobs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Jobs</p>
              <p className="mt-1 font-display text-3xl font-bold text-brand-primary">
                15
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
              <Briefcase className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <p className="mt-2 text-xs font-semibold text-green-600">
            +4 new this week
          </p>
        </motion.div>

        {/* Classes Scheduled */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Classes Today
              </p>
              <p className="mt-1 font-display text-3xl font-bold text-brand-primary">
                8
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-cyan-dark/10">
              <Video className="h-6 w-6 text-brand-cyan-dark" />
            </div>
          </div>
          <p className="mt-2 text-xs font-semibold text-gray-500">
            Next class in 30 mins
          </p>
        </motion.div>

        {/* Pending Applications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Applications
              </p>
              <p className="mt-1 font-display text-3xl font-bold text-brand-primary">
                42
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
              <FileText className="h-6 w-6 text-amber-600" />
            </div>
          </div>
          <p className="mt-2 text-xs font-semibold text-amber-600">
            12 pending review
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
              <button className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 transition-all hover:border-brand-primary/20 hover:shadow-md group">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 group-hover:bg-blue-100 transition-colors">
                  <span className="text-2xl text-blue-600">+</span>
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-900">Add New User</p>
                  <p className="text-sm text-gray-500">Register a new student</p>
                </div>
              </button>
              
              <button className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 transition-all hover:border-brand-primary/20 hover:shadow-md group">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-50 group-hover:bg-purple-100 transition-colors">
                  <Briefcase className="h-5 w-5 text-purple-600" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-900">Post Job</p>
                  <p className="text-sm text-gray-500">Create a new listing</p>
                </div>
              </button>

              <button className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 transition-all hover:border-brand-primary/20 hover:shadow-md group">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-cyan-dark/10 group-hover:bg-brand-cyan-dark/20 transition-colors">
                  <Video className="h-5 w-5 text-brand-cyan-dark" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-900">Schedule Class</p>
                  <p className="text-sm text-gray-500">Set up a session</p>
                </div>
              </button>

              <button className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 transition-all hover:border-brand-primary/20 hover:shadow-md group">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 group-hover:bg-amber-100 transition-colors">
                  <BookOpen className="h-5 w-5 text-amber-600" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-900">Manage Content</p>
                  <p className="text-sm text-gray-500">Update academy materials</p>
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
                {/* Item 1 */}
                <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100">
                        <Users className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-900">New User Registered</p>
                        <p className="text-xs text-gray-500">María Gonzalez joined the platform.</p>
                        <p className="text-[10px] text-gray-400 mt-1">10 mins ago</p>
                    </div>
                </div>
                {/* Item 2 */}
                <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100">
                        <Briefcase className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-900">New Job Application</p>
                        <p className="text-xs text-gray-500">John Doe applied for "Senior Frontend Dev".</p>
                        <p className="text-[10px] text-gray-400 mt-1">1 hour ago</p>
                    </div>
                </div>
                 {/* Item 3 */}
                 <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100">
                        <Video className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-900">Class Finished</p>
                        <p className="text-xs text-gray-500">"Conversational Advanced II" ended.</p>
                        <p className="text-[10px] text-gray-400 mt-1">2 hours ago</p>
                    </div>
                </div>
                 {/* Item 4 */}
                 <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100">
                        <FileText className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-900">System Update</p>
                        <p className="text-xs text-gray-500">Backup completed successfully.</p>
                        <p className="text-[10px] text-gray-400 mt-1">5 hours ago</p>
                    </div>
                </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
