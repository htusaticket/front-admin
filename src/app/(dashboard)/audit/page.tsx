"use client";

import { Search, Filter, Calendar, ShieldAlert } from "lucide-react";
import { useState } from "react";

import { AuditDetailModal } from "@/components/audit/AuditDetailModal";
import { Pagination } from "@/components/ui/Pagination";

// Mock Audit Logs
const MOCK_LOGS = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  adminName: ["Admin User", "Super Admin", "Job Uploader"][i % 3],
  action: ["Created Challenge", "Deleted User", "Updated Settings", "Uploaded Jobs", "Reviewed Submission"][i % 5],
  target: ["Challenge #101", "User: John Doe", "System Config", "Job: Senior Dev", "Audio: Podcast"][i % 5],
  timestamp: new Date(Date.now() - i * 3600000).toLocaleString(),
  type: ["Create", "Delete", "Update", "Upload", "Review"][i % 5],
}));

export default function AuditPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLog, setSelectedLog] = useState<typeof MOCK_LOGS[0] | null>(null);

  const filteredLogs = MOCK_LOGS.filter(log =>
    log.adminName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.target.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">
            Audit Logs
          </h1>
          <p className="text-gray-500">
            Track administrator actions and system changes.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-2 text-sm outline-none focus:border-brand-primary"
          />
        </div>

        <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg text-sm font-medium text-gray-600 border border-gray-200">
          <Filter className="h-4 w-4" />
          <span>Filter (Mock)</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Admin</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Action</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Target</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {paginatedLogs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                      {log.adminName.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{log.adminName}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${
                    log.type === "Delete" ? "bg-red-50 text-red-700 border border-red-100" :
                      log.type === "Create" ? "bg-green-50 text-green-700 border border-green-100" :
                        "bg-gray-50 text-gray-700 border border-gray-100"
                  }`}>
                    {log.type === "Delete" && <ShieldAlert className="h-3 w-3" />}
                    {log.action}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {log.target}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5" />
                  {log.timestamp}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-primary font-medium hover:underline cursor-pointer">
                  <button onClick={() => setSelectedLog(log)}>View Details</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          totalItems={filteredLogs.length}
        />
      </div>

      <AuditDetailModal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        log={selectedLog}
      />
    </div>
  );
}
