"use client";

import { motion } from "framer-motion";
import {
  Briefcase,
  ChevronRight,
  GripVertical,
} from "lucide-react";
import Link from "next/link";

// Mock data
const applications = {
  applied: [
    {
      id: 1,
      title: "Customer Success Manager",
      company: "SaaS Solutions",
      appliedDate: "Jan 28, 2026",
    },
    {
      id: 2,
      title: "Marketing Coordinator",
      company: "Digital Agency",
      appliedDate: "Jan 26, 2026",
    },
  ],
  interview: [
    {
      id: 3,
      title: "Content Writer",
      company: "Media Corp",
      appliedDate: "Jan 20, 2026",
      interviewDate: "Feb 02, 2026",
    },
  ],
  offer: [
    {
      id: 4,
      title: "Sales Representative",
      company: "Tech Startup",
      appliedDate: "Jan 15, 2026",
      offerAmount: "$75k/year",
    },
  ],
  rejected: [
    {
      id: 5,
      title: "Product Manager",
      company: "Big Corp",
      appliedDate: "Jan 10, 2026",
      rejectedDate: "Jan 24, 2026",
    },
  ],
};

export default function MyApplicationsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Link
          href="/jobs"
          className="font-semibold text-brand-cyan-dark hover:underline"
        >
          Jobs
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-gray-900">My Applications</span>
      </div>

      <div>
        <h1 className="font-display text-3xl font-bold text-brand-primary">
          My Applications
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Manage the status of your job applications
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-center">
          <p className="text-2xl font-bold text-blue-900">
            {applications.applied.length}
          </p>
          <p className="text-xs font-semibold text-blue-700">Applied</p>
        </div>
        <div className="rounded-xl border border-purple-200 bg-purple-50 p-4 text-center">
          <p className="text-2xl font-bold text-purple-900">
            {applications.interview.length}
          </p>
          <p className="text-xs font-semibold text-purple-700">Interview</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center">
          <p className="text-2xl font-bold text-green-900">
            {applications.offer.length}
          </p>
          <p className="text-xs font-semibold text-green-700">Offer</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center">
          <p className="text-2xl font-bold text-red-900">
            {applications.rejected.length}
          </p>
          <p className="text-xs font-semibold text-red-700">Rejected</p>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {/* Applied Column */}
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <h3 className="mb-4 font-display text-sm font-bold uppercase tracking-wider text-brand-primary">
            Applied ({applications.applied.length})
          </h3>
          <div className="space-y-3">
            {applications.applied.map((app) => (
              <motion.div
                key={app.id}
                className="cursor-move rounded-xl border border-blue-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
              >
                <div className="mb-3 flex items-start gap-2">
                  <GripVertical className="h-4 w-4 shrink-0 text-gray-400" />
                  <div className="flex-1">
                    <h4 className="font-bold text-brand-primary">
                      {app.title}
                    </h4>
                    <p className="text-sm text-gray-600">{app.company}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Briefcase className="h-3 w-3" />
                  <span>Applied: {app.appliedDate}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Interview Column */}
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <h3 className="mb-4 font-display text-sm font-bold uppercase tracking-wider text-brand-primary">
            Interview ({applications.interview.length})
          </h3>
          <div className="space-y-3">
            {applications.interview.map((app) => (
              <motion.div
                key={app.id}
                className="cursor-move rounded-xl border border-purple-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
              >
                <div className="mb-3 flex items-start gap-2">
                  <GripVertical className="h-4 w-4 shrink-0 text-gray-400" />
                  <div className="flex-1">
                    <h4 className="font-bold text-brand-primary">
                      {app.title}
                    </h4>
                    <p className="text-sm text-gray-600">{app.company}</p>
                  </div>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Briefcase className="h-3 w-3" />
                    <span>Applied: {app.appliedDate}</span>
                  </div>
                  <div className="rounded bg-purple-100 px-2 py-1 font-semibold text-purple-700">
                    Interview: {app.interviewDate}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Offer Column */}
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <h3 className="mb-4 font-display text-sm font-bold uppercase tracking-wider text-brand-primary">
            Offer ({applications.offer.length})
          </h3>
          <div className="space-y-3">
            {applications.offer.map((app) => (
              <motion.div
                key={app.id}
                className="cursor-move rounded-xl border border-green-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
              >
                <div className="mb-3 flex items-start gap-2">
                  <GripVertical className="h-4 w-4 shrink-0 text-gray-400" />
                  <div className="flex-1">
                    <h4 className="font-bold text-brand-primary">
                      {app.title}
                    </h4>
                    <p className="text-sm text-gray-600">{app.company}</p>
                  </div>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Briefcase className="h-3 w-3" />
                    <span>Applied: {app.appliedDate}</span>
                  </div>
                  <div className="rounded bg-green-100 px-2 py-1 font-semibold text-green-700">
                    Offer: {app.offerAmount}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Rejected Column */}
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <h3 className="mb-4 font-display text-sm font-bold uppercase tracking-wider text-brand-primary">
            Rejected ({applications.rejected.length})
          </h3>
          <div className="space-y-3">
            {applications.rejected.map((app) => (
              <motion.div
                key={app.id}
                className="cursor-move rounded-xl border border-red-200 bg-white p-4 opacity-75 shadow-sm"
              >
                <div className="mb-3 flex items-start gap-2">
                  <GripVertical className="h-4 w-4 shrink-0 text-gray-400" />
                  <div className="flex-1">
                    <h4 className="font-bold text-brand-primary">
                      {app.title}
                    </h4>
                    <p className="text-sm text-gray-600">{app.company}</p>
                  </div>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Briefcase className="h-3 w-3" />
                    <span>Applied: {app.appliedDate}</span>
                  </div>
                  <div className="rounded bg-red-100 px-2 py-1 font-semibold text-red-700">
                    Rejected: {app.rejectedDate}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm text-blue-900">
          💡 <strong>Tip:</strong> Drag cards between columns to update your application status
        </p>
      </div>
    </div>
  );
}
