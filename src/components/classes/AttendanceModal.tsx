"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Search, CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

import { useModalLock } from "@/hooks/useModalLock";
import { useClassesStore } from "@/store/classes";
import type { ClassAttendee, AttendanceStatus } from "@/types/admin";

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: number;
  classTopic: string;
  classDate: string;
}

// Helper to get avatar initials and color
const getAvatarConfig = (name: string, index: number) => {
  const colors = [
    "bg-red-100 text-red-700",
    "bg-orange-100 text-orange-700",
    "bg-amber-100 text-amber-700",
    "bg-green-100 text-green-700",
    "bg-teal-100 text-teal-700",
    "bg-blue-100 text-blue-700",
    "bg-indigo-100 text-indigo-700",
    "bg-purple-100 text-purple-700",
    "bg-pink-100 text-pink-700",
  ];
  
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
    
  return {
    initials,
    color: colors[index % colors.length],
  };
};

export function AttendanceModal({ isOpen, onClose, classId, classTopic, classDate }: AttendanceModalProps) {
  useModalLock(isOpen, onClose);
  const { fetchClassAttendees, saveAttendance, selectedClassAttendees, isLoading } = useClassesStore();
  
  const [attendees, setAttendees] = useState<ClassAttendee[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAttendees = async () => {
      setError(null);
      const result = await fetchClassAttendees(classId);
      if (!result.success) {
        setError(result.message || "Error loading attendees");
      }
    };

    if (isOpen && classId) {
      loadAttendees();
    }
  }, [isOpen, classId, fetchClassAttendees]);

  useEffect(() => {
    if (selectedClassAttendees && Array.isArray(selectedClassAttendees)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAttendees(selectedClassAttendees);
    } else {
       
      setAttendees([]);
    }
  }, [selectedClassAttendees]);

  const filteredAttendees = Array.isArray(attendees) ? attendees.filter(a => {
    const fullName = `${a.firstName} ${a.lastName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  }) : [];

  const toggleStatus = (userId: string, status: AttendanceStatus) => {
    setAttendees(prev => prev.map(a => 
      a.userId === userId 
        ? { ...a, attendanceStatus: a.attendanceStatus === status ? null : status } 
        : a,
    ));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    const attendance = attendees
      .filter(a => a.attendanceStatus !== null)
      .map(a => ({
        userId: a.userId,
        status: a.attendanceStatus as AttendanceStatus,
      }));

    const result = await saveAttendance(classId, { attendance });

    setIsSaving(false);

    if (result.success) {
      onClose();
    } else {
      setError(result.message || "Error saving attendance");
    }
  };

  const handleClose = () => {
    setError(null);
    setSearchQuery("");
    onClose();
  };

  const presentCount = attendees.filter(a => a.attendanceStatus === "PRESENT").length;
  const lateCount = attendees.filter(a => a.attendanceStatus === "LATE").length;
  const absentCount = attendees.filter(a => a.attendanceStatus === "ABSENT").length;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
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
                onClick={handleClose}
                className="rounded-full p-2 text-gray-500 hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="mx-6 mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

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
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
                </div>
              ) : filteredAttendees.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  {searchQuery ? "No students found matching your search" : "No students enrolled in this class"}
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredAttendees.map((attendee, index) => {
                    const avatar = getAvatarConfig(`${attendee.firstName} ${attendee.lastName}`, index);
                    const displayStatus = attendee.attendanceStatus;
                          
                    return (
                      <div key={attendee.userId} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl group">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-full ${avatar.color} flex items-center justify-center font-bold text-sm`}>
                            {avatar.initials}
                          </div>
                          <span className="font-medium text-gray-900">
                            {attendee.firstName} {attendee.lastName}
                          </span>
                        </div>
                                
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => toggleStatus(attendee.userId, "PRESENT")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              displayStatus === "PRESENT" 
                                ? "bg-green-100 text-green-700 ring-2 ring-green-600/20" 
                                : "bg-white border border-gray-200 text-gray-400 hover:border-green-200 hover:text-green-600"
                            }`}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                                        Present
                          </button>
                                    
                          <button 
                            onClick={() => toggleStatus(attendee.userId, "LATE")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              displayStatus === "LATE" 
                                ? "bg-amber-100 text-amber-700 ring-2 ring-amber-600/20" 
                                : "bg-white border border-gray-200 text-gray-400 hover:border-amber-200 hover:text-amber-600"
                            }`}
                          >
                            <Clock className="h-4 w-4" />
                                        Late
                          </button>

                          <button 
                            onClick={() => toggleStatus(attendee.userId, "ABSENT")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              displayStatus === "ABSENT" 
                                ? "bg-red-100 text-red-700 ring-2 ring-red-600/20" 
                                : "bg-white border border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-600"
                            }`}
                          >
                            <XCircle className="h-4 w-4" />
                                        Absent
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 bg-gray-50/50 p-4 flex justify-between items-center">
              <div className="text-sm text-gray-500">
                <span className="font-bold text-gray-900">{presentCount}</span> Present • 
                <span className="font-bold text-gray-900 ml-1">{lateCount}</span> Late • 
                <span className="font-bold text-gray-900 ml-1">{absentCount}</span> Absent
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="rounded-xl px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                        Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 rounded-xl bg-brand-primary px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-primary/20 transition-all hover:bg-brand-primary/90 disabled:opacity-50"
                >
                  {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                        Save Attendance
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
