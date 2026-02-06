"use client";

import { motion } from "framer-motion";
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
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { Pagination } from "@/components/ui/Pagination";
import { EditUserModal } from "@/components/users/EditUserModal";

// Mock Data
const user = {
  id: 1,
  name: "Jane Cooper",
  email: "jane.cooper@example.com",
  role: "Student",
  status: "Active",
  joinedAt: "Jan 2024",
  avatar: "JC",
};

const stats = [
  { label: "Classes Attended", value: "24", icon: CheckCircle, color: "text-green-600", bg: "bg-green-100" },
  { label: "Avg. Attendance", value: "92%", icon: Clock, color: "text-blue-600", bg: "bg-blue-100" },
  { label: "Active Strikes", value: "1", icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-100" },
  { label: "Modules Completed", value: "3", icon: GraduationCap, color: "text-purple-600", bg: "bg-purple-100" },
];

const courses = Array.from({ length: 45 }, (_, i) => ({
  id: i + 1,
  title: `Module ${i + 1}: ${
    ["Business English", "Advanced Grammar", "Presentation Skills", "Technical Writing", "Negotiation", "Email Etiquette"][i % 6]
  }`,
  progress: i < 5 ? 100 : Math.floor(Math.random() * 100),
  score: i < 5 ? `${85 + Math.floor(Math.random() * 15)}%` : i % 3 === 0 ? "-" : `${60 + Math.floor(Math.random() * 30)}%`,
  status: i < 5 ? "Completed" : i % 3 === 0 ? "In Progress" : "Completed",
}));

const attendance = Array.from({ length: 124 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return {
        id: i + 1,
        date: date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        class: ["Conversational II", "Grammar Workshop", "Business Vocabulary", "Pronunciation Lab"][Math.floor(Math.random() * 4)],
        status: Math.random() > 0.1 ? "Present" : "Absent"
    };
});

const strikes = [
  { id: 1, date: "Jan 24, 2024", reason: "Unexcused absence for 'Business Vocabulary'", severity: "Low" },
];

export default function UserDetailPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Pagination State
  const [academyPage, setAcademyPage] = useState(1);
  const [classesPage, setClassesPage] = useState(1);
  const itemsPerPage = 10;

  // Pagination Logic
  const academyTotalPages = Math.ceil(courses.length / itemsPerPage);
  const paginatedCourses = courses.slice(
      (academyPage - 1) * itemsPerPage,
      academyPage * itemsPerPage
  );

  const classesTotalPages = Math.ceil(attendance.length / itemsPerPage);
  const paginatedAttendance = attendance.slice(
      (classesPage - 1) * itemsPerPage,
      classesPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-cyan-light/20 text-xl font-bold text-brand-cyan-dark">
              {user.avatar}
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-gray-900">{user.name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1.5">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </div>
                <div className="flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  {user.role}
                </div>
                <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
                  {user.status}
                </span>
              </div>
            </div>
          </div>
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
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setIsMenuOpen(false)} 
                />
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
                  <button className="w-full px-4 py-2.5 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    Send Message
                  </button>
                  <div className="border-t border-gray-100 my-1"></div>
                  <button className="w-full px-4 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                    Suspend User
                  </button>
                </div>
              </>
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
              <h3 className="mb-4 font-display text-lg font-bold text-gray-900">Recent Activity</h3>
              <div className="space-y-4">
                  {/* Reuse attendance items for demo */}
                  {attendance.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                              <Clock className="h-4 w-4 text-gray-500" />
                          </div>
                          <div>
                              <p className="text-sm font-medium text-gray-900">Attended {item.class}</p>
                              <p className="text-xs text-gray-500">{item.date}</p>
                          </div>
                      </div>
                  ))}
              </div>
           </div>
           <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
               <h3 className="mb-4 font-display text-lg font-bold text-gray-900">Notes</h3>
               <p className="text-sm text-gray-500 italic">No notes added for this user yet.</p>
               <button className="mt-4 text-sm font-bold text-brand-primary hover:underline">+ Add Note</button>
           </div>
          </motion.div>
        )}

        {/* Academy Tab */}
        {activeTab === "academy" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Course Name</th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Progress</th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {paginatedCourses.map((course) => (
                  <tr key={course.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{course.title}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        <div className="w-full max-w-[100px] h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-cyan-dark" style={{ width: `${course.progress}%` }} />
                        </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{course.score}</td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        course.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {course.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination 
                currentPage={academyPage}
                totalPages={academyTotalPages}
                onPageChange={setAcademyPage}
                itemsPerPage={itemsPerPage}
                totalItems={courses.length}
            />
          </motion.div>
        )}

        {/* Classes Tab */}
        {activeTab === "classes" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
             <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Class</th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {paginatedAttendance.map((record) => (
                  <tr key={record.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{record.date}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{record.class}</td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        record.status === 'Present' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {record.status}
                      </span>
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
                totalItems={attendance.length}
            />
          </motion.div>
        )}

        {/* Strikes Tab */}
        {activeTab === "strikes" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
             <div className="flex justify-end">
                <button className="rounded-xl bg-red-50 text-red-600 border border-red-200 px-4 py-2 text-sm font-bold hover:bg-red-100 transition-colors flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Issue Strike
                </button>
             </div>
             
             {strikes.length > 0 ? (
                 <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Reason</th>
                        <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Severity</th>
                        <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-500">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                        {strikes.map((strike) => (
                        <tr key={strike.id}>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{strike.date}</td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{strike.reason}</td>
                            <td className="whitespace-nowrap px-6 py-4">
                                <span className="inline-flex rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
                                    {strike.severity}
                                </span>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                                <button className="text-gray-400 hover:text-red-600">Remove</button>
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
                     <p className="text-gray-500">This user has no active strikes.</p>
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
    </div>
  );
}
