"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Search, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useState } from "react";

interface Student {
  id: number;
  name: string;
  avatar: string;
  avatarColor: string;
  status: "present" | "absent" | "late" | null;
}

// Mock Students Data
const MOCK_STUDENTS: Student[] = [
  { id: 1, name: "Jane Cooper", avatar: "JC", avatarColor: "bg-red-100 text-red-700", status: null },
  { id: 2, name: "Cody Fisher", avatar: "CF", avatarColor: "bg-orange-100 text-orange-700", status: null },
  { id: 3, name: "Esther Howard", avatar: "EH", avatarColor: "bg-amber-100 text-amber-700", status: null },
  { id: 4, name: "Jenny Wilson", avatar: "JW", avatarColor: "bg-green-100 text-green-700", status: null },
  { id: 5, name: "Kristin Watson", avatar: "KW", avatarColor: "bg-teal-100 text-teal-700", status: null },
];

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  classTopic: string;
  classDate: string;
}

export function AttendanceModal({ isOpen, onClose, classTopic, classDate }: AttendanceModalProps) {
  const [students, setStudents] = useState<Student[]>(MOCK_STUDENTS);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleStatus = (id: number, status: "present" | "absent" | "late") => {
    setStudents(prev => prev.map(s => 
      s.id === id ? { ...s, status: s.status === status ? null : status } : s
    ));
  };

  const handleSave = () => {
    // API Call would go here
    console.log("Saving attendance:", students);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-gray-50/50">
                <div>
                    <h2 className="font-display text-lg font-bold text-gray-900">
                    Take Attendance
                    </h2>
                    <p className="text-sm text-gray-500">{classTopic} • {classDate}</p>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-full p-2 text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

               {/* Search */}
               <div className="p-4 border-b border-gray-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input 
                            type="text"
                            placeholder="Search student..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-2 text-sm outline-none focus:border-brand-primary"
                        />
                    </div>
               </div>

              {/* Student List */}
              <div className="flex-1 overflow-y-auto p-2">
                  <div className="space-y-1">
                      {filteredStudents.map((student) => (
                          <div key={student.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl group">
                              <div className="flex items-center gap-3">
                                  <div className={`h-10 w-10 rounded-full ${student.avatarColor} flex items-center justify-center font-bold text-sm`}>
                                      {student.avatar}
                                  </div>
                                  <span className="font-medium text-gray-900">{student.name}</span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                  <button 
                                    onClick={() => toggleStatus(student.id, "present")}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                        student.status === 'present' 
                                        ? 'bg-green-100 text-green-700 ring-2 ring-green-600/20' 
                                        : 'bg-white border border-gray-200 text-gray-400 hover:border-green-200 hover:text-green-600'
                                    }`}
                                  >
                                      <CheckCircle2 className="h-4 w-4" />
                                      Present
                                  </button>
                                  
                                  <button 
                                    onClick={() => toggleStatus(student.id, "late")}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                        student.status === 'late' 
                                        ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-600/20' 
                                        : 'bg-white border border-gray-200 text-gray-400 hover:border-amber-200 hover:text-amber-600'
                                    }`}
                                  >
                                      <Clock className="h-4 w-4" />
                                      Late
                                  </button>

                                  <button 
                                    onClick={() => toggleStatus(student.id, "absent")}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                        student.status === 'absent' 
                                        ? 'bg-red-100 text-red-700 ring-2 ring-red-600/20' 
                                        : 'bg-white border border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-600'
                                    }`}
                                  >
                                      <XCircle className="h-4 w-4" />
                                      Absent
                                  </button>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>

              {/* Footer */}
              <div className="border-t border-gray-100 bg-gray-50/50 p-4 flex justify-between items-center">
                 <div className="text-sm text-gray-500">
                     <span className="font-bold text-gray-900">{students.filter(s => s.status === 'present').length}</span> Present • 
                     <span className="font-bold text-gray-900 ml-1">{students.filter(s => s.status === 'late').length}</span> Late • 
                     <span className="font-bold text-gray-900 ml-1">{students.filter(s => s.status === 'absent').length}</span> Absent
                 </div>
                 <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="rounded-xl px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="rounded-xl bg-brand-primary px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-primary/20 transition-all hover:bg-brand-primary/90"
                    >
                        Save Attendance
                    </button>
                 </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
