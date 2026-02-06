"use client";

import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  Users,
  MoreHorizontal,
} from "lucide-react";
import { useState } from "react";

import { AddClassModal } from "@/components/classes/AddClassModal";
import { AttendanceModal } from "@/components/classes/AttendanceModal";

// Mock data
type ClassType = "regular" | "workshop";

interface ClassSession {
  id: number;
  title: string;
  type: ClassType;
  day: string;
  date: string;
  time: string;
  capacity: { current: number; max: number | null }; // null max means unlimited
  isEnrolled: boolean;
  meetLink?: string;
  isFull?: boolean;
  description?: string;
  teacher?: string;
}

const upcomingClasses: ClassSession[] = [
  {
    id: 1,
    title: "Conversational Advanced II",
    type: "regular",
    day: "Today",
    date: "Jan 29",
    time: "18:00 - 19:00",
    capacity: { current: 3, max: 5 },
    isEnrolled: true,
    meetLink: "https://meet.google.com/xxx",
    description: "Advanced conversation practice focusing on current events.",
  },
  {
    id: 2,
    title: "Grammar Review Session",
    type: "regular",
    day: "Tomorrow",
    date: "Jan 30",
    time: "17:00 - 18:00",
    capacity: { current: 5, max: 5 },
    isEnrolled: false,
    isFull: true,
    description: "Deep dive into complex grammar structures and common mistakes.",
  },
  {
    id: 3,
    title: "Business English Masterclass",
    type: "workshop",
    day: "Friday",
    date: "Jan 31",
    time: "19:00 - 20:30",
    capacity: { current: 12, max: null },
    isEnrolled: false,
    description: "Open workshop on professional communication skills.",
  },
  {
    id: 4,
    title: "Pronunciation Workshop",
    type: "workshop",
    day: "Saturday",
    date: "Feb 01",
    time: "10:00 - 11:30",
    capacity: { current: 45, max: null },
    isEnrolled: false,
    description: "Interactive session to master difficult phonemes and intonation.",
  },
  {
    id: 5,
    title: "Debate Club: A.I. Ethics",
    type: "regular",
    day: "Saturday",
    date: "Feb 01",
    time: "14:00 - 15:30",
    capacity: { current: 4, max: 8 },
    isEnrolled: false,
    description: "Structured debate practice. Topic: Artificial Intelligence Ethics.",
  },
  {
    id: 6,
    title: "IELTS Prep: Writing Task 2",
    teacher: "Michael Lee",
    type: "regular",
    day: "Monday",
    date: "Feb 03",
    time: "18:00 - 19:00",
    capacity: { current: 2, max: 6 },
    isEnrolled: false,
    description: "Focused strategy session for the IELTS writing component.",
  },
  {
    id: 7,
    title: "Casual Coffee Chat",
    teacher: "Jessica Taylor",
    type: "regular",
    day: "Tuesday",
    date: "Feb 04",
    time: "09:00 - 10:00",
    capacity: { current: 3, max: 5 },
    isEnrolled: false,
    description: "Informal conversation practice over morning coffee.",
  },
  {
    id: 8,
    title: "Tech Vocabulary Workshop",
    teacher: "Daniel Wilson",
    type: "workshop",
    day: "Wednesday",
    date: "Feb 05",
    time: "20:00 - 21:30",
    capacity: { current: 28, max: null },
    isEnrolled: false,
    description: "Learn essential terminology for the technology sector.",
  },
];

export default function ClassesPage() {
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [attendanceClass, setAttendanceClass] = useState<{ topic: string; date: string } | null>(null);

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

      {/* Content */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {upcomingClasses.map((session, index) => (
          <motion.div
            key={session.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group relative overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:shadow-md border border-gray-100"
          >
             {/* Card Content */}
             <div className="bg-brand-primary/5 p-5 pb-8">
                <div className="flex items-start justify-between mb-4">
                  <div className={`rounded-lg px-3 py-1 text-xs font-bold ${
                    session.type === 'workshop'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-brand-primary/10 text-brand-primary'
                  }`}>
                    {session.type === 'workshop' ? 'Workshop' : 'Regular Class'}
                  </div>
                   <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="rounded-lg bg-white p-2 text-gray-500 hover:text-brand-primary shadow-sm">
                          <MoreHorizontal className="h-4 w-4" />
                      </button>
                   </div>
                </div>
                <h3 className="font-display text-lg font-bold text-gray-900 mb-1">
                  {session.title}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="font-medium text-brand-primary">{session.teacher}</span>
                  <span>•</span>
                  <span>{session.date}</span>
                </div>
             </div>

             <div className="p-5 -mt-4 bg-white rounded-t-2xl relative">
                <div className="grid grid-cols-2 gap-4 mb-6">
                   <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        <Clock className="h-3 w-3" />
                         Time
                      </div>
                      <p className="font-semibold text-gray-700">{session.time}</p>
                   </div>
                   <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        <Users className="h-3 w-3" />
                         Capacity
                      </div>
                      <p className="font-semibold text-gray-700">
                        {session.capacity.current}/{session.capacity.max || '∞'}
                      </p>
                   </div>
                </div>

              {/* Card Action */}
              <div className="space-y-2">
                  <button
                    onClick={() => setAttendanceClass({ topic: session.title, date: session.date })}
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
                      Example Cancel
                    </button>
                  </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      <AddClassModal isOpen={isAddClassOpen} onClose={() => setIsAddClassOpen(false)} />
      
      <AttendanceModal 
        isOpen={!!attendanceClass} 
        onClose={() => setAttendanceClass(null)} 
        classTopic={attendanceClass?.topic || ""}
        classDate={attendanceClass?.date || ""}
      />
    </div>
  );
}
