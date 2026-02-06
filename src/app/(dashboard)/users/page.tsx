"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { Search, Filter, SlidersHorizontal } from "lucide-react";

import { AddUserModal } from "@/components/users/AddUserModal";
import { Pagination } from "@/components/ui/Pagination";

// Mock Data Generator
const generateMockUsers = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: [
        "Jane Cooper", "Cody Fisher", "Esther Howard", "Jenny Wilson", 
        "Kristin Watson", "Cameron Williamson", "Jerome Bell", "Darlene Robertson"
    ][i % 8] + (i > 7 ? ` ${i}` : ""),
    email: `user${i + 1}@example.com`,
    role: ["Student", "Teacher", "Admin"][i % 3],
    lastLogin: ["2 hours ago", "1 day ago", "3 days ago", "1 week ago", "Never"][i % 5],
    joinedAt: new Date(2024, 0, 1 + i).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    status: i % 4 === 0 ? "Inactive" : "Active",
    avatar: ["JC", "CF", "EH", "JW", "KW", "CW", "JB", "DR"][i % 8],
    avatarColor: [
        "bg-red-100 text-red-700", 
        "bg-orange-100 text-orange-700", 
        "bg-amber-100 text-amber-700", 
        "bg-green-100 text-green-700", 
        "bg-teal-100 text-teal-700", 
        "bg-blue-100 text-blue-700", 
        "bg-indigo-100 text-indigo-700", 
        "bg-purple-100 text-purple-700"
    ][i % 8]
  }));
};

const mockUsers = generateMockUsers(56);

export default function UsersPage() {
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Inactive">("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter and Search Logic
  const filteredUsers = useMemo(() => {
    return mockUsers.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            user.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "All" || user.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, statusFilter]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset page when filters change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
      setCurrentPage(1);
  };
  
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setStatusFilter(e.target.value as "All" | "Active" | "Inactive");
      setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
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
                    onChange={handleSearchChange}
                    className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-2 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 sm:w-64"
                />
            </div>

            {/* Filter */}
            <div className="relative">
                <SlidersHorizontal className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <select
                    value={statusFilter}
                    onChange={handleStatusChange}
                    className="w-full appearance-none rounded-xl border border-gray-200 bg-white pl-10 pr-8 py-2 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 cursor-pointer"
                >
                    <option value="All">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                </select>
            </div>

            <button 
            onClick={() => setIsAddUserOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-2 text-sm font-bold text-white shadow-lg shadow-brand-primary/20 transition-all hover:bg-brand-primary/90"
            >
            <span>+ Add User</span>
            </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Name
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Email
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Role
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Last Login
              </th>
               <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Joined
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {paginatedUsers.length > 0 ? (
                paginatedUsers.map((user) => (
                    <tr 
                    key={user.id}
                    onClick={() => window.location.href = `/users/${user.id}`} 
                    className="group cursor-pointer transition-colors hover:bg-gray-50"
                    >
                    <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center">
                        <div className={`h-10 w-10 shrink-0 rounded-full ${user.avatarColor} flex items-center justify-center font-bold text-sm`}>
                            {user.avatar}
                        </div>
                        <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 group-hover:text-brand-primary transition-colors">
                            {user.name}
                            </div>
                        </div>
                        </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm text-gray-500">{user.email}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm text-gray-500">
                        {user.role}
                        </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm text-gray-500">
                        {user.lastLogin}
                        </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm text-gray-500">
                        {user.joinedAt}
                        </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold leading-5 ${
                            user.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                        {user.status}
                        </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                        <Link 
                        href={`/users/${user.id}`} 
                        onClick={(e) => e.stopPropagation()}
                        className="text-brand-primary hover:text-brand-primary/80 font-bold"
                        >
                        Edit
                        </Link>
                    </td>
                    </tr>
                ))
            ) : (
                <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        No users found matching your filters.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
        <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            totalItems={filteredUsers.length}
        />
      </div>

      <AddUserModal isOpen={isAddUserOpen} onClose={() => setIsAddUserOpen(false)} />
    </div>
  );
}
