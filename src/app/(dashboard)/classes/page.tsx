"use client";

import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  Users,
  MoreHorizontal,
  Loader2,
  Video,
} from "lucide-react";
import { useState, useEffect } from "react";

import { AddClassModal } from "@/components/classes/AddClassModal";
import { AttendanceModal } from "@/components/classes/AttendanceModal";
import { useClassesStore } from "@/store/classes";

const formatDateTime = (dateStr: string): { date: string; time: string; day: string } => {
  const date = new Date(dateStr);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  let day: string;
  if (date.toDateString() === now.toDateString()) {
    day = "Today";
  } else if (date.toDateString() === tomorrow.toDateString()) {
    day = "Tomorrow";
  } else {
    day = date.toLocaleDateString("en-US", { weekday: "long" });
  }
  
  return {
    date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    time: date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
    day,
  };
};

const formatTimeRange = (start: string, end: string): string => {
  const startTime = new Date(start).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  const endTime = new Date(end).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${startTime} - ${endTime}`;
};

export default function ClassesPage() {
  const { 
    classes, 
    isLoading, 
    error,
    fetchClasses, 
  } = useClassesStore();

  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [attendanceClass, setAttendanceClass] = useState<{ id: number; title: string; date: string } | null>(null);

  useEffect(() => {
    fetchClasses({ limit: 50 });
  }, [fetchClasses]);

  const handleAttendanceClick = (classItem: typeof classes[0]) => {
    const { date } = formatDateTime(classItem.startTime);
    setAttendanceClass({ 
      id: classItem.id, 
      title: classItem.title, 
      date, 
    });
  };

  if (isLoading && classes.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">
            Class Schedule
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage upcoming classes and workshops
          </p>
        </div>
        <button
          onClick={() => setIsAddClassOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-primary/20 transition-all hover:bg-brand-primary/90 active:scale-95"
        >
          <Calendar className="h-5 w-5" />
          Schedule Class
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Content */}
      {classes.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No classes scheduled yet.</p>
          <button
            onClick={() => setIsAddClassOpen(true)}
            className="mt-4 text-brand-primary font-bold hover:underline"
          >
            Schedule your first class
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((session, index) => {
            const { date, day } = formatDateTime(session.startTime);
            const timeRange = formatTimeRange(session.startTime, session.endTime);
            const isPast = new Date(session.startTime) < new Date();
            
            return (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`group relative overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:shadow-md border border-gray-100 ${
                  isPast ? "opacity-75" : ""
                }`}
              >
                {/* Card Content */}
                <div className="bg-brand-primary/5 p-5 pb-8">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`rounded-lg px-3 py-1 text-xs font-bold ${
                      session.type === "WORKSHOP"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-brand-primary/10 text-brand-primary"
                    }`}>
                      {session.type === "WORKSHOP" ? "Workshop" : "Regular Class"}
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="rounded-lg bg-white p-2 text-gray-500 hover:text-brand-primary shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-display text-lg font-bold text-gray-900 mb-1">
                    {session.title}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="font-medium text-brand-primary">{day}</span>
                    <span>•</span>
                    <span>{date}</span>
                  </div>
                </div>

                <div className="p-5 -mt-4 bg-white rounded-t-2xl relative">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        <Clock className="h-3 w-3" />
                        Time
                      </div>
                      <p className="font-semibold text-gray-700">{timeRange}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        <Users className="h-3 w-3" />
                        Capacity
                      </div>
                      <p className="font-semibold text-gray-700">
                        {session.enrolledCount}/{session.capacityMax || "∞"}
                      </p>
                    </div>
                  </div>

                  {session.meetLink && (
                    <a 
                      href={session.meetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mb-4 flex items-center gap-2 text-sm text-brand-primary hover:underline"
                    >
                      <Video className="h-4 w-4" />
                      Join Meeting
                    </a>
                  )}

                  {/* Card Action */}
                  <div className="space-y-2">
                    <button
                      onClick={() => handleAttendanceClick(session)}
                      className="w-full rounded-xl bg-gray-900 py-2.5 text-sm font-bold text-white transition-all hover:bg-gray-800"
                    >
                      Take Attendance
                    </button>
                    <div className="flex gap-3">
                      <button
                        className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-bold text-gray-700 transition-all hover:border-brand-primary hover:text-brand-primary"
                      >
                        Edit
                      </button>
                      <button
                        className="flex-1 rounded-xl border border-red-100 bg-red-50 py-2.5 text-sm font-bold text-red-600 transition-all hover:bg-red-100"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
      
      <AddClassModal 
        isOpen={isAddClassOpen} 
        onClose={() => setIsAddClassOpen(false)} 
      />
      
      <AttendanceModal 
        isOpen={!!attendanceClass} 
        onClose={() => setAttendanceClass(null)} 
        classId={attendanceClass?.id || 0}
        classTopic={attendanceClass?.title || ""}
        classDate={attendanceClass?.date || ""}
      />
    </div>
  );
}
